from django.db import models
from django.db.models import UniqueConstraint
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    e2ee_public_key = models.TextField(null=True, blank=True)

    def has_key(self):
        if self.e2ee_public_key == (None or ""):
            return False
        else:
            return True
            
    

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
    

class FriendRequest(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_friend_request')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_friend_request')
    status = models.CharField(max_length=10, choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')], default='pending')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        constraints = [
            UniqueConstraint(fields=['sender', 'receiver'], name='friendrequest_constraint')
        ]
    
    def __str__(self):
        return f"{self.sender.get_username()} sent friend request to {self.receiver.get_username()} | {self.status}"

    def clean(self):
        if self.sender == self.receiver:
            raise ValidationError("You cannot send a friend request to yourself.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def accept(self):
        FriendShip.objects.create(user1=self.sender, user2= self.receiver)
        self.delete()

    def reject(self):
        #self.status = 'rejected'
        #self.save()
        self.delete()

class FriendShip(models.Model):
    user1 = models.ForeignKey(User, related_name='friend1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(User, related_name='friend2', on_delete=models.CASCADE)
    created = models.DateTimeField(default=timezone.now)
    
    class Meta:
        constraints = [
            UniqueConstraint(fields=['user1','user2'], name='friendship_constraint')
        ]
    def __str__(self):
        return f"{self.user1.get_username()} & {self.user2.get_username()}"
    
    @staticmethod
    def get_friends(user):
        friendships = FriendShip.objects.filter(models.Q(user1=user) | models.Q(user2=user))
        friends = [f.user2 if f.user1 == user else f.user1 for f in friendships]
        return friends
    
class Message(models.Model):
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_messages', on_delete=models.CASCADE)
    content = models.TextField() # Encrypted
    timestamp = models.DateTimeField(auto_now_add=True)
    iv = models.CharField(max_length=64) # for AES-GCM