from django.urls import path
from rest_framework.routers import DefaultRouter

from security.api.views import MeView, PermisoViewSet, RolViewSet, UsuarioViewSet

router = DefaultRouter()
router.register('permisos', PermisoViewSet, basename='permiso')
router.register('roles', RolViewSet, basename='rol')
router.register('usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    *router.urls,
]
