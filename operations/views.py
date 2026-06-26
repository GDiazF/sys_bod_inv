from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.api.mixins import APIViewMixin
from operations.api.filters import (
    AjusteInventarioFilter,
    CompraFilter,
    EntregaFilter,
    SolicitudFilter,
    TrasladoFilter,
)
from operations.models import AjusteInventario, Compra, Entrega, Solicitud, Traslado
from operations.serializers import (
    AjusteCreateSerializer,
    AjusteDetalleCreateSerializer,
    AjusteInventarioSerializer,
    CompraCreateSerializer,
    CompraDetalleCreateSerializer,
    CompraSerializer,
    EntregaAdHocCreateSerializer,
    EntregaDesdeSolicitudSerializer,
    EntregaDetalleCreateSerializer,
    EntregaSerializer,
    SolicitudCreateSerializer,
    SolicitudDetalleCreateSerializer,
    SolicitudSerializer,
    TrasladoCreateSerializer,
    TrasladoDetalleCreateSerializer,
    TrasladoSerializer,
)
from operations.services.ajuste_service import AjusteInventarioService
from operations.services.compra_service import CompraService
from operations.services.entrega_service import EntregaService
from operations.services.solicitud_service import SolicitudService
from operations.services.traslado_service import TrasladoService


class SolicitudViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    APIViewMixin,
    viewsets.GenericViewSet,
):
    serializer_class = SolicitudSerializer
    queryset = Solicitud.objects.select_related('estado', 'centro_costo').prefetch_related('detalles')
    filterset_class = SolicitudFilter
    search_fields = ['numero', 'motivo', 'prioridad']
    ordering_fields = ['numero', 'fecha_solicitud', 'created_at']
    ordering = ['-created_at']
    rbac_permissions = {
        'list': ['operations.solicitud.crear', 'operations.solicitud.aprobar'],
        'retrieve': ['operations.solicitud.crear', 'operations.solicitud.aprobar'],
        'create': 'operations.solicitud.crear',
        'enviar': 'operations.solicitud.crear',
        'agregar_detalle': 'operations.solicitud.crear',
        'aprobar': 'operations.solicitud.aprobar',
        'rechazar': 'operations.solicitud.aprobar',
        'anular': 'operations.documento.anular',
    }

    def create(self, request, *args, **kwargs):
        serializer = SolicitudCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        solicitud = SolicitudService.crear(
            request.user.empresa,
            data['centro_costo'],
            request.user,
            fecha_solicitud=data.get('fecha_solicitud'),
            motivo=data.get('motivo'),
        )
        return Response(SolicitudSerializer(solicitud).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        solicitud = SolicitudService.enviar(self.get_object(), request.user)
        return Response(SolicitudSerializer(solicitud).data)

    @action(detail=True, methods=['post'], url_path='detalles')
    def agregar_detalle(self, request, pk=None):
        serializer = SolicitudDetalleCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        detalle = SolicitudService.agregar_detalle(
            self.get_object(),
            data['producto'],
            data['cantidad_solicitada'],
            lote=data.get('lote'),
        )
        return Response({'id': detalle.id}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        solicitud = SolicitudService.aprobar(self.get_object(), request.user)
        return Response(SolicitudSerializer(solicitud).data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        solicitud = SolicitudService.rechazar(self.get_object(), request.user)
        return Response(SolicitudSerializer(solicitud).data)

    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        solicitud = SolicitudService.anular(self.get_object(), request.user)
        return Response(SolicitudSerializer(solicitud).data)


class EntregaViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    APIViewMixin,
    viewsets.GenericViewSet,
):
    serializer_class = EntregaSerializer
    queryset = Entrega.objects.select_related('estado', 'bodega').prefetch_related('detalles')
    filterset_class = EntregaFilter
    search_fields = ['numero', 'recibido_por', 'observacion']
    ordering_fields = ['numero', 'fecha_entrega', 'created_at']
    ordering = ['-created_at']
    rbac_permissions = {
        'list': ['operations.entrega.crear', 'operations.entrega.aprobar'],
        'retrieve': ['operations.entrega.crear', 'operations.entrega.aprobar'],
        'crear_desde_solicitud': 'operations.entrega.crear',
        'crear_ad_hoc': 'operations.entrega.crear',
        'agregar_detalle': 'operations.entrega.crear',
        'enviar': 'operations.entrega.crear',
        'aprobar': 'operations.entrega.aprobar',
        'ejecutar': 'operations.entrega.crear',
        'anular': 'operations.documento.anular',
    }

    @action(detail=False, methods=['post'], url_path='desde-solicitud')
    def crear_desde_solicitud(self, request):
        serializer = EntregaDesdeSolicitudSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        entrega = EntregaService.crear_desde_solicitud(
            data['solicitud'],
            data['bodega'],
            request.user,
            fecha_entrega=data.get('fecha_entrega'),
        )
        return Response(EntregaSerializer(entrega).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='ad-hoc')
    def crear_ad_hoc(self, request):
        serializer = EntregaAdHocCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        entrega = EntregaService.crear_ad_hoc(
            request.user.empresa,
            data['bodega'],
            data['centro_costo'],
            request.user,
            fecha_entrega=data.get('fecha_entrega'),
        )
        return Response(EntregaSerializer(entrega).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='detalles')
    def agregar_detalle(self, request, pk=None):
        serializer = EntregaDetalleCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        detalle = EntregaService.agregar_detalle(
            self.get_object(),
            data['producto'],
            data['cantidad_entregada'],
            serie=data.get('serie'),
            lote=data.get('lote'),
        )
        return Response({'id': detalle.id}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        entrega = EntregaService.enviar(self.get_object(), request.user)
        return Response(EntregaSerializer(entrega).data)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        entrega = EntregaService.aprobar(self.get_object(), request.user)
        return Response(EntregaSerializer(entrega).data)

    @action(detail=True, methods=['post'])
    def ejecutar(self, request, pk=None):
        entrega = EntregaService.ejecutar(self.get_object(), request.user)
        return Response(EntregaSerializer(entrega).data)


class TrasladoViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    APIViewMixin,
    viewsets.GenericViewSet,
):
    serializer_class = TrasladoSerializer
    queryset = Traslado.objects.select_related('estado', 'bodega_origen', 'bodega_destino').prefetch_related(
        'detalles'
    )
    filterset_class = TrasladoFilter
    search_fields = ['numero', 'motivo']
    ordering_fields = ['numero', 'fecha_salida', 'fecha_recepcion', 'created_at']
    ordering = ['-created_at']
    rbac_permissions = {
        'list': ['operations.traslado.crear', 'operations.traslado.aprobar'],
        'retrieve': ['operations.traslado.crear', 'operations.traslado.aprobar'],
        'create': 'operations.traslado.crear',
        'agregar_detalle': 'operations.traslado.crear',
        'enviar': 'operations.traslado.crear',
        'aprobar': 'operations.traslado.aprobar',
        'despachar': 'operations.traslado.despachar',
        'recibir': 'operations.traslado.recibir',
        'anular': 'operations.documento.anular',
    }

    def create(self, request, *args, **kwargs):
        serializer = TrasladoCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        traslado = TrasladoService.crear(
            request.user.empresa,
            data['bodega_origen'],
            data['bodega_destino'],
            request.user,
            bodega_transito=data.get('bodega_transito'),
            motivo=data.get('motivo'),
        )
        return Response(TrasladoSerializer(traslado).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='detalles')
    def agregar_detalle(self, request, pk=None):
        serializer = TrasladoDetalleCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        detalle = TrasladoService.agregar_detalle(
            self.get_object(),
            data['producto'],
            data['cantidad_trasladada'],
            serie=data.get('serie'),
            lote=data.get('lote'),
        )
        return Response({'id': detalle.id}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        traslado = TrasladoService.enviar(self.get_object(), request.user)
        return Response(TrasladoSerializer(traslado).data)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        traslado = TrasladoService.aprobar(self.get_object(), request.user)
        return Response(TrasladoSerializer(traslado).data)

    @action(detail=True, methods=['post'])
    def despachar(self, request, pk=None):
        traslado = TrasladoService.despachar(self.get_object(), request.user)
        return Response(TrasladoSerializer(traslado).data)

    @action(detail=True, methods=['post'])
    def recibir(self, request, pk=None):
        traslado = TrasladoService.recibir(self.get_object(), request.user)
        return Response(TrasladoSerializer(traslado).data)


class CompraViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    APIViewMixin,
    viewsets.GenericViewSet,
):
    serializer_class = CompraSerializer
    queryset = Compra.objects.select_related('estado', 'proveedor', 'bodega_destino').prefetch_related('detalles')
    filterset_class = CompraFilter
    search_fields = ['numero', 'observacion']
    ordering_fields = ['numero', 'fecha_compra', 'created_at']
    ordering = ['-created_at']
    rbac_permissions = {
        'list': ['operations.compra.crear', 'operations.compra.aprobar'],
        'retrieve': ['operations.compra.crear', 'operations.compra.aprobar'],
        'create': 'operations.compra.crear',
        'agregar_detalle': 'operations.compra.crear',
        'enviar': 'operations.compra.crear',
        'aprobar': 'operations.compra.aprobar',
        'confirmar': 'operations.compra.confirmar',
        'anular': 'operations.documento.anular',
    }

    def create(self, request, *args, **kwargs):
        serializer = CompraCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        compra = CompraService.crear(
            request.user.empresa,
            data['proveedor'],
            data['bodega_destino'],
            request.user,
            fecha_compra=data.get('fecha_compra'),
            observacion=data.get('observacion'),
        )
        return Response(CompraSerializer(compra).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='detalles')
    def agregar_detalle(self, request, pk=None):
        serializer = CompraDetalleCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        detalle = CompraService.agregar_detalle(
            self.get_object(),
            data['producto'],
            data['cantidad'],
            data['costo_unitario'],
            lote=data.get('lote'),
            numero_serie=data.get('numero_serie'),
        )
        return Response({'id': detalle.id}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        compra = CompraService.enviar(self.get_object(), request.user)
        return Response(CompraSerializer(compra).data)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        compra = CompraService.aprobar(self.get_object(), request.user)
        return Response(CompraSerializer(compra).data)

    @action(detail=True, methods=['post'])
    def confirmar(self, request, pk=None):
        compra = CompraService.confirmar(self.get_object(), request.user)
        return Response(CompraSerializer(compra).data)


class AjusteInventarioViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    APIViewMixin,
    viewsets.GenericViewSet,
):
    serializer_class = AjusteInventarioSerializer
    queryset = AjusteInventario.objects.select_related('estado', 'bodega').prefetch_related('detalles')
    filterset_class = AjusteInventarioFilter
    search_fields = ['numero', 'motivo']
    ordering_fields = ['numero', 'fecha_ajuste', 'created_at']
    ordering = ['-created_at']
    rbac_permissions = {
        'list': ['inventory.stock.ver', 'inventory.aprobar_ajuste'],
        'retrieve': ['inventory.stock.ver', 'inventory.aprobar_ajuste'],
        'create': 'inventory.aprobar_ajuste',
        'agregar_detalle': 'inventory.aprobar_ajuste',
        'enviar': 'inventory.aprobar_ajuste',
        'aprobar': 'inventory.aprobar_ajuste',
        'ejecutar': 'inventory.aprobar_ajuste',
        'anular': 'operations.documento.anular',
    }

    def create(self, request, *args, **kwargs):
        serializer = AjusteCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        ajuste = AjusteInventarioService.crear(
            request.user.empresa,
            data['bodega'],
            request.user,
            fecha_ajuste=data.get('fecha_ajuste'),
            motivo=data.get('motivo'),
        )
        return Response(AjusteInventarioSerializer(ajuste).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='detalles')
    def agregar_detalle(self, request, pk=None):
        serializer = AjusteDetalleCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        detalle = AjusteInventarioService.agregar_detalle_desde_conteo(
            self.get_object(),
            data['producto'],
            data['cantidad_contada'],
            serie=data.get('serie'),
            lote=data.get('lote'),
        )
        return Response({'id': detalle.id}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        ajuste = AjusteInventarioService.enviar(self.get_object(), request.user)
        return Response(AjusteInventarioSerializer(ajuste).data)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        ajuste = AjusteInventarioService.aprobar(self.get_object(), request.user)
        return Response(AjusteInventarioSerializer(ajuste).data)

    @action(detail=True, methods=['post'])
    def ejecutar(self, request, pk=None):
        ajuste = AjusteInventarioService.ejecutar(self.get_object(), request.user)
        return Response(AjusteInventarioSerializer(ajuste).data)
