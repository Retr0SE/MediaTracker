from .models import UserMedia, MediaItem
from rest_framework import generics, status 
from .serializers import UserMediaSerializer
from rest_framework.permissions import IsAuthenticated
from .utils import fetch_omdb_info
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
import requests
from rest_framework.decorators import api_view, permission_classes
from django.core.cache import cache


# Create your views here.

class UserMediaAPIList(generics.ListAPIView):
    serializer_class = UserMediaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserMedia.objects.filter(user=self.request.user).select_related('media_item').all()

    def list(self, request, *args, **kwargs):
        cache_key = f'user_media_list_{request.user.id}'
        cached_data = cache.get(cache_key)
        if cached_data:
            print('REDIS: Media list fetched from cache.')
            return Response(cached_data)
        print('PostgreSQL: Querying media list from DB...')

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        cache.set(cache_key, serializer.data, timeout=900)

        return Response(serializer.data)

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
                media_item, _= MediaItem.objects.get_or_create(
                    imdb_id = exact_imdb_id,
                    defaults={
                        'title': title,
                        'media_type': media_type,
                        **media_data
                    }
                )
            else:
                media_item, _= MediaItem.objects.get_or_create(
                    title=exact_title,
                    media_type=media_type,
                    defaults=media_data,
                )

            user_media, created = UserMedia.objects.get_or_create(
                user = request.user,
                media_item = media_item,
                defaults={'status': 'planned'}
            )

            if created:
                cache.delete(f'user_media_list_{request.user.id}')
                print(f"REDIS: Cache cleared for user {request.user.id}")
                return Response({'message': 'Media successfully added to list.'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'message': 'Media already exists in list.'}, status=status.HTTP_200_OK)
        else:
            return Response({'message': "Media not found in OMDb."}, status=status.HTTP_404_NOT_FOUND)


class DeleteMediaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            media_to_delete = UserMedia.objects.get(id=pk, user=request.user)
            media_to_delete.delete()
            cache.delete(f'user_media_list_{request.user.id}')
            return Response({'message': 'The film has been removed.'}, status=status.HTTP_204_NO_CONTENT)
        except UserMedia.DoesNotExist:
            return Response({'error': 'Film not found'}, status=status.HTTP_404_NOT_FOUND)

class LiveSearchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')

        if len(query) < 3:
            return Response([])
        url = "http://www.omdbapi.com/"
        params = {
            'apikey' : settings.OMDB_API_KEY,
            's': query,
        }

        try:
            response = requests.get(url, params=params)
            data = response.json()
            if data.get('Response') == 'True':
                return Response(data.get('Search', []))
            else:
                return Response([])
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class UpdateMediaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            user_media = UserMedia.objects.get(id=pk, user=request.user)

            new_status = request.data.get('status')
            if new_status:
                user_media.status = new_status

            new_score = request.data.get('score')
            if new_score is not None:
                user_media.score = new_score

            if 'review' in request.data:
                user_media.review = request.data.get('review')  

            user_media.save()
            cache.delete(f'user_media_list_{request.user.id}')
            return Response({'message': 'Successfully updated!'})
        except UserMedia.DoesNotExist:
            return Response({'message': 'Film not found'}, status=status.HTTP_404_NOT_FOUND)


