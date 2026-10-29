from .models import CustomUser 
from rest_framework import serializers

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model  = CustomUser
        fields = ('username', 'email', 'password', 'avatar')

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],

        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    year_joined = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'avatar', 'year_joined')
        read_only_fields = ('username', 'email', 'year_joined')

    def get_year_joined(self, obj):
        return obj.date_joined.year

    def validate_avatar(self, value):
        max_size = 2 * 1024 * 1024
        if value and value.size > max_size:
            raise serializers.ValidationError("Розмір фото не має перевищувати 2 МБ.")
        return value