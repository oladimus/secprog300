from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer
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
from .models import LoginAttempt
from django.contrib.auth import authenticate


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
    @method_decorator(ratelimit(key='ip', rate='5/m', block=True))
    def post(self, request, *args, **kwargs):

        # For logging the login attempt:
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        login_attempt = LoginAttempt(
            username=username,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_env=request.META.get('HTTP_USER_AGENT')
        )

        if user is None:
            login_attempt.success = False
            login_attempt.reason = "Invalid credentials"
            login_attempt.save()
        else :
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
                secure=False, # true for production
                samesite="Lax", # Strict?
            )

            response.set_cookie(
                key="refresh_token",
                value=tokens["refresh"],
                httponly=True,
                secure=False, # true for production
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
                key='access_token',
                value=tokens['access'],
                httponly=True,
                secure=False,# true for production
                samesite='Lax'
            )
        return response


class checkAuthenticationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({"message": "Authenticated"}, status=status.HTTP_200_OK)
    
