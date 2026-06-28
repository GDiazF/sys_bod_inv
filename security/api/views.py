from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.api.mixins import APIViewMixin, RBACViewMixin, permiso_crud, permiso_lectura
from security.api.serializers import (
    MeSerializer,
    PermisoSerializer,
    RolSerializer,
    UsuarioCreateSerializer,
    UsuarioSerializer,
)
from security.models import Permiso, Rol, Usuario


@extend_schema(responses=MeSerializer, summary='Perfil y permisos del usuario autenticado.')
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


@extend_schema_view(
    list=extend_schema(summary='Listar permisos activos del sistema.'),
    retrieve=extend_schema(summary='Obtener permiso por id.'),
)
class PermisoViewSet(RBACViewMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = PermisoSerializer
    queryset = Permiso.objects.filter(activo=True)
    rbac_permissions = permiso_lectura('security.rol.editar', 'security.usuario.ver')


@extend_schema_view(
    list=extend_schema(summary='Listar roles de la empresa.'),
    create=extend_schema(summary='Crear rol en la empresa.'),
    retrieve=extend_schema(summary='Obtener rol de la empresa.'),
    update=extend_schema(summary='Actualizar rol.'),
    partial_update=extend_schema(summary='Actualizar parcialmente rol.'),
    destroy=extend_schema(summary='Eliminar rol.'),
)
class RolViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = RolSerializer
    queryset = Rol.objects.all()
    rbac_permissions = permiso_crud('security.usuario.ver', 'security.rol.editar')


@extend_schema_view(
    list=extend_schema(summary='Listar usuarios de la empresa autenticada.'),
    create=extend_schema(summary='Crear usuario en la empresa autenticada.'),
    retrieve=extend_schema(summary='Obtener usuario de la empresa.'),
    update=extend_schema(summary='Actualizar usuario.'),
    partial_update=extend_schema(summary='Actualizar parcialmente usuario.'),
    destroy=extend_schema(summary='Eliminar usuario.'),
)
class UsuarioViewSet(APIViewMixin, viewsets.ModelViewSet):
    queryset = Usuario.objects.select_related('empresa')
    rbac_permissions = permiso_crud('security.usuario.ver', 'security.usuario.editar')

    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        return UsuarioSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['empresa'] = self.request.user.empresa
        return context

    def perform_create(self, serializer):
        serializer.save(empresa_id=self.get_empresa_id())
