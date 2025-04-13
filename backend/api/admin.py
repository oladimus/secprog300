from django.contrib import admin

from .models import (
    LoginAttempt,
    FriendRequest,
    FriendShip,
)

@admin.register(LoginAttempt)
@admin.register(FriendShip)
@admin.register(FriendRequest)

class Admin(admin.ModelAdmin):
    pass
