from datetime import date
from decimal import Decimal

from django.db import transaction

from core.models import Bodega, CentroCosto, Empresa
from inventory.models import Lote, Producto, Serie
from inventory.services.movimiento_inventario_service import (
    MovimientoInventarioService,
    MovimientoInput,
)
from inventory.services.stock_service import StockService
from operations.models import Entrega, EntregaDetalle, Solicitud
from operations.services.documento_estado_service import DocumentoEstadoService
from operations.services.exceptions import (
    CantidadExcedeAprobadaError,
    DocumentoNoAprobadoError,
    DocumentoSinDetalleError,
)
from operations.services.historial_documento_service import HistorialDocumentoService
from operations.services.solicitud_service import SolicitudService
from security.models import Usuario
from support.services.numerador_service import NumeradorService


class EntregaService:
    @staticmethod
    @transaction.atomic
    def crear_desde_solicitud(
        solicitud: Solicitud,
        bodega: Bodega,
        usuario: Usuario,
        fecha_entrega: date | None = None,
    ) -> Entrega:
        if solicitud.estado.codigo != 'APROBADO':
            raise DocumentoNoAprobadoError('La solicitud debe estar aprobada para generar entrega.')

        numero = NumeradorService.generar_folio(solicitud.empresa, Entrega.TIPO_DOCUMENTO)
        entrega = Entrega.objects.create(
            empresa=solicitud.empresa,
            numero=numero,
            solicitud=solicitud,
            bodega=bodega,
            centro_costo=solicitud.centro_costo,
            estado=DocumentoEstadoService.obtener_estado('APROBADO'),
            fecha_entrega=fecha_entrega or date.today(),
            es_ad_hoc=False,
            created_by=usuario,
            approved_by=usuario,
            approved_at=solicitud.approved_at,
        )
        for detalle in solicitud.detalles.all():
            cantidad = detalle.cantidad_aprobada or detalle.cantidad_solicitada
            EntregaDetalle.objects.create(
                entrega=entrega,
                producto=detalle.producto,
                lote=detalle.lote,
                cantidad_entregada=cantidad,
            )
        HistorialDocumentoService.registrar(
            empresa=entrega.empresa,
            documento_tipo=Entrega.TIPO_DOCUMENTO,
            documento_id=entrega.pk,
            estado_anterior=None,
            estado_nuevo='APROBADO',
            usuario=usuario,
        )
        return entrega

    @staticmethod
    @transaction.atomic
    def crear_ad_hoc(
        empresa: Empresa,
        bodega: Bodega,
        centro_costo: CentroCosto,
        usuario: Usuario,
        fecha_entrega: date | None = None,
    ) -> Entrega:
        numero = NumeradorService.generar_folio(empresa, Entrega.TIPO_DOCUMENTO)
        entrega = Entrega.objects.create(
            empresa=empresa,
            numero=numero,
            bodega=bodega,
            centro_costo=centro_costo,
            estado=DocumentoEstadoService.obtener_estado('BORRADOR'),
            fecha_entrega=fecha_entrega or date.today(),
            es_ad_hoc=True,
            created_by=usuario,
        )
        HistorialDocumentoService.registrar(
            empresa=empresa,
            documento_tipo=Entrega.TIPO_DOCUMENTO,
            documento_id=entrega.pk,
            estado_anterior=None,
            estado_nuevo='BORRADOR',
            usuario=usuario,
        )
        return entrega

    @staticmethod
    @transaction.atomic
    def agregar_detalle(
        entrega: Entrega,
        producto: Producto,
        cantidad: Decimal,
        serie: Serie | None = None,
        lote: Lote | None = None,
    ) -> EntregaDetalle:
        DocumentoEstadoService.validar_editable(entrega.estado.codigo)
        return EntregaDetalle.objects.create(
            entrega=entrega,
            producto=producto,
            serie=serie,
            lote=lote,
            cantidad_entregada=cantidad,
        )

    @staticmethod
    @transaction.atomic
    def enviar(entrega: Entrega, usuario: Usuario) -> Entrega:
        entrega = Entrega.objects.select_for_update().get(pk=entrega.pk)
        if not entrega.detalles.exists():
            raise DocumentoSinDetalleError('La entrega no tiene detalle.')
        estado_anterior = entrega.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            entrega, Entrega.TIPO_DOCUMENTO, 'PENDIENTE', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            entrega, Entrega.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return entrega

    @staticmethod
    @transaction.atomic
    def aprobar(entrega: Entrega, usuario: Usuario) -> Entrega:
        entrega = Entrega.objects.select_for_update().get(pk=entrega.pk)
        estado_anterior = entrega.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            entrega, Entrega.TIPO_DOCUMENTO, 'APROBADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            entrega, Entrega.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return entrega

    @staticmethod
    @transaction.atomic
    def ejecutar(entrega: Entrega, usuario: Usuario) -> Entrega:
        entrega = (
            Entrega.objects.select_for_update()
            .select_related('bodega', 'centro_costo', 'solicitud')
            .prefetch_related('detalles__producto', 'detalles__serie', 'detalles__lote')
            .get(pk=entrega.pk)
        )
        if entrega.estado.codigo != 'APROBADO':
            raise DocumentoNoAprobadoError('La entrega debe estar aprobada para ejecutarse.')
        if not entrega.detalles.exists():
            raise DocumentoSinDetalleError('La entrega no tiene detalle.')

        for detalle in entrega.detalles.all():
            if entrega.solicitud_id:
                sol_det = entrega.solicitud.detalles.filter(producto=detalle.producto).first()
                if sol_det and sol_det.cantidad_aprobada is not None:
                    if detalle.cantidad_entregada > sol_det.cantidad_aprobada:
                        raise CantidadExcedeAprobadaError(
                            f'Cantidad entregada excede aprobada para {detalle.producto.sku}.'
                        )

            MovimientoInventarioService.registrar_movimiento(
                MovimientoInput(
                    empresa=entrega.empresa,
                    producto=detalle.producto,
                    tipo_movimiento_codigo='SALIDA_ENTREGA',
                    cantidad=detalle.cantidad_entregada,
                    created_by=usuario,
                    bodega_origen=entrega.bodega,
                    serie=detalle.serie,
                    lote=detalle.lote,
                    centro_costo=entrega.centro_costo,
                    referencia_tipo=Entrega.TIPO_DOCUMENTO,
                    referencia_id=str(entrega.pk),
                )
            )

        estado_anterior = entrega.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            entrega, Entrega.TIPO_DOCUMENTO, 'CERRADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            entrega, Entrega.TIPO_DOCUMENTO, estado_anterior, usuario
        )

        if entrega.solicitud_id:
            SolicitudService.cerrar(entrega.solicitud, usuario)

        return entrega
