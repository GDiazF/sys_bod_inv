from rest_framework.routers import DefaultRouter

from catalogs.api.views import (
    CategoriaViewSet,
    EstadoDocumentoViewSet,
    EstadoSerieViewSet,
    MarcaViewSet,
    MetodoCosteoViewSet,
    TipoControlInventarioViewSet,
    TipoMovimientoInventarioViewSet,
    UnidadMedidaViewSet,
)

router = DefaultRouter()
router.register('categorias', CategoriaViewSet, basename='categoria')
router.register('marcas', MarcaViewSet, basename='marca')
router.register('unidades-medida', UnidadMedidaViewSet, basename='unidad-medida')
router.register('tipos-control', TipoControlInventarioViewSet, basename='tipo-control')
router.register('estados-serie', EstadoSerieViewSet, basename='estado-serie')
router.register('tipos-movimiento', TipoMovimientoInventarioViewSet, basename='tipo-movimiento')
router.register('metodos-costeo', MetodoCosteoViewSet, basename='metodo-costeo')
router.register('estados-documento', EstadoDocumentoViewSet, basename='estado-documento')

urlpatterns = router.urls
