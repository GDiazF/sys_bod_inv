from rest_framework import viewsets

from core.api.mixins import APIViewMixin, permiso_crud
from support.api.filters import AdjuntoFilter, CustodioFilter, NumeradorFilter, UbicacionBodegaFilter
from support.api.serializers import (
    AdjuntoSerializer,
    CustodioSerializer,
    NumeradorSerializer,
    UbicacionBodegaSerializer,
)
from support.models import Adjunto, Custodio, Numerador, UbicacionBodega


class UbicacionBodegaViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = UbicacionBodegaSerializer
    queryset = UbicacionBodega.objects.select_related('bodega').order_by('codigo')
    filterset_class = UbicacionBodegaFilter
    search_fields = ['codigo', 'nombre', 'bodega__codigo']
    ordering_fields = ['codigo', 'nombre']
    ordering = ['codigo']
    rbac_permissions = permiso_crud('core.bodega.ver', 'core.bodega.editar')


class CustodioViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = CustodioSerializer
    queryset = Custodio.objects.all().order_by('nombre_completo')
    filterset_class = CustodioFilter
    search_fields = ['nombre_completo', 'codigo', 'documento_identidad', 'correo']
    ordering_fields = ['nombre_completo', 'codigo']
    ordering = ['nombre_completo']
    rbac_permissions = permiso_crud('core.bodega.ver', 'core.bodega.editar')


class NumeradorViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = NumeradorSerializer
    queryset = Numerador.objects.all().order_by('tipo_documento')
    filterset_class = NumeradorFilter
    search_fields = ['tipo_documento', 'prefijo']
    ordering_fields = ['tipo_documento', 'ultimo_numero']
    ordering = ['tipo_documento']
    http_method_names = ['get', 'patch', 'head', 'options']
    rbac_permissions = {
        'list': 'core.empresa.ver',
        'retrieve': 'core.empresa.ver',
        'partial_update': 'support.numerador.editar',
        'update': 'support.numerador.editar',
    }


class AdjuntoViewSet(APIViewMixin, viewsets.ModelViewSet):
    serializer_class = AdjuntoSerializer
    queryset = Adjunto.objects.select_related('subido_por').order_by('-created_at')
    filterset_class = AdjuntoFilter
    search_fields = ['nombre_archivo', 'modulo', 'documento_id']
    ordering_fields = ['created_at', 'nombre_archivo']
    ordering = ['-created_at']
    rbac_permissions = permiso_crud('support.adjunto.subir', 'support.adjunto.subir')

    def perform_create(self, serializer):
        empresa_id = self.get_empresa_id()
        modulo = serializer.validated_data['modulo']
        nombre = serializer.validated_data['nombre_archivo']
        serializer.save(
            empresa_id=empresa_id,
            ruta_archivo=f'adjuntos/{empresa_id}/{modulo}/{nombre}',
            subido_por=self.request.user,
        )
