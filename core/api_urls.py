from rest_framework.routers import DefaultRouter

from core.api.views import (
    BodegaViewSet,
    CentroCostoViewSet,
    EmpresaViewSet,
    ParametroEmpresaViewSet,
    SucursalViewSet,
)

router = DefaultRouter()
router.register('empresa', EmpresaViewSet, basename='empresa')
router.register('sucursales', SucursalViewSet, basename='sucursal')
router.register('bodegas', BodegaViewSet, basename='bodega')
router.register('centros-costo', CentroCostoViewSet, basename='centro-costo')
router.register('parametros', ParametroEmpresaViewSet, basename='parametro-empresa')

urlpatterns = router.urls
