from .models import Friendship
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ('username', 'email', 'password', 'avatar')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],

        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    year_joined = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('username', 'email', 'avatar', 'year_joined')
        read_only_fields = ('username', 'email', 'year_joined')

    def get_year_joined(self, obj):
        return obj.date_joined.year

    def validate_avatar(self, value):
        max_size = 2 * 1024 * 1024
        if value and value.size > max_size:
            raise serializers.ValidationError("The photo size must not exceed 2 MB.")
        return value


class PublicUserSerializer(serializers.ModelSerializer):
    is_following = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ('id', 'username', 'avatar', 'is_following')

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Friendship.objects.filter(follower=request.user, following=obj).exists()

class FriendshipSerializer(serializers.ModelSerializer):
    following_user = PublicUserSerializer(source='folowing', read_only=True)
    class Meta:
        model = Friendship
        fields = ('id', 'following', 'following_user', 'created_at')
        read_only_fields = ('id', 'created_at')