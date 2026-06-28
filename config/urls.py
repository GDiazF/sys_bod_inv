from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from security.api.auth import ActivoTokenObtainPairView, ActivoTokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/auth/token/', ActivoTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', ActivoTokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/core/', include('core.api_urls')),
    path('api/v1/catalogs/', include('catalogs.api_urls')),
    path('api/v1/inventory/', include('inventory.api_urls')),
    path('api/v1/operations/', include('operations.api_urls')),
    path('api/v1/support/', include('support.api_urls')),
    path('api/v1/security/', include('security.api_urls')),
]
