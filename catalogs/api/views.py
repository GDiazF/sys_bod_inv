from rest_framework import viewsets

from catalogs.api.filters import CategoriaFilter, MarcaFilter, UnidadMedidaFilter
from catalogs.api.serializers import (
    CategoriaSerializer,
    EstadoDocumentoSerializer,
    EstadoSerieSerializer,
    MarcaSerializer,
    MetodoCosteoSerializer,
    TipoControlInventarioSerializer,
    TipoMovimientoInventarioSerializer,
    UnidadMedidaSerializer,
)
from catalogs.models import (
    Categoria,
    EstadoDocumento,
    EstadoSerie,
    Marca,
    MetodoCosteo,
    TipoControlInventario,
    TipoMovimientoInventario,
    UnidadMedida,
)
from core.api.mixins import APIViewMixin, RBACViewMixin, StandardListMixin, permiso_crud, permiso_lectura


class CategoriaViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = CategoriaSerializer
    queryset = Categoria.objects.all().order_by('codigo')
    filterset_class = CategoriaFilter
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']
    ordering = ['codigo']
    rbac_permissions = permiso_crud('catalogs.ver', 'catalogs.editar')


class MarcaViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = MarcaSerializer
    queryset = Marca.objects.all().order_by('nombre')
    filterset_class = MarcaFilter
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['nombre', 'codigo']
    ordering = ['nombre']
    rbac_permissions = permiso_crud('catalogs.ver', 'catalogs.editar')


class UnidadMedidaViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = UnidadMedidaSerializer
    queryset = UnidadMedida.objects.all().order_by('codigo')
    filterset_class = UnidadMedidaFilter
    search_fields = ['codigo', 'nombre', 'abreviacion']
    ordering_fields = ['codigo', 'nombre']
    ordering = ['codigo']
    rbac_permissions = permiso_crud('catalogs.ver', 'catalogs.editar')


class TipoControlInventarioViewSet(RBACViewMixin, StandardListMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = TipoControlInventarioSerializer
    queryset = TipoControlInventario.objects.filter(activo=True).order_by('codigo')
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']
    ordering = ['codigo']
    rbac_permissions = permiso_lectura('catalogs.ver')


class EstadoSerieViewSet(RBACViewMixin, StandardListMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = EstadoSerieSerializer
    queryset = EstadoSerie.objects.filter(activo=True).order_by('codigo')
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']
    ordering = ['codigo']
    rbac_permissions = permiso_lectura('catalogs.ver')


class TipoMovimientoInventarioViewSet(RBACViewMixin, StandardListMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = TipoMovimientoInventarioSerializer
    queryset = TipoMovimientoInventario.objects.filter(activo=True).order_by('codigo')
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']
    ordering = ['codigo']
    rbac_permissions = permiso_lectura('catalogs.ver', 'inventory.movimiento.ver')


class MetodoCosteoViewSet(RBACViewMixin, StandardListMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = MetodoCosteoSerializer
    queryset = MetodoCosteo.objects.filter(activo=True).order_by('codigo')
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']
    ordering = ['codigo']
    rbac_permissions = permiso_lectura('catalogs.ver', 'core.empresa.ver')


class EstadoDocumentoViewSet(RBACViewMixin, StandardListMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = EstadoDocumentoSerializer
    queryset = EstadoDocumento.objects.filter(activo=True).order_by('codigo')
    search_fields = ['codigo', 'nombre', 'documento_tipo']
    ordering_fields = ['codigo', 'nombre']
    ordering = ['codigo']
    rbac_permissions = permiso_lectura('catalogs.ver')
