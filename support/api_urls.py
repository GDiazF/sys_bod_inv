from rest_framework.routers import DefaultRouter

from support.api.views import (
    AdjuntoViewSet,
    CustodioViewSet,
    NumeradorViewSet,
    UbicacionBodegaViewSet,
)

router = DefaultRouter()
router.register('ubicaciones', UbicacionBodegaViewSet, basename='ubicacion-bodega')
router.register('custodios', CustodioViewSet, basename='custodio')
router.register('numeradores', NumeradorViewSet, basename='numerador')
router.register('adjuntos', AdjuntoViewSet, basename='adjunto')

urlpatterns = router.urls
