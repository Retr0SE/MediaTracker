from django.urls import path
from .views import RegisterAPIView, UserProfileAPIView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='api-register'),
    path('profile/', UserProfileAPIView.as_view(), name='user-profile'),


]
