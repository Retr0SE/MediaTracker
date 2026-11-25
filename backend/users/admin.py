from django.contrib import admin
from .models import Friendship, CustomUser
from django.contrib.auth.admin import UserAdmin

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = list(UserAdmin.fieldsets) + [('Додаткова інформація', {'fields':('avatar', 'role')}),]
    add_fieldsets = UserAdmin.add_fieldsets + ('Додаткова інформація', {'fields':('avatar', 'role')}),
    list_display = ('id', 'username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')

@admin.register(Friendship)
class FriendAdmin(admin.ModelAdmin):
    list_display = ('id', 'follower', 'following', 'created_at')
    search_fields = ('follower__username', 'following__username')
    list_filter = ('created_at',)

