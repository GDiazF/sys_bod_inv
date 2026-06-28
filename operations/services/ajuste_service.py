from datetime import date
from decimal import Decimal

from django.db import transaction

from core.models import Bodega, Empresa
from inventory.models import Lote, Producto, Serie
from inventory.services.movimiento_inventario_service import (
    MovimientoInventarioService,
    MovimientoInput,
)
from inventory.services.stock_service import StockService
from operations.models import AjusteInventario, AjusteInventarioDetalle
from operations.services.documento_anulacion_service import DocumentoAnulacionService
from operations.services.documento_estado_service import DocumentoEstadoService
from operations.services.exceptions import DocumentoNoAprobadoError, DocumentoSinDetalleError
from operations.services.historial_documento_service import HistorialDocumentoService
from operations.services.tenant_validation import (
    validar_detalle_operacion,
    validar_objetos_misma_empresa,
    validar_usuario_empresa,
)
from security.models import Usuario
from support.services.numerador_service import NumeradorService


class AjusteInventarioService:
    @staticmethod
    @transaction.atomic
    def crear(
        empresa: Empresa,
        bodega: Bodega,
        usuario: Usuario,
        fecha_ajuste: date | None = None,
        motivo: str | None = None,
    ) -> AjusteInventario:
        validar_usuario_empresa(usuario, empresa.id)
        validar_objetos_misma_empresa(
            empresa.id,
            bodega,
            etiquetas=['bodega'],
        )
        numero = NumeradorService.generar_folio(empresa, AjusteInventario.TIPO_DOCUMENTO)
        ajuste = AjusteInventario.objects.create(
            empresa=empresa,
            numero=numero,
            bodega=bodega,
            estado=DocumentoEstadoService.obtener_estado('BORRADOR'),
            fecha_ajuste=fecha_ajuste or date.today(),
            motivo=motivo,
            created_by=usuario,
        )
        HistorialDocumentoService.registrar(
            empresa=empresa,
            documento_tipo=AjusteInventario.TIPO_DOCUMENTO,
            documento_id=ajuste.pk,
            estado_anterior=None,
            estado_nuevo='BORRADOR',
            usuario=usuario,
        )
        return ajuste

    @staticmethod
    @transaction.atomic
    def agregar_detalle_desde_conteo(
        ajuste: AjusteInventario,
        producto: Producto,
        cantidad_contada: Decimal,
        serie: Serie | None = None,
        lote: Lote | None = None,
    ) -> AjusteInventarioDetalle:
        DocumentoEstadoService.validar_editable(ajuste.estado.codigo)
        validar_detalle_operacion(
            ajuste.empresa_id,
            producto,
            serie=serie,
            lote=lote,
            cantidad=abs(cantidad_contada),
            bodega=ajuste.bodega,
        )
        cantidad_sistema = StockService.obtener_stock(ajuste.bodega, producto, lote)
        return AjusteInventarioDetalle.objects.create(
            ajuste=ajuste,
            producto=producto,
            serie=serie,
            lote=lote,
            cantidad_sistema=cantidad_sistema,
            cantidad_contada=cantidad_contada,
        )

    @staticmethod
    @transaction.atomic
    def enviar(ajuste: AjusteInventario, usuario: Usuario) -> AjusteInventario:
        ajuste = AjusteInventario.objects.select_for_update().get(pk=ajuste.pk)
        if not ajuste.detalles.exists():
            raise DocumentoSinDetalleError('El ajuste no tiene detalle.')
        estado_anterior = ajuste.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            ajuste, AjusteInventario.TIPO_DOCUMENTO, 'PENDIENTE', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            ajuste, AjusteInventario.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return ajuste

    @staticmethod
    @transaction.atomic
    def aprobar(ajuste: AjusteInventario, usuario: Usuario) -> AjusteInventario:
        ajuste = AjusteInventario.objects.select_for_update().get(pk=ajuste.pk)
        estado_anterior = ajuste.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            ajuste, AjusteInventario.TIPO_DOCUMENTO, 'APROBADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            ajuste, AjusteInventario.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return ajuste

    @staticmethod
    @transaction.atomic
    def ejecutar(ajuste: AjusteInventario, usuario: Usuario) -> AjusteInventario:
        ajuste = (
            AjusteInventario.objects.select_for_update()
            .select_related('bodega')
            .prefetch_related('detalles__producto', 'detalles__serie', 'detalles__lote')
            .get(pk=ajuste.pk)
        )
        if ajuste.estado.codigo != 'APROBADO':
            raise DocumentoNoAprobadoError('El ajuste debe estar aprobado para ejecutarse.')

        for detalle in ajuste.detalles.all():
            cantidad_sistema = StockService.obtener_stock(
                ajuste.bodega, detalle.producto, detalle.lote
            )
            diferencia = detalle.cantidad_contada - cantidad_sistema
            if diferencia == 0:
                continue

            if diferencia > 0:
                tipo_codigo = 'AJUSTE_POSITIVO'
                payload = MovimientoInput(
                    empresa=ajuste.empresa,
                    producto=detalle.producto,
                    tipo_movimiento_codigo=tipo_codigo,
                    cantidad=diferencia,
                    created_by=usuario,
                    bodega_destino=ajuste.bodega,
                    serie=detalle.serie,
                    lote=detalle.lote,
                    costo_unitario=detalle.producto.costo_promedio_actual,
                    referencia_tipo=AjusteInventario.TIPO_DOCUMENTO,
                    referencia_id=str(ajuste.pk),
                )
            else:
                tipo_codigo = 'AJUSTE_NEGATIVO'
                payload = MovimientoInput(
                    empresa=ajuste.empresa,
                    producto=detalle.producto,
                    tipo_movimiento_codigo=tipo_codigo,
                    cantidad=abs(diferencia),
                    created_by=usuario,
                    bodega_origen=ajuste.bodega,
                    serie=detalle.serie,
                    lote=detalle.lote,
                    referencia_tipo=AjusteInventario.TIPO_DOCUMENTO,
                    referencia_id=str(ajuste.pk),
                )
            MovimientoInventarioService.registrar_movimiento(payload)

        estado_anterior = ajuste.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            ajuste, AjusteInventario.TIPO_DOCUMENTO, 'CERRADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            ajuste, AjusteInventario.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return ajuste

    @staticmethod
    @transaction.atomic
    def anular(ajuste: AjusteInventario, usuario: Usuario) -> AjusteInventario:
        ajuste = AjusteInventario.objects.select_for_update().get(pk=ajuste.pk)
        estado_anterior = ajuste.estado.codigo
        if estado_anterior == 'CERRADO':
            DocumentoAnulacionService.reversar_movimientos(
                AjusteInventario.TIPO_DOCUMENTO,
                ajuste.pk,
                usuario,
                ajuste.empresa_id,
            )
        DocumentoEstadoService.cambiar_estado(
            ajuste, AjusteInventario.TIPO_DOCUMENTO, 'ANULADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            ajuste, AjusteInventario.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return ajuste
