from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from .models import (
    LoginAttempt,
    FriendRequest,
    FriendShip,
)

User = get_user_model()

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    fieldsets = UserAdmin.fieldsets + (
        ("Custom Fields", {
            "fields": ("e2ee_public_key",)
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Custom Fields", {
            "fields": ("e2ee_public_key",)
        }),
    )

@admin.register(LoginAttempt)
@admin.register(FriendShip)
@admin.register(FriendRequest)

class Admin(admin.ModelAdmin):
    pass
