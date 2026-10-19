from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

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
    imdb_rating = models.CharField(max_length=10, blank=True, null=True, verbose_name='Рейтинг IMDb')
    description = models.CharField(blank=True, null=True, verbose_name='Опис')
    release_year = models.IntegerField(blank=True, null=True, verbose_name='Рік випуску')
    poster_url = models.URLField(blank=True, null=True, verbose_name='Url постера')
    seasons = models.PositiveIntegerField(blank=True, null=True, verbose_name="Кількість сезонів")
    duration = models.IntegerField(blank=True, null=True, verbose_name="Тривалість")
    director = models.CharField(max_length=255, blank=True, null=True)
    actors = models.TextField(blank=True, null=True)
    awards = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    language = models.CharField(max_length=255, blank=True, null=True)

    

    def __str__(self):
        return f"{self.title} ({self.get_media_type_display()})"

    class Meta:
        verbose_name = "Медіаконтент"
        verbose_name_plural = "Медіаконтент"

class UserMedia(models.Model):
    STATUS_CHOICE = [
        ('planned', 'Заплановано'),
        ('in_progress', 'Переглядаю'),
        ('completed', 'Переглянуто'),
        ('dropped', 'Покинуто'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='media_list')
    media_item = models.ForeignKey(MediaItem, on_delete=models.CASCADE, related_name='tracked_by')
    status = models.CharField(max_length=20, choices=STATUS_CHOICE, default='planned', verbose_name='Статус')
    score = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name='Оцінка')
    review = models.TextField(blank=True, null=True, verbose_name='Відгук')
    added_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата додавання')
    updated_at = models.DateTimeField(auto_now_add=True, verbose_name='Останнє оновлення')

    class Meta:
        unique_together = ('user', 'media_item')
        verbose_name = "Список користувача"
        verbose_name_plural = "Списки користувачів"

    def __str__(self):
        return f"{self.user.username} - {self.media_item.title} ({self.get_status_display()})"
    