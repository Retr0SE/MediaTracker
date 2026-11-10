from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings



class CustomUser(AbstractUser):
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    class Meta:
        verbose_name = 'Список користувачів'
        verbose_name_plural = 'Список користувачів'

class Friendship(models.Model):
    follower = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='following', on_delete=models.CASCADE)
    following = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='followers', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
        verbose_name = 'Дружба'
        verbose_name_plural = 'Дружба'

    def __str__(self):
        return f"{self.follower.username} стежить за {self.following.username}"