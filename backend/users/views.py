from rest_framework import generics
from .models import CustomUser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import RegisterSerializer, UserProfileSerializer
from django.core.cache import cache
from rest_framework.response import Response
# Create your views here.

class RegisterAPIView(generics.CreateAPIView):
    queryset= CustomUser.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        cache_key = f"user_profile_{request.user.id}"
        cached_profile = cache.get(cache_key)

        if cached_profile:
            print("REDIS: User profile fetched from cache.")
            return Response(cached_profile)

        print("PostgreSQL: Querying user profile from DB...")
        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=3600)
        return response
    
    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        cache_key = f"user_profile_{request.user.id}"
        cache.delete(cache_key)
        print("REDIS: User profile cache invalidated.")
        return response