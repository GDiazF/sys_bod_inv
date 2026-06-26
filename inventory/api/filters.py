import django_filters
from django_filters.rest_framework import FilterSet

from inventory.models import MovimientoInventario, Producto, Proveedor, StockActual


class ProductoFilter(FilterSet):
    activo = django_filters.BooleanFilter()
    maneja_stock = django_filters.BooleanFilter()
    categoria = django_filters.NumberFilter(field_name='categoria_id')
    marca = django_filters.NumberFilter(field_name='marca_id')
    tipo_control_inventario = django_filters.NumberFilter(field_name='tipo_control_inventario_id')

    class Meta:
        model = Producto
        fields = [
            'activo',
            'maneja_stock',
            'categoria',
            'marca',
            'tipo_control_inventario',
        ]


class ProveedorFilter(FilterSet):
    activo = django_filters.BooleanFilter()

    class Meta:
        model = Proveedor
        fields = ['activo']


class StockActualFilter(FilterSet):
    bodega = django_filters.NumberFilter(field_name='bodega_id')
    producto = django_filters.NumberFilter(field_name='producto_id')
    lote = django_filters.NumberFilter(field_name='lote_id')

    class Meta:
        model = StockActual
        fields = ['bodega', 'producto', 'lote']


class MovimientoInventarioFilter(FilterSet):
    producto = django_filters.NumberFilter(field_name='producto_id')
    bodega_origen = django_filters.NumberFilter(field_name='bodega_origen_id')
    bodega_destino = django_filters.NumberFilter(field_name='bodega_destino_id')
    tipo_movimiento = django_filters.NumberFilter(field_name='tipo_movimiento_id')
    anulado = django_filters.BooleanFilter()
    referencia_tipo = django_filters.CharFilter(lookup_expr='iexact')
    created_at_desde = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_at_hasta = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = MovimientoInventario
        fields = [
            'producto',
            'bodega_origen',
            'bodega_destino',
            'tipo_movimiento',
            'anulado',
            'referencia_tipo',
        ]
