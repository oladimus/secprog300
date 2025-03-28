from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            tokens = response.data

            response.set_cookie(
                key="access_token",
                value=tokens["access"],
                httponly=True,
                secure=True,
                samesite="Lax",
            )

            response.set_cookie(
                key="refresh_token",
                value=tokens["refresh"],
                httponly=True,
                secure=True,
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
                secure=True,
                samesite='Lax'
            )
        return response

class checkAuthenticationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({"message": "Authenticated"}, status=status.HTTP_200_OK)