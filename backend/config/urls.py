from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from drf_spectacular.utils import extend_schema, extend_schema_view


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/', include('tracker.urls')),
    path('api/token/', extend_schema_view(post=extend_schema(tags=['Auth'], summary='Отримати JWT-токени'))(TokenObtainPairView).as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', extend_schema_view(post=extend_schema(tags=['Auth'], summary='Оновити access-токен'))(TokenRefreshView).as_view(), name='token_refresh'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger_ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root = settings.MEDIA_ROOT)
