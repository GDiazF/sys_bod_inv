from rest_framework import mixins, viewsets

from core.api.filters import BodegaFilter, CentroCostoFilter, SucursalFilter
from core.api.mixins import APIViewMixin, RBACViewMixin, permiso_crud
from core.api.serializers import (
    BodegaSerializer,
    CentroCostoSerializer,
    EmpresaSerializer,
    ParametroEmpresaSerializer,
    SucursalSerializer,
)
from core.models import Bodega, CentroCosto, Empresa, ParametroEmpresa, Sucursal


class EmpresaViewSet(mixins.RetrieveModelMixin, RBACViewMixin, viewsets.GenericViewSet):
    serializer_class = EmpresaSerializer
    rbac_permissions = permiso_crud('core.empresa.ver')

    def get_queryset(self):
        return Empresa.objects.filter(pk=self.get_empresa_id())


class SucursalViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = SucursalSerializer
    queryset = Sucursal.objects.all().order_by('codigo')
    filterset_class = SucursalFilter
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre', 'created_at']
    ordering = ['codigo']
    rbac_permissions = permiso_crud('core.bodega.ver', 'core.bodega.editar')


class BodegaViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = BodegaSerializer
    queryset = Bodega.objects.select_related('sucursal').order_by('codigo')
    filterset_class = BodegaFilter
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre', 'created_at']
    ordering = ['codigo']
    rbac_permissions = permiso_crud('core.bodega.ver', 'core.bodega.editar')


class CentroCostoViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = CentroCostoSerializer
    queryset = CentroCosto.objects.all().order_by('codigo')
    filterset_class = CentroCostoFilter
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre', 'created_at']
    ordering = ['codigo']
    rbac_permissions = permiso_crud('core.bodega.ver', 'core.bodega.editar')


class ParametroEmpresaViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    APIViewMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ParametroEmpresaSerializer
    rbac_permissions = {
        'retrieve': 'core.empresa.ver',
        'update': 'core.parametro.editar',
        'partial_update': 'core.parametro.editar',
    }

    def get_queryset(self):
        return ParametroEmpresa.objects.filter(empresa_id=self.get_empresa_id())
