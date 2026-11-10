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

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.SerializerMethodField()

    is_friend = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = UserMedia
        fields = ['id', 'username', 'user_avatar', 'score', 'review', 'added_at', 'status', 'is_friend', 'is_mine']

    def get_user_avatar(self, obj):
        if obj.user.avatar:
            return obj.user.avatar.url if hasattr(obj.user.avatar, 'url') else str(obj.user.avatar) 
        return None

    def get_is_friend(self, obj):
        return getattr(obj, 'priority', 0) == 1
        
    def get_is_mine(self, obj):
       return getattr(obj, 'priority', 0) == 2

class UniversalMediaDetailSerializer(serializers.ModelSerializer):
    user_record = serializers.SerializerMethodField()
    class Meta:
        model = MediaItem
        fields = '__all__'

    def get_user_record(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        user = request.user
        user_media = UserMedia.objects.filter(media_item=obj, user=user).first()
        
        if user_media:
            return {
                'id': user_media.id,
                'status': user_media.status,
                'score': user_media.score,
                'review': user_media.review,
                'added_at': user_media.added_at
            }
        return None
