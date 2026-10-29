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


# Create your views here.

class UserMediaAPIList(generics.ListAPIView):
    serializer_class = UserMediaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserMedia.objects.filter(user=self.request.user).select_related('media_item').all()


class AddMediaAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        title = request.data.get('title')
        media_type = request.data.get('media_type', 'movie')

        if not title:
            return Response({'error': "Назва обов'язкова"}, status=status.HTTP_400_BAD_REQUEST)

        media_data = fetch_omdb_info(title, media_type)

        if media_data:
            media_item, _ = MediaItem.objects.get_or_create(
                title = title,
                media_type = media_type,
                defaults=media_data
            )
        
            user_media, created = UserMedia.objects.get_or_create(
                user = request.user,
                media_item = media_item,
                defaults={'status': 'planned'}
            )

            if created:
                return Response({'message': "Фільм успішно додано!"}, status=status.HTTP_201_CREATED)
            else:
                return Response({'message': "Цей фільм вже є у вашому списку."}, status=status.HTTP_200_OK)
        else:
            return Response({'message': "Фільм не знайдено в OMDb."}, status=status.HTTP_404_NOT_FOUND)


class DeleteMediaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            media_to_delete = UserMedia.objects.get(id=pk, user=request.user)
            media_to_delete.delete()
            return Response({'message': 'Фільм видалено'}, status=status.HTTP_204_NO_CONTENT)
        except UserMedia.DoesNotExist:
            return Response({'error': 'Фільм не знайдено'}, status=status.HTTP_404_NOT_FOUND)

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
            return Response({'message': 'Успішно оновлено!'})
        except UserMedia.DoesNotExist:
            return Response({'message': 'Фільм не знайдено'}, status=status.HTTP_404_NOT_FOUND)

