from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
import os, uuid



class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        USER = 'USER', 'Користувач'
        MODERATOR = 'MODERATOR', 'Модератор'
        ADMIN = 'ADMIN', 'Адміністратор'

    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER
    )

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

def upload_to_unique(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    return f'uploads/{uuid.uuid4().hex}{ext}'

class UploadedFile(models.Model):
    file = models.FileField(upload_to=upload_to_unique)
    original_name = models.CharField(max_length=255)
    mimetype = models.CharField(max_length=100)
    size = models.PositiveIntegerField()
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_files'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Завантажений файл'
        verbose_name_plural = 'Завантажені файли'

    def __str__(self):
        return f"{self.original_name} ({self.uploaded_by.username})"
    