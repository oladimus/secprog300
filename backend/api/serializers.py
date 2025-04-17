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

    def validate(self, attributes):
        user = User(username = attributes.get("username"))
        try:
            validate_password(attributes.get("password"), user)
        except ValidationError as err:
            raise serializers.ValidationError({"password": err.messages})
        return attributes
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]

class FriendRequestSerializer(serializers.ModelSerializer):
    sender = FriendSerializer(read_only=True)
    receiver = FriendSerializer(read_only=True)
    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'status', 'created_at']
