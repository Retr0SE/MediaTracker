from django.urls import path
from .views import UserMediaAPIList, AddMediaAPIView, DeleteMediaAPIView, LiveSearchAPIView, UpdateMediaAPIView

urlpatterns = [ 
    path('my-list/', UserMediaAPIList.as_view(), name='api-my-list'),
    path('add/', AddMediaAPIView.as_view(), name='api-add-media'),
    path('delete/<int:pk>/', DeleteMediaAPIView.as_view(), name='api-delete-media'),
    path('update/<int:pk>/', UpdateMediaAPIView.as_view(), name='api-update-media'),
    path('search/', LiveSearchAPIView.as_view(), name='api-search-media'),
]
