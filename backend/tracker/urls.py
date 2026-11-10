from django.urls import path
from .views import UserMediaListAPIView, UserMediaAllAPIView, AddMediaAPIView, DeleteMediaAPIView, LiveSearchAPIView, UpdateMediaAPIView, FriendMediaAPIList, UserMediaDetailAPIView, MediaReviewAPIView, UniversalMediaDetailAPIView

urlpatterns = [ 
    path('my-list/', UserMediaListAPIView.as_view(), name='api-my-list'),
    path('my-list/all/', UserMediaAllAPIView.as_view(), name='media-list-all'),
    path('catalog/<int:media_item_id>/reviews/', MediaReviewAPIView.as_view(), name='media-reviews'),
    path('catalog/<int:pk>/', UniversalMediaDetailAPIView.as_view(), name='universal-media-detail'),

    path('detail/<int:pk>/', UserMediaDetailAPIView.as_view(), name='api-my-list'),
    path('add/', AddMediaAPIView.as_view(), name='api-add-media'),
    path('delete/<int:pk>/', DeleteMediaAPIView.as_view(), name='api-delete-media'),
    path('update/<int:pk>/', UpdateMediaAPIView.as_view(), name='api-update-media'),

    path('search/', LiveSearchAPIView.as_view(), name='api-search-media'),
    path('user/<int:user_id>/list/', FriendMediaAPIList.as_view(), name='friend-media-list'),
]
