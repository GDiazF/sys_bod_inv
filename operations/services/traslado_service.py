from datetime import date
from decimal import Decimal

from django.db import transaction

from core.models import Bodega, Empresa
from inventory.models import Lote, Producto, Serie
from inventory.services.movimiento_inventario_service import (
    MovimientoInventarioService,
    MovimientoInput,
)
from inventory.services.serie_service import SerieService
from operations.models import Traslado, TrasladoDetalle
from operations.services.documento_anulacion_service import DocumentoAnulacionService
from operations.services.documento_estado_service import DocumentoEstadoService
from operations.services.exceptions import (
    BodegaOrigenDestinoIgualError,
    DocumentoNoAprobadoError,
    DocumentoSinDetalleError,
    TrasladoEstadoInvalidoError,
)
from operations.services.historial_documento_service import HistorialDocumentoService
from operations.services.tenant_validation import (
    validar_detalle_operacion,
    validar_objetos_misma_empresa,
    validar_usuario_empresa,
)
from security.models import Usuario
from support.services.numerador_service import NumeradorService


class TrasladoService:
    @staticmethod
    @transaction.atomic
    def crear(
        empresa: Empresa,
        bodega_origen: Bodega,
        bodega_destino: Bodega,
        usuario: Usuario,
        bodega_transito: Bodega | None = None,
        motivo: str | None = None,
    ) -> Traslado:
        if bodega_origen.pk == bodega_destino.pk:
            raise BodegaOrigenDestinoIgualError(
                'La bodega origen y destino no pueden ser la misma.'
            )

        validar_usuario_empresa(usuario, empresa.id)
        validar_objetos_misma_empresa(
            empresa.id,
            bodega_origen,
            bodega_destino,
            bodega_transito,
            etiquetas=['bodega_origen', 'bodega_destino', 'bodega_transito'],
        )

        numero = NumeradorService.generar_folio(empresa, Traslado.TIPO_DOCUMENTO)
        traslado = Traslado.objects.create(
            empresa=empresa,
            numero=numero,
            bodega_origen=bodega_origen,
            bodega_destino=bodega_destino,
            bodega_transito=bodega_transito,
            estado=DocumentoEstadoService.obtener_estado('BORRADOR'),
            motivo=motivo,
            created_by=usuario,
        )
        HistorialDocumentoService.registrar(
            empresa=empresa,
            documento_tipo=Traslado.TIPO_DOCUMENTO,
            documento_id=traslado.pk,
            estado_anterior=None,
            estado_nuevo='BORRADOR',
            usuario=usuario,
        )
        return traslado

    @staticmethod
    @transaction.atomic
    def agregar_detalle(
        traslado: Traslado,
        producto: Producto,
        cantidad: Decimal,
        serie: Serie | None = None,
        lote: Lote | None = None,
    ) -> TrasladoDetalle:
        DocumentoEstadoService.validar_editable(traslado.estado.codigo)
        validar_detalle_operacion(
            traslado.empresa_id,
            producto,
            serie=serie,
            lote=lote,
            cantidad=cantidad,
            bodega=traslado.bodega_origen,
        )
        return TrasladoDetalle.objects.create(
            traslado=traslado,
            producto=producto,
            serie=serie,
            lote=lote,
            cantidad_trasladada=cantidad,
        )

    @staticmethod
    @transaction.atomic
    def enviar(traslado: Traslado, usuario: Usuario) -> Traslado:
        traslado = Traslado.objects.select_for_update().get(pk=traslado.pk)
        if not traslado.detalles.exists():
            raise DocumentoSinDetalleError('El traslado no tiene detalle.')
        estado_anterior = traslado.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            traslado, Traslado.TIPO_DOCUMENTO, 'PENDIENTE', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            traslado, Traslado.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return traslado

    @staticmethod
    @transaction.atomic
    def aprobar(traslado: Traslado, usuario: Usuario) -> Traslado:
        traslado = Traslado.objects.select_for_update().get(pk=traslado.pk)
        estado_anterior = traslado.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            traslado, Traslado.TIPO_DOCUMENTO, 'APROBADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            traslado, Traslado.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return traslado

    @staticmethod
    @transaction.atomic
    def despachar(traslado: Traslado, usuario: Usuario, fecha_salida: date | None = None) -> Traslado:
        traslado = (
            Traslado.objects.select_for_update()
            .select_related('bodega_origen', 'bodega_destino', 'bodega_transito')
            .prefetch_related('detalles__producto', 'detalles__serie', 'detalles__lote')
            .get(pk=traslado.pk)
        )
        if traslado.estado.codigo != 'APROBADO':
            raise DocumentoNoAprobadoError('El traslado debe estar aprobado para despachar.')

        bodega_transito = traslado.bodega_transito
        for detalle in traslado.detalles.all():
            MovimientoInventarioService.registrar_movimiento(
                MovimientoInput(
                    empresa=traslado.empresa,
                    producto=detalle.producto,
                    tipo_movimiento_codigo='TRASLADO_SALIDA',
                    cantidad=detalle.cantidad_trasladada,
                    created_by=usuario,
                    bodega_origen=traslado.bodega_origen,
                    serie=detalle.serie,
                    lote=detalle.lote,
                    referencia_tipo=Traslado.TIPO_DOCUMENTO,
                    referencia_id=str(traslado.pk),
                    omitir_actualizacion_serie=True,
                )
            )
            if detalle.serie:
                SerieService.registrar_transito(detalle.serie, bodega_transito)

        traslado.fecha_salida = fecha_salida or date.today()
        traslado.save(update_fields=['fecha_salida', 'updated_at'])

        estado_anterior = traslado.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            traslado, Traslado.TIPO_DOCUMENTO, 'EN_TRANSITO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            traslado, Traslado.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return traslado

    @staticmethod
    @transaction.atomic
    def recibir(traslado: Traslado, usuario: Usuario, fecha_recepcion: date | None = None) -> Traslado:
        traslado = (
            Traslado.objects.select_for_update()
            .select_related('bodega_destino')
            .prefetch_related('detalles__producto', 'detalles__serie', 'detalles__lote')
            .get(pk=traslado.pk)
        )
        if traslado.estado.codigo != 'EN_TRANSITO':
            raise TrasladoEstadoInvalidoError(
                'El traslado debe estar EN_TRANSITO para recibir.'
            )

        for detalle in traslado.detalles.all():
            MovimientoInventarioService.registrar_movimiento(
                MovimientoInput(
                    empresa=traslado.empresa,
                    producto=detalle.producto,
                    tipo_movimiento_codigo='TRASLADO_ENTRADA',
                    cantidad=detalle.cantidad_trasladada,
                    created_by=usuario,
                    bodega_destino=traslado.bodega_destino,
                    serie=detalle.serie,
                    lote=detalle.lote,
                    referencia_tipo=Traslado.TIPO_DOCUMENTO,
                    referencia_id=str(traslado.pk),
                    omitir_actualizacion_serie=True,
                )
            )
            if detalle.serie:
                SerieService.registrar_recepcion_traslado(
                    detalle.serie,
                    traslado.bodega_destino,
                )

        traslado.fecha_recepcion = fecha_recepcion or date.today()
        traslado.save(update_fields=['fecha_recepcion', 'updated_at'])

        estado_anterior = traslado.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            traslado, Traslado.TIPO_DOCUMENTO, 'CERRADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            traslado, Traslado.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return traslado

    @staticmethod
    @transaction.atomic
    def anular(traslado: Traslado, usuario: Usuario) -> Traslado:
        traslado = Traslado.objects.select_for_update().get(pk=traslado.pk)
        estado_anterior = traslado.estado.codigo
        if estado_anterior in {'EN_TRANSITO', 'CERRADO'}:
            DocumentoAnulacionService.reversar_movimientos(
                Traslado.TIPO_DOCUMENTO,
                traslado.pk,
                usuario,
                traslado.empresa_id,
            )
        DocumentoEstadoService.cambiar_estado(
            traslado, Traslado.TIPO_DOCUMENTO, 'ANULADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            traslado, Traslado.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return traslado
