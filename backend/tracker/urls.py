from django.urls import path
from .views import (UserMediaListAPIView, UserMediaAllAPIView,
                    AddMediaAPIView, DeleteMediaAPIView,
                    LiveSearchAPIView, UpdateMediaAPIView,
                    FriendMediaAPIList, UserMediaDetailAPIView, MediaReviewAPIView,
                    UniversalMediaDetailAPIView)

urlpatterns = [ 
    path('my-list/', UserMediaListAPIView.as_view(), name='my-list'),
    path('my-list/all/', UserMediaAllAPIView.as_view(), name='my-list-all'),
    path('my-list/<int:pk>/', UserMediaDetailAPIView.as_view(), name='my-list-detail'),
    
    path('add/', AddMediaAPIView.as_view(), name='media-add'),
    path('update/<int:pk>/', UpdateMediaAPIView.as_view(), name='media-update'),
    path('delete/<int:pk>/', DeleteMediaAPIView.as_view(), name='media-delete'),

    path('search/', LiveSearchAPIView.as_view(), name='media-search'),
    path('catalog/<int:pk>/', UniversalMediaDetailAPIView.as_view(), name='catalog-detail'),
    path('catalog/<int:media_item_id>/reviews/', MediaReviewAPIView.as_view(), name='catalog-reviews'),

    path('user/<int:user_id>/list/', FriendMediaAPIList.as_view(), name='friend-list'),
]