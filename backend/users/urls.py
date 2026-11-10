from django.urls import path
from .views import RegisterAPIView, UserProfileAPIView, UserSearchAPIView, ToggleFriendshipAPIView, FollowedUserAPIView, UserDetailAPIView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='api-register'),
    path('profile/', UserProfileAPIView.as_view(), name='user-profile'),

    path('follow/<int:user_id>/', ToggleFriendshipAPIView.as_view(), name='toggle-friendship'),
    path('search/', UserSearchAPIView.as_view(), name='user-search'),
    path('friends/', FollowedUserAPIView.as_view(), name='friends-list'),
    path('<int:id>/', UserDetailAPIView.as_view(), name='user-detail')


]
