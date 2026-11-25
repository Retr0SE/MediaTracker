from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    message = 'Insufficient permissions: access is allowed only to administrator.'
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'ADMIN' or request.user.is_superuser)
        )

class IsAdminOrModerator(BasePermission):
    message = 'Insufficient permissions: access is allowed only to moderator or administrator.'
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role in ('MODERATOR', 'ADMIN') or request.user.is_superuser)
        )

class IsOwnerOrAdmin(BasePermission):
    message = 'You can modify or delete only your resources.'
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN' or request.user.is_superuser:
            return True
        owner = getattr(obj, 'user', None) or getattr(obj, 'uploaded_by', None)
        return owner