from datetime import date
from decimal import Decimal

from django.db import transaction

from core.models import Bodega, Empresa
from inventory.models import Lote, Producto, Proveedor
from inventory.services.movimiento_inventario_service import (
    MovimientoInventarioService,
    MovimientoInput,
)
from operations.models import Compra, CompraDetalle
from operations.services.documento_estado_service import DocumentoEstadoService
from operations.services.exceptions import DocumentoNoAprobadoError, DocumentoSinDetalleError
from operations.services.historial_documento_service import HistorialDocumentoService
from security.models import Usuario
from support.services.numerador_service import NumeradorService


class CompraService:
    @staticmethod
    @transaction.atomic
    def crear(
        empresa: Empresa,
        proveedor: Proveedor,
        bodega_destino: Bodega,
        usuario: Usuario,
        fecha_compra: date | None = None,
        observacion: str | None = None,
    ) -> Compra:
        numero = NumeradorService.generar_folio(empresa, Compra.TIPO_DOCUMENTO)
        compra = Compra.objects.create(
            empresa=empresa,
            numero=numero,
            proveedor=proveedor,
            bodega_destino=bodega_destino,
            estado=DocumentoEstadoService.obtener_estado('BORRADOR'),
            fecha_compra=fecha_compra or date.today(),
            observacion=observacion,
            created_by=usuario,
        )
        HistorialDocumentoService.registrar(
            empresa=empresa,
            documento_tipo=Compra.TIPO_DOCUMENTO,
            documento_id=compra.pk,
            estado_anterior=None,
            estado_nuevo='BORRADOR',
            usuario=usuario,
        )
        return compra

    @staticmethod
    @transaction.atomic
    def agregar_detalle(
        compra: Compra,
        producto: Producto,
        cantidad: Decimal,
        costo_unitario: Decimal,
        lote: Lote | None = None,
        numero_serie: str | None = None,
    ) -> CompraDetalle:
        DocumentoEstadoService.validar_editable(compra.estado.codigo)
        return CompraDetalle.objects.create(
            compra=compra,
            producto=producto,
            lote=lote,
            numero_serie=numero_serie,
            cantidad=cantidad,
            costo_unitario=costo_unitario,
        )

    @staticmethod
    @transaction.atomic
    def enviar(compra: Compra, usuario: Usuario) -> Compra:
        compra = Compra.objects.select_for_update().get(pk=compra.pk)
        if not compra.detalles.exists():
            raise DocumentoSinDetalleError('La compra no tiene detalle.')
        estado_anterior = compra.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            compra, Compra.TIPO_DOCUMENTO, 'PENDIENTE', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            compra, Compra.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return compra

    @staticmethod
    @transaction.atomic
    def aprobar(compra: Compra, usuario: Usuario) -> Compra:
        compra = Compra.objects.select_for_update().get(pk=compra.pk)
        estado_anterior = compra.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            compra, Compra.TIPO_DOCUMENTO, 'APROBADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            compra, Compra.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return compra

    @staticmethod
    @transaction.atomic
    def confirmar(compra: Compra, usuario: Usuario) -> Compra:
        compra = (
            Compra.objects.select_for_update()
            .select_related('bodega_destino')
            .prefetch_related('detalles__producto', 'detalles__lote')
            .get(pk=compra.pk)
        )
        if compra.estado.codigo != 'APROBADO':
            raise DocumentoNoAprobadoError('La compra debe estar aprobada para confirmar recepción.')
        if not compra.detalles.exists():
            raise DocumentoSinDetalleError('La compra no tiene detalle.')

        for detalle in compra.detalles.all():
            if detalle.producto.tipo_control_inventario.codigo == 'SERIALIZADO':
                if not detalle.numero_serie:
                    raise DocumentoSinDetalleError(
                        f'Producto serializado {detalle.producto.sku} requiere numero_serie en detalle.'
                    )
                MovimientoInventarioService.registrar_entrada_serializada(
                    MovimientoInput(
                        empresa=compra.empresa,
                        producto=detalle.producto,
                        tipo_movimiento_codigo='ENTRADA_COMPRA',
                        cantidad=Decimal('1'),
                        created_by=usuario,
                        bodega_destino=compra.bodega_destino,
                        costo_unitario=detalle.costo_unitario,
                        referencia_tipo=Compra.TIPO_DOCUMENTO,
                        referencia_id=str(compra.pk),
                    ),
                    numero_serie=detalle.numero_serie,
                )
            else:
                MovimientoInventarioService.registrar_movimiento(
                    MovimientoInput(
                        empresa=compra.empresa,
                        producto=detalle.producto,
                        tipo_movimiento_codigo='ENTRADA_COMPRA',
                        cantidad=detalle.cantidad,
                        created_by=usuario,
                        bodega_destino=compra.bodega_destino,
                        lote=detalle.lote,
                        costo_unitario=detalle.costo_unitario,
                        referencia_tipo=Compra.TIPO_DOCUMENTO,
                        referencia_id=str(compra.pk),
                    )
                )

        estado_anterior = compra.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            compra, Compra.TIPO_DOCUMENTO, 'CERRADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            compra, Compra.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return compra
