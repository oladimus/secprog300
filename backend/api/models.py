from django.db import models

# Create your models here.

class LoginAttempt(models.Model):
    username = models.CharField(max_length=30)
    success = models.BooleanField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_env = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(null=True, blank=True)

    def __str__(self):
        status = "Success" if self.success else "Failed"
        return f"{self.timestamp} - {self.username} - {status}"
    