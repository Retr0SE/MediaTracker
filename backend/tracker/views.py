# 1. Сторонні бібліотеки (Third-party imports)
import requests
from django.conf import settings
from django.core.cache import cache
from django.db.models import F, Case, When, Value, IntegerField
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserMedia, MediaItem
from .serializers import UserMediaSerializer, ReviewSerializer, UniversalMediaDetailSerializer
from .utils import fetch_omdb_info


class NullsLastOrderingFilter(filters.OrderingFilter):
    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        if ordering:
            f_ordering = []
            for field in ordering:
                if field.startswith('-'):
                    f_ordering.append(F(field[1:]).desc(nulls_last=True))
                else:
                    f_ordering.append(F(field).asc(nulls_last=True))
            return queryset.order_by(*f_ordering)
        return queryset


class LiveSearchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')

        if len(query) < 3:
            return Response([])
            
        url = "http://www.omdbapi.com/"
        params = {
            'apikey': settings.OMDB_API_KEY,
            's': query,
        }

        try:
            response = requests.get(url, params=params)
            data = response.json()
            if data.get('Response') == 'True':
                return Response(data.get('Search', []))
            return Response([])
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserMediaListAPIView(generics.ListAPIView):
    serializer_class = UserMediaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, NullsLastOrderingFilter]
    filterset_fields = ['status', 'media_item__media_type']
    ordering_fields = ['id', 'score', 'media_item__title', 'media_item__release_year']
    ordering = ['-id']

    def get_queryset(self):
        return UserMedia.objects.filter(user=self.request.user).select_related('media_item')


class UserMediaAllAPIView(generics.ListAPIView):
    """Список без пагінації (наприклад, для експорту чи дашборду)"""
    serializer_class = UserMediaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return UserMedia.objects.filter(user=self.request.user).select_related('media_item')


class UserMediaDetailAPIView(generics.RetrieveAPIView):
    serializer_class = UserMediaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserMedia.objects.filter(user=self.request.user).select_related('media_item')


class AddMediaAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        title = request.data.get('title')
        media_type = request.data.get('media_type', 'movie')
        imdb_id = request.data.get('imdb_id')

        if not title:
            return Response({'error': "Name or ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        media_data = fetch_omdb_info(title, media_type, imdb_id)

        if media_data:
            exact_title = media_data.pop('title', title)
            exact_imdb_id = media_data.pop('imdb_id', imdb_id)

            if exact_imdb_id:
                media_item, _ = MediaItem.objects.get_or_create(
                    imdb_id=exact_imdb_id,
                    defaults={
                        'title': title,
                        'media_type': media_type,
                        **media_data
                    }
                )
            else:
                media_item, _ = MediaItem.objects.get_or_create(
                    title=exact_title,
                    media_type=media_type,
                    defaults=media_data,
                )

            user_media, created = UserMedia.objects.get_or_create(
                user=request.user,
                media_item=media_item,
                defaults={'status': 'planned'}
            )

            if created:
                return Response({'message': 'Media successfully added to list.'}, status=status.HTTP_201_CREATED)
            return Response({'message': 'Media already exists in list.'}, status=status.HTTP_200_OK)
            
        return Response({'message': "Media not found in OMDb."}, status=status.HTTP_404_NOT_FOUND)


class UpdateMediaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        # Використовуємо get_object_or_404 для чистоти коду
        user_media = get_object_or_404(UserMedia, id=pk, user=request.user)

        new_status = request.data.get('status')
        if new_status:
            user_media.status = new_status

        new_score = request.data.get('score')
        if new_score is not None:
            user_media.score = new_score

        if 'review' in request.data:
            user_media.review = request.data.get('review')  

        user_media.save()
        return Response({'message': 'Successfully updated!'})


class DeleteMediaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        # Використовуємо get_object_or_404 замість try...except
        media_to_delete = get_object_or_404(UserMedia, id=pk, user=request.user)
        media_to_delete.delete()
        return Response({'message': 'The film has been removed.'}, status=status.HTTP_204_NO_CONTENT)



class UniversalMediaDetailAPIView(generics.RetrieveAPIView):
    queryset = MediaItem.objects.all()
    serializer_class = UniversalMediaDetailSerializer
    permission_classes = [IsAuthenticated]


class FriendMediaAPIList(generics.ListAPIView):
    serializer_class = UserMediaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        friend_id = self.kwargs.get('user_id')
        return UserMedia.objects.filter(user_id=friend_id).select_related('media_item').order_by('-added_at')

    def list(self, request, *args, **kwargs):
        friend_id = self.kwargs.get('user_id')
        page = request.query_params.get('page', 1)

        cache_key = f'user_media_list_{friend_id}_page_{page}'
        cached_data = cache.get(cache_key)

        if cached_data:
            print(f'REDIS: Friend media list (ID {friend_id}, Page {page} from cache...)')
            return Response(cached_data)

        print(f'PostgreSQL: Querying friend media list (ID {friend_id}, Page {page} from DB...)')
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=900)
        return response


class MediaReviewAPIView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        media_id = self.kwargs.get('media_item_id')
        user = self.request.user

        friends_ids = list(user.following.values_list('following_id', flat=True))
        queryset = UserMedia.objects.filter(media_item_id=media_id).exclude(review__exact='')
        
        queryset = queryset.annotate(
            priority=Case(
                When(user=user, then=Value(2)),
                When(user_id__in=friends_ids, then=Value(1)),
                default=Value(0),
                output_field=IntegerField()
            )
        )

        return queryset.order_by('-priority', 'added_at')