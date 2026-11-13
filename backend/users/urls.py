from django.urls import path
from .views import RegisterAPIView, UserProfileAPIView, UserSearchAPIView, ToggleFriendshipAPIView, FollowedUserAPIView, UserDetailAPIView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='user-register'),
    path('profile/', UserProfileAPIView.as_view(), name='user-profile'),

    path('search/', UserSearchAPIView.as_view(), name='user-search'),
    path('friends/', FollowedUserAPIView.as_view(), name='user-friends'),

    path('<int:user_id>/follow/', ToggleFriendshipAPIView.as_view(), name='user-follow'),
    path('<int:user_id>/', UserDetailAPIView.as_view(), name='user-detail'),
]
