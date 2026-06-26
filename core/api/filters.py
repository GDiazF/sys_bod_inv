import django_filters
from django_filters.rest_framework import FilterSet

from core.models import Bodega, CentroCosto, Sucursal


class SucursalFilter(FilterSet):
    activa = django_filters.BooleanFilter()

    class Meta:
        model = Sucursal
        fields = ['activa']


class BodegaFilter(FilterSet):
    activa = django_filters.BooleanFilter()
    es_principal = django_filters.BooleanFilter()
    es_transito = django_filters.BooleanFilter()
    sucursal = django_filters.NumberFilter(field_name='sucursal_id')

    class Meta:
        model = Bodega
        fields = ['activa', 'es_principal', 'es_transito', 'sucursal']


class CentroCostoFilter(FilterSet):
    activo = django_filters.BooleanFilter()

    class Meta:
        model = CentroCosto
        fields = ['activo']
