from rest_framework.routers import DefaultRouter

from inventory.api.views import (
    MovimientoInventarioViewSet,
    ProductoViewSet,
    ProveedorViewSet,
    StockActualViewSet,
)

router = DefaultRouter()
router.register('productos', ProductoViewSet, basename='producto')
router.register('proveedores', ProveedorViewSet, basename='proveedor')
router.register('stock', StockActualViewSet, basename='stock')
router.register('movimientos', MovimientoInventarioViewSet, basename='movimiento')

urlpatterns = router.urls
