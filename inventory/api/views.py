from rest_framework import viewsets

from core.api.mixins import APIViewMixin, permiso_crud, permiso_lectura
from inventory.api.filters import (
    MovimientoInventarioFilter,
    ProductoFilter,
    ProveedorFilter,
    StockActualFilter,
)
from inventory.api.serializers import (
    MovimientoInventarioSerializer,
    ProductoSerializer,
    ProveedorSerializer,
    StockActualSerializer,
)
from inventory.models import MovimientoInventario, Producto, Proveedor, StockActual


class ProductoViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = ProductoSerializer
    queryset = Producto.objects.select_related(
        'unidad_medida',
        'tipo_control_inventario',
        'categoria',
        'marca',
    ).order_by('sku')
    filterset_class = ProductoFilter
    search_fields = ['sku', 'nombre', 'descripcion']
    ordering_fields = ['sku', 'nombre', 'created_at', 'costo_promedio_actual']
    ordering = ['sku']
    rbac_permissions = permiso_crud('inventory.producto.ver', 'inventory.producto.editar')


class ProveedorViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = ProveedorSerializer
    queryset = Proveedor.objects.all().order_by('razon_social')
    filterset_class = ProveedorFilter
    search_fields = ['razon_social', 'rut', 'nombre_contacto', 'correo']
    ordering_fields = ['razon_social', 'rut']
    ordering = ['razon_social']
    rbac_permissions = permiso_crud('inventory.proveedor.editar', 'inventory.proveedor.editar')


class StockActualViewSet(APIViewMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = StockActualSerializer
    queryset = StockActual.objects.select_related('producto', 'bodega', 'lote')
    filterset_class = StockActualFilter
    search_fields = ['producto__sku', 'producto__nombre', 'bodega__codigo']
    ordering_fields = ['cantidad', 'producto__sku', 'bodega__codigo']
    ordering = ['producto__sku']
    rbac_permissions = permiso_lectura('inventory.stock.ver')


class MovimientoInventarioViewSet(APIViewMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = MovimientoInventarioSerializer
    queryset = MovimientoInventario.objects.select_related(
        'producto',
        'tipo_movimiento',
        'bodega_origen',
        'bodega_destino',
        'serie',
        'lote',
        'created_by',
    ).order_by('-created_at')
    filterset_class = MovimientoInventarioFilter
    search_fields = ['referencia_id', 'referencia_tipo', 'producto__sku', 'producto__nombre']
    ordering_fields = ['created_at', 'cantidad', 'costo_unitario']
    ordering = ['-created_at']
    rbac_permissions = permiso_lectura('inventory.movimiento.ver', 'inventory.stock.ver')
