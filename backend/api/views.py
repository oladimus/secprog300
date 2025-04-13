from django.shortcuts import get_object_or_404, render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import FriendRequestSerializer, FriendSerializer, UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from .models import LoginAttempt, FriendRequest, FriendShip
from django.contrib.auth import authenticate, get_user_model
from rest_framework.serializers import ValidationError

# Create your views here.


def logout_view(request):
    # Blacklist refresh token after logout
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


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]

    @method_decorator(ratelimit(key="ip", rate="5/m", block=True))
    def post(self, request, *args, **kwargs):

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
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            tokens = response.data
            response.data = {"Message": "Token refreshed"}

            response.set_cookie(
                key="access_token",
                value=tokens["access"],
                httponly=True,
                secure=False,  # true for production
                samesite="Lax",
            )
        return response


# check if authenticated and get user e
class checkAuthenticationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "name": user.get_username(),
                "id": user.id,
            },
            status=status.HTTP_200_OK,
        )


class FriendRequestView(generics.CreateAPIView):
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]
    queryset = FriendRequest.objects.all()

    def perform_create(self, serializer):
        receiver_id = self.request.data.get("receiver")
        if int(receiver_id) == self.request.user.id:
            raise ValidationError("You cannot send a friend request to yourself.")
        if FriendRequest.objects.filter(
            sender=self.request.user, receiver_id=receiver_id
        ).exists():
            raise ValidationError("Friend request already sent")
        serializer.save(sender=self.request.user)


class FriendListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        friends = FriendShip.get_friends(user)
        serializer = FriendSerializer(friends, many=True)
        return Response(serializer.data)


class PendingFriendRequestsView(generics.ListAPIView):
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FriendRequest.objects.filter(
            receiver=self.request.user, status="pending"
        )


class RespondToFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
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
            return Response({"detail": "invalid action"}, status=status.HTTP_400_BAD_REQUEST)
