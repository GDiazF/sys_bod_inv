from django.urls import include, path
from rest_framework.routers import DefaultRouter

from operations.views import (
    AjusteInventarioViewSet,
    CompraViewSet,
    EntregaViewSet,
    SolicitudViewSet,
    TrasladoViewSet,
)

router = DefaultRouter()
router.register('solicitudes', SolicitudViewSet, basename='solicitud')
router.register('entregas', EntregaViewSet, basename='entrega')
router.register('traslados', TrasladoViewSet, basename='traslado')
router.register('compras', CompraViewSet, basename='compra')
router.register('ajustes', AjusteInventarioViewSet, basename='ajuste')

urlpatterns = [
    path('', include(router.urls)),
]
