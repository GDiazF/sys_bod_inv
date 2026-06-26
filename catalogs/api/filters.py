import django_filters
from django_filters.rest_framework import FilterSet

from catalogs.models import Categoria, Marca, UnidadMedida


class CategoriaFilter(FilterSet):
    activa = django_filters.BooleanFilter()

    class Meta:
        model = Categoria
        fields = ['activa']


class MarcaFilter(FilterSet):
    activa = django_filters.BooleanFilter()

    class Meta:
        model = Marca
        fields = ['activa']


class UnidadMedidaFilter(FilterSet):
    activa = django_filters.BooleanFilter()

    class Meta:
        model = UnidadMedida
        fields = ['activa']
