from django.shortcuts import get_object_or_404, render
from django.contrib.auth import get_user_model
from django.contrib.auth.views import LoginView
from rest_framework import generics
from django.db.models import Q
from .serializers import (
    FriendRequestSerializer,
    FriendSerializer,
    UserSerializer,
    MessageSerializer,
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from .models import LoginAttempt, FriendRequest, FriendShip, Message
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import ensure_csrf_cookie
from .utils import csrf_check
import time
import redis


r = redis.Redis(host="redis", port=6379, db=0)
User = get_user_model()


def handle_violation(request):
    """Progressive rate limit for failed login attempts"""

    ip = request.META.get("REMOTE_ADDR")
    key = f"rate_violation:{ip}"
    count = r.incr(key)
    r.expire(key, 3600)  # violation expires in one hour

    if count == 1:
        r.setex(f"ban:{ip}", 60, 1)  # first block for 1 min

    elif count == 2:
        r.setex(f"ban:{ip}", 600, 1)  # 2nd block for 10 mins

    elif count >= 3:
        r.setex(f"ban:{ip}", 1800, 1)  # 3rd block for 30 mins


class UpdateUserView(APIView):
    """View to update user information"""

    permission_classes = [IsAuthenticated]
    allowed_fields = ["first_name", "last_name", "e2ee_public_key"]

    def post(self, request, *args, **kwargs):
        csrf_error = csrf_check(request)
        if csrf_error:
            return csrf_error
        target_field = request.data.get("update_what")
        if target_field not in self.allowed_fields:
            return Response({"detail": "Field not allowed to be updated."}, status=403)
        value = request.data.get("value")
        user = request.user

        if not hasattr(user, target_field):
            return Response(
                {"detail": "Invalid field."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            setattr(user, target_field, value)
            user.save()
            return Response({"detail": "User info updated."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": f"User info update failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

def logout_view(request):
    """Blacklist refresh token after logout"""
    csrf_error = csrf_check(request)
    if csrf_error:
        return csrf_error
    refresh_token = request.COOKIES.get("refresh_token")
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            pass
        except InvalidToken:
            pass

    response = JsonResponse({"message": "Logged out successfully"})
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    response.status_code = 200
    return response


class CustomAdminLoginView(LoginView):
    template_name = "admin/login.html"

    @method_decorator(ratelimit(key="ip", rate="5/m", block=False))
    def dispatch(self, request, *args, **kwargs):
        ip = request.META.get("REMOTE_ADDR")
        if r.exists(f"ban:{ip}"):
            return HttpResponse(
                f"Temporarily banned, too many login attempts", status=429
            )
        if getattr(request, "limited", False):
            handle_violation(request)
            return HttpResponse(
                {"Too many login attempts. Try again later."}, status=429
            )
        return super().dispatch(request, *args, **kwargs)


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    @method_decorator(ratelimit(key="ip", rate="100/h", block=True))
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)


@method_decorator(ensure_csrf_cookie, name="post")
class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]

    @method_decorator(ratelimit(key="ip", rate="5/m", block=False))
    def post(self, request, *args, **kwargs):
        # Check if person is blocked due to too many login attempts
        ip = request.META.get("REMOTE_ADDR")
        if r.exists(f"ban:{ip}"):
            duration = r.expiretime(f"ban:{ip}") - int(time.time())
            return Response(
                {
                    "detail": f"Temporarily banned: too many login attempts, {duration} seconds remaining"
                },
                status=429,
            )
        # Check if person exceeded the rate limit and handle the violation
        if getattr(request, "limited", "false"):
            handle_violation(request)
            return Response({"detail": "Too many login attempts!"}, status=429)

        # For logging the login attempt:
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        login_attempt = LoginAttempt(
            username=username,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_env=request.META.get("HTTP_USER_AGENT"),
        )

        if user is None:
            login_attempt.success = False
            login_attempt.reason = "Invalid credentials"
            login_attempt.save()
        else:
            login_attempt.success = True
            login_attempt.save()

        # Authentication
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            tokens = response.data

            response.set_cookie(
                key="access_token",
                value=tokens["access"],
                httponly=True,
                secure=False,  # true for production
                samesite="Lax",  # Strict?
            )

            response.set_cookie(
                key="refresh_token",
                value=tokens["refresh"],
                httponly=True,
                secure=False,  # true for production
                samesite="Lax",
            )
        return response


class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response(
                {"detail": "Missing refresh token"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            response = Response({"Message": "Token refreshed"})
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,  # true for production
                samesite="Lax",
            )
            return response
        except TokenError:
            return Response({"detail": "Invalid refresh token"}, status=401)



@method_decorator(ensure_csrf_cookie, name="get")
class checkAuthenticationView(APIView):
    # check if authenticated and get user information
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {"name": user.get_username(), "id": user.id, "has_key": user.has_key()},
            status=status.HTTP_200_OK,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_friend(request):
    csrf_error = csrf_check(request)
    if csrf_error:
        return csrf_error

    friend_username = request.data.get("friend")
    if not friend_username:
        return Response({"detail": "No friend specified."}, status=400)

    try:
        friend_user = User.objects.get(username=friend_username)
    except User.DoesNotExist:
        return Response({"detail": "User does not exist."}, status=404)

    try:
        friendship = FriendShip.objects.get(
            Q(user1=request.user, user2=friend_user)
            | Q(user1=friend_user, user2=request.user)
        )
        friendship.delete()
        return Response({"detail": "Friend removed successfully."}, status=200)
    except FriendShip.DoesNotExist:
        return Response({"detail": "No friendship between users."}, status=404)


class FriendRequestView(generics.CreateAPIView):
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]
    queryset = FriendRequest.objects.all()

    def create(self, request, *args, **kwargs):
        csrf_error = csrf_check(request)
        if csrf_error:
            return csrf_error
        receiver_name = request.data.get("receiver")

        if not receiver_name:
            return Response(
                {"detail": "Enter a username."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if receiver_name == request.user.get_username():
            return Response(
                {"detail": "You cannot send a friend request to yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            receiver = User.objects.get(username=receiver_name)
        except User.DoesNotExist:
            return Response(
                {"detail": "User does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if FriendRequest.objects.filter(
            Q(sender=request.user, receiver=receiver)
            | Q(sender=receiver, receiver=request.user)
        ).exists():
            return Response(
                {"detail": "Friend request already sent."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if FriendShip.objects.filter(
            Q(user1=request.user, user2=receiver)
            | Q(user1=receiver, user2=request.user)
        ).exists():
            return Response(
                {"detail": "Friend already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(sender=request.user, receiver=receiver)

        return Response(
            {"detail": "Friend request sent!"}, status=status.HTTP_201_CREATED
        )


class FriendListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        friends = FriendShip.get_friends(user)
        serializer = FriendSerializer(friends, many=True, read_only=True)
        return Response(serializer.data)


class PendingFriendRequestsView(generics.ListAPIView):
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FriendRequest.objects.filter(
            receiver=self.request.user, status="pending"
        )


class SentFriendRequestsView(generics.ListAPIView):
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FriendRequest.objects.filter(sender=self.request.user, status="pending")


class RespondToFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        csrf_error = csrf_check(request)
        if csrf_error:
            return csrf_error
        try:
            friend_request = FriendRequest.objects.get(pk=pk, receiver=request.user)
        except FriendRequest.DoesNotExist:
            return Response(
                {"detail": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND
            )

        action = request.data.get("action")

        if action == "accept":
            friend_request.accept()
            return Response({"detail": "Friend request accepted"})
        elif action == "reject":
            friend_request.reject()
            return Response({"detail": "Friend request rejected"})
        else:
            return Response(
                {"detail": "invalid action"}, status=status.HTTP_400_BAD_REQUEST
            )


class MessageView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    queryset = Message.objects.all()

    def create(self, request, *args, **kwargs):
        csrf_error = csrf_check(request)
        if csrf_error:
            return csrf_error

        receiver_id = request.data.get("receiver_id")
        receiver = User.objects.get(id=receiver_id)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(sender=request.user, receiver=receiver)
        return Response({"detail": "Message sent!"}, status=status.HTTP_201_CREATED)
    
    def delete(self, request, *args, **kwargs):
        csrf_error = csrf_check(request)
        if csrf_error:
            return csrf_error
        user = request.user
        messages = Message.objects.filter(sender=user) | Message.objects.filter(receiver=user)
        messages.delete()
        return Response({"detail": "Message history deleted"})
    
    def get(self, request, *args, **kwargs):
        other_user_id = request.query_params.get("with")
        if not other_user_id:
            return Response({"detail": "Missing id."}, status=400)

        messages = Message.objects.filter(
            sender=request.user, receiver__id=other_user_id
        ) | Message.objects.filter(
            sender__id=other_user_id, receiver=request.user
        )
        messages = messages.order_by("timestamp")
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)