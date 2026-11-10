from django.db import models
from django.conf import settings
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache 


# Create your models here.
class MediaItem(models.Model):
    MEDIA_TYPES = [
        ('movie', 'Фільм'),
        ('series', 'Серіал'),
        ('anime', 'Аніме'),
        ('book', 'Книга'),
    ]

    title = models.CharField(max_length=255, verbose_name='Назва')
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPES, verbose_name='Тип контенту')
    genre = models.CharField(max_length=255, blank=True, null=True, verbose_name="Жанр")
    imdb_id = models.CharField(max_length=20, unique=True, blank=True, null=True)
    imdb_rating = models.CharField(max_length=10, blank=True, null=True, verbose_name='Рейтинг IMDb')
    description = models.CharField(blank=True, null=True, verbose_name='Опис')
    release_year = models.CharField(blank=True, null=True, verbose_name='Рік випуску')
    poster_url = models.URLField(blank=True, null=True, verbose_name='Url постера')
    seasons = models.PositiveIntegerField(blank=True, null=True, verbose_name="Кількість сезонів")
    runtime = models.IntegerField(blank=True, null=True, verbose_name="Тривалість")
    director = models.CharField(max_length=255, blank=True, null=True)
    actors = models.TextField(blank=True, null=True)
    awards = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    language = models.CharField(max_length=255, blank=True, null=True)

    

    def __str__(self):
        return f"{self.title} ({self.get_media_type_display()})"

    class Meta:
        verbose_name = "Список тайтлів"
        verbose_name_plural = "Список тайтлів"

class UserMedia(models.Model):
    STATUS_CHOICE = [
        ('planned', 'Заплановано'),
        ('in_progress', 'Переглядаю'),
        ('completed', 'Переглянуто'),
        ('dropped', 'Покинуто'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='media_list')
    media_item = models.ForeignKey(MediaItem, on_delete=models.CASCADE, related_name='tracked_by')
    status = models.CharField(max_length=20, choices=STATUS_CHOICE, default='planned', verbose_name='Статус')
    score = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name='Оцінка')
    review = models.TextField(blank=True, null=True, verbose_name='Відгук')
    added_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата додавання')
    updated_at = models.DateTimeField(auto_now_add=True, verbose_name='Останнє оновлення')

    class Meta:
        unique_together = ('user', 'media_item')
        verbose_name = "Список тайтлів користувача"
        verbose_name_plural = "Списки тайтлів користувачів"

    def __str__(self):
        return f"{self.user.username} - {self.media_item.title} ({self.get_status_display()})"


@receiver(post_save, sender=UserMedia)
@receiver(post_delete, sender=UserMedia)
def clear_user_media_cache(sender, instance, **kwargs):
    keys_to_delete = [f'user_media_list_{instance.user_id}_page_{i}' for i in range(1,21)]
    cache.delete_many(keys_to_delete)
    print(f"REDIS: Cache automatically cleared for user {instance.user_id} via Signal")