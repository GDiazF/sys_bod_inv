import django_filters
from django_filters.rest_framework import FilterSet

from operations.models import (
    AjusteInventario,
    Compra,
    Entrega,
    Solicitud,
    Traslado,
)


class DocumentoOperacionFilterMixin(FilterSet):
    estado = django_filters.NumberFilter(field_name='estado_id')
    estado_codigo = django_filters.CharFilter(field_name='estado__codigo', lookup_expr='iexact')
    created_at_desde = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_at_hasta = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')


class SolicitudFilter(DocumentoOperacionFilterMixin):
    centro_costo = django_filters.NumberFilter(field_name='centro_costo_id')
    fecha_solicitud_desde = django_filters.DateFilter(field_name='fecha_solicitud', lookup_expr='gte')
    fecha_solicitud_hasta = django_filters.DateFilter(field_name='fecha_solicitud', lookup_expr='lte')

    class Meta:
        model = Solicitud
        fields = ['centro_costo', 'estado', 'estado_codigo']


class EntregaFilter(DocumentoOperacionFilterMixin):
    bodega = django_filters.NumberFilter(field_name='bodega_id')
    solicitud = django_filters.NumberFilter(field_name='solicitud_id')
    es_ad_hoc = django_filters.BooleanFilter()

    class Meta:
        model = Entrega
        fields = ['bodega', 'solicitud', 'es_ad_hoc', 'estado', 'estado_codigo']


class TrasladoFilter(DocumentoOperacionFilterMixin):
    bodega_origen = django_filters.NumberFilter(field_name='bodega_origen_id')
    bodega_destino = django_filters.NumberFilter(field_name='bodega_destino_id')

    class Meta:
        model = Traslado
        fields = ['bodega_origen', 'bodega_destino', 'estado', 'estado_codigo']


class CompraFilter(DocumentoOperacionFilterMixin):
    proveedor = django_filters.NumberFilter(field_name='proveedor_id')
    bodega_destino = django_filters.NumberFilter(field_name='bodega_destino_id')

    class Meta:
        model = Compra
        fields = ['proveedor', 'bodega_destino', 'estado', 'estado_codigo']


class AjusteInventarioFilter(DocumentoOperacionFilterMixin):
    bodega = django_filters.NumberFilter(field_name='bodega_id')

    class Meta:
        model = AjusteInventario
        fields = ['bodega', 'estado', 'estado_codigo']
