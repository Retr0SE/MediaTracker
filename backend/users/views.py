from rest_framework import generics, status
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from .serializers import RegisterSerializer, UserProfileSerializer, PublicUserSerializer, FriendshipSerializer
from django.core.cache import cache
from rest_framework.response import Response
from .models import Friendship
# Create your views here.
User = get_user_model()

class RegisterAPIView(generics.CreateAPIView):
    queryset= User.objects.all()
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

class UserSearchAPIView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if query:
            return User.objects.filter(username__icontains=query).exclude(id=self.request.user.id)[:10]
        return User.objects.none()  

class ToggleFriendshipAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        user_to_follow = get_object_or_404(User, id=user_id)

        if user_to_follow == request.user:
            return Response({"error": "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)
        
        friendship = Friendship.objects.filter(follower=request.user, following=user_to_follow).first()

        if friendship:
            friendship.delete()
            return Response({"status": "unfollowed"}, status=status.HTTP_200_OK)
        else:
            Friendship.objects.create(follower=request.user, following=user_to_follow)
            return Response({"status": "followed"}, status=status.HTTP_201_CREATED)


class FollowedUserAPIView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        followed_user_ids = Friendship.objects.filter(follower=self.request.user).values_list('following_id', flat=True)
        return User.objects.filter(id__in=followed_user_ids)


class UserDetailAPIView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = PublicUserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'