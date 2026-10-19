from rest_framework import serializers
from .models import UserMedia, MediaItem

class MediaItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaItem
        fields = '__all__'

class UserMediaSerializer(serializers.ModelSerializer):
    media_item = MediaItemSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = UserMedia
        fields = ['id', 'media_item', 'status', 'status_display', 'score', 'review']