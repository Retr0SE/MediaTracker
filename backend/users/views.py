from rest_framework import generics, status, serializers
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from tracker.models import UserMedia
from .serializers import (RegisterSerializer, UserProfileSerializer,
PublicUserSerializer, FriendshipSerializer, UserRoleUpdateSerializer,
UploadedFileSerializer)
from django.core.cache import cache
from django.db.models import Avg, Q
from rest_framework.response import Response
from .models import Friendship, UploadedFile
from .permissions import IsAdmin, IsOwnerOrAdmin
from collections import Counter
import datetime

from drf_spectacular.utils import extend_schema, inline_serializer


User = get_user_model()


@extend_schema(tags=['Auth'], summary='Реєстрація нового користувача')
class RegisterAPIView(generics.CreateAPIView):
    queryset= User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


@extend_schema(tags=['Users'], summary='Перегляд та редагування профілю')
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


@extend_schema(
    tags=['Auth'],
    summary='Вихід із системи (відкликання refresh-токена)',
    request=inline_serializer(
        name='LogoutRequest',
        fields={
            'refresh': serializers.CharField(required=True, help_text='Refresh токен для додавання в чорний список'),
        }
    ),
    responses={204: None}
)
class LogoutAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request): 
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token not found'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TokenError:
            return Response({'error': 'Invalid or already revoked token'}, status=status.HTTP_401_UNAUTHORIZED)


@extend_schema(tags=['Users'], summary='Пошук користувачів')
class UserSearchAPIView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if query:
            return User.objects.filter(username__icontains=query).exclude(id=self.request.user.id)[:10]
        return User.objects.none()  


@extend_schema(tags=['Users'], summary='Зміна ролі користувача (лише ADMIN)')
class UserRoleUpdateAPIView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRoleUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'
    http_method_names = ['patch']


@extend_schema(
    tags=['Files'],
    summary='Завантаження файлу (JPG, PNG, GIF, PDF до 5 МБ)',
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'file': {'type': 'string', 'format': 'binary'},
            },
            'required': ['file'],
        }
    },
    responses={201: UploadedFileSerializer},
)
class FileUploadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = UploadedFileSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        file_obj = serializer.save()
        return Response(
            {'message': 'File uploaded successfully', 'file': UploadedFileSerializer(file_obj).data},
            status=status.HTTP_201_CREATED
        )

@extend_schema(tags=['Files'], summary='Отримання або видалення файлу за ID')
class FileDetailAPIView(APIView):
    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [AllowAny]

    def get(self, request, file_id):
        file_obj = get_object_or_404(UploadedFile, id=file_id)
        if not file_obj.file or not file_obj.file.storage.exists(file_obj.file.name):
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(file_obj.file.open('rb'), content_type=file_obj.mimetype)

    def delete(self, request, file_id):
        file_obj = get_object_or_404(UploadedFile, id=file_id)
        self.check_object_permissions(request, file_obj)
        file_obj.file.delete(save=False)
        file_obj.delete()
        return Response({'message': 'File successfully deleted'}, status=status.HTTP_200_OK)


@extend_schema(tags=['Users'], summary='Підписатися/відписатися на користувача')
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


@extend_schema(tags=['Users'], summary='Список друзів')
class FollowedUserAPIView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        followed_user_ids = Friendship.objects.filter(follower=self.request.user).values_list('following_id', flat=True)
        return User.objects.filter(id__in=followed_user_ids)


@extend_schema(tags=['Users'], summary='Профіль іншого користувача')
class UserDetailAPIView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = PublicUserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'

@extend_schema(tags=['Users'], summary='Статистика користувача')
class UserProfileStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_media = UserMedia.objects.filter(user=request.user).select_related('media_item')
        
        total_items = user_media.count()
        completed_items = user_media.filter(status='completed')
        rated_items = user_media.filter(score__gt=0)
        
        total_completed = completed_items.count()
        movies_count = completed_items.filter(media_item__media_type='movie').count()
        series_count = completed_items.filter(media_item__media_type='series').count()
        planned_count = user_media.filter(status='planned').count()
        dropped_count = user_media.filter(status='dropped').count()
        written_reviews_count = user_media.exclude(review__exact='').exclude(review__isnull=True).count()
        tens_count = rated_items.filter(score=10).count()

        avg_score_data = rated_items.aggregate(Avg('score'))
        avg_score = round(avg_score_data['score__avg'], 1) if avg_score_data['score__avg'] else 0

        current_year = datetime.date.today().year

        retro_count = 0
        fresh_count = 0
        unique_countries = set()
        total_minutes = 0

        max_duration = 0
        longest_media = None

        max_seasons = 0
        epic_series = None

        max_imdb = 0.0
        top_imdb_media = None

        genres_list = []
        horror_count = 0
        
        for item in completed_items:
            media = item.media_item
            
            try:
                year = int(media.release_year[:4]) if media.release_year else 0
                if year:
                    if year < 1990:
                        retro_count += 1
                    if year >= current_year - 1:
                        fresh_count += 1
            except ValueError:
                pass
                
            try:
                if media.runtime and media.runtime !="N/A":
                    minutes = int(''.join(filter(str.isdigit, str(media.runtime))))
                    total_minutes += minutes

                    if minutes > max_duration:
                        max_duration = minutes
                        longest_media = {
                            'id': media.id,
                            'title': media.title,
                            'poster_url': media.poster_url,
                            'runtime': media.runtime
                        }
            except ValueError:
                pass

            if media.media_type == 'series':
                try:
                    seasons = getattr(media, 'total_seasons', getattr(media, 'seasons', "1"))
                    if seasons and seasons != "N/A":
                        s_count = int(''.join(filter(str.isdigit, str(seasons))))
                        if s_count > max_seasons:
                            max_seasons = s_count
                            epic_series = {
                                'id': media.id,
                                'title': media.title,
                                'poster_url': media.poster_url,
                                'total_seasons': s_count
                            }
                except (ValueError, TypeError):
                    pass
                            
            try:
                if media.imdb_rating and media.imdb_rating != "N/A":
                    rating = float(media.imdb_rating)
                    if rating > max_imdb:
                        max_imdb = rating
                        top_imdb_media = {
                            'id': media.id, 
                            'title': media.title,
                            'poster_url': media.poster_url,
                            'imdb_rating': media.imdb_rating
                        }
            except ValueError:
                pass
                
            if media.country and media.country != "N/A":
                countries = [c.strip() for c in media.country.split(',')]
                unique_countries.update(countries)

            if media.genre and media.genre !='N/A':
                genres = [g.strip() for g in media.genre.split(',')]
                genres_list.extend(genres)
                if any('horror' in g.lower() for g in genres):
                    horror_count += 1
                    
        genre_counts = Counter(genres_list)
        top_genres_raw = genre_counts.most_common(4)
        total_genres = sum(genre_counts.values())
        
        chart_colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']
        chart_data = [
            {'id': name, 'label': name, 'value': count, 'color': chart_colors[i]}
            for i, (name, count) in enumerate(top_genres_raw)
        ]
        
        other_genres_count = total_genres - sum(item['value'] for item in chart_data)
        if other_genres_count > 0:
            chart_data.append({
                'id': 'other', 'label': 'Інше', 'value': other_genres_count, 'color': '#4b5563'
            })

        oldest_media = None
        oldest_record = completed_items.exclude(media_item__release_year='').exclude(media_item__release_year='N/A').order_by('media_item__release_year').first()
        if oldest_record:
            oldest_media = {
                'id': oldest_record.media_item.id,
                'title': oldest_record.media_item.title,
                'poster_url': oldest_record.media_item.poster_url,
                'release_year': oldest_record.media_item.release_year
            }


        masterpieces = [
            {'id': m.media_item.id, 'poster_url': m.media_item.poster_url} 
            for m in rated_items.filter(score=10).order_by('-id')[:5]
        ]

        worst_media = None
        worst_record = rated_items.order_by('score', '-id').first()
        if worst_record and worst_record.score < 5:
            worst_media = {
                'id': worst_record.media_item.id,
                'title': worst_record.media_item.title,
                'poster_url': worst_record.media_item.poster_url,
                'score': worst_record.score
            }

        return Response({
            'stats': {
                'total_saved': total_items,
                'completed': total_completed,
                'movies_count': movies_count,
                'series_count': series_count,
                'avg_score': avg_score,
                'total_minutes': total_minutes,
                'total_days': round(total_minutes / 60 / 24, 1) if total_minutes else 0
            },
            'achievements_data': {
                'retro_count': retro_count,
                'unique_countries': len(unique_countries),
                'horror_count': horror_count,
                'series_completed': series_count,
                'dropped_count': dropped_count,
                'written_reviews': written_reviews_count,
                'tens_count': tens_count,
                'planned_count': planned_count,
                'fresh_count': fresh_count
            },
            'chart_data': chart_data,
            'total_genre_tags': total_genres,
            'records': {
                'oldest': oldest_media,
                'longest': longest_media,
                'epic_series': epic_series,
                'top_imdb': top_imdb_media,
                'worst': worst_media,
                'masterpieces': masterpieces
            }
        })