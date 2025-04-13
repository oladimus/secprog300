from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from .models import FriendRequest, FriendShip


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as err:
            raise serializers.ValidationError({"password": err.messages})
        return value
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class FriendRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'status', 'created_at']
        read_only_fields = ['sender', 'status', 'created_at']

class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username"]
