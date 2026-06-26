from drf_spectacular.utils import extend_schema
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


@extend_schema(responses=MeSerializer)
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class PermisoViewSet(RBACViewMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = PermisoSerializer
    queryset = Permiso.objects.filter(activo=True)
    rbac_permissions = permiso_lectura('security.rol.editar', 'security.usuario.ver')


class RolViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = RolSerializer
    queryset = Rol.objects.all()
    rbac_permissions = permiso_crud('security.usuario.ver', 'security.rol.editar')


class UsuarioViewSet(APIViewMixin, viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
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
