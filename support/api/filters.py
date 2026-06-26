import django_filters
from django_filters.rest_framework import FilterSet

from support.models import Adjunto, Custodio, Numerador, UbicacionBodega


class UbicacionBodegaFilter(FilterSet):
    bodega = django_filters.NumberFilter(field_name='bodega_id')
    activa = django_filters.BooleanFilter()

    class Meta:
        model = UbicacionBodega
        fields = ['bodega', 'activa']


class CustodioFilter(FilterSet):
    activo = django_filters.BooleanFilter()

    class Meta:
        model = Custodio
        fields = ['activo']


class NumeradorFilter(FilterSet):
    tipo_documento = django_filters.CharFilter(lookup_expr='iexact')
    activo = django_filters.BooleanFilter()

    class Meta:
        model = Numerador
        fields = ['tipo_documento', 'activo']


class AdjuntoFilter(FilterSet):
    modulo = django_filters.CharFilter(lookup_expr='iexact')
    documento_id = django_filters.CharFilter(lookup_expr='iexact')

    class Meta:
        model = Adjunto
        fields = ['modulo', 'documento_id']
