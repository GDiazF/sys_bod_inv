from django.http import Http404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from security.api.permissions import RBACPermission


def permiso_crud(ver: str, editar: str | None = None) -> dict:
    edit = editar or ver
    return {
        'list': ver,
        'retrieve': ver,
        'create': edit,
        'update': edit,
        'partial_update': edit,
        'destroy': edit,
    }


def permiso_lectura(*codigos: str) -> dict:
    return {
        'list': list(codigos),
        'retrieve': list(codigos),
    }


class RBACViewMixin:
    permission_classes = [IsAuthenticated, RBACPermission]
    rbac_permissions: dict = {}

    def get_empresa_id(self):
        return self.request.user.empresa_id

    def get_required_permission(self):
        action = getattr(self, 'action', None)
        if action and action in self.rbac_permissions:
            return self.rbac_permissions[action]
        return self.rbac_permissions.get('default')


class EmpresaScopedMixin:
    empresa_lookup = 'empresa_id'

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(**{self.empresa_lookup: self.get_empresa_id()})

    def perform_create(self, serializer):
        if 'empresa' in serializer.fields:
            serializer.save(empresa_id=self.get_empresa_id())
        else:
            serializer.save()

    def get_object(self):
        obj = super().get_object()
        empresa_id = getattr(obj, 'empresa_id', None)
        if empresa_id is not None and empresa_id != self.get_empresa_id():
            raise Http404
        return obj


class StandardListMixin:
    """Paginación, filtros (?campo=), búsqueda (?search=) y orden (?ordering=)."""

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    ordering_fields = '__all__'


class APIViewMixin(RBACViewMixin, EmpresaScopedMixin, StandardListMixin):
    pass
