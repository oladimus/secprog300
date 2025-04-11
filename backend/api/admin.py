from django.contrib import admin

from .models import (
    LoginAttempt
)

@admin.register(LoginAttempt)

class ESManagerAdmin(admin.ModelAdmin):
    pass
