from dataclasses import dataclass
from decimal import Decimal

from django.db import transaction

from catalogs.models import TipoMovimientoInventario
from core.models import Bodega, CentroCosto, Empresa
from inventory.models import Lote, MovimientoInventario, Producto, Serie
from inventory.services.exceptions import (
    BodegaRequeridaError,
    CantidadInvalidaError,
    MovimientoNoAnulableError,
    MovimientoYaAnuladoError,
)
from inventory.services.lote_service import LoteService
from inventory.services.serie_service import SerieService
from inventory.services.stock_service import StockService
from inventory.services.valorizacion_service import ValorizacionService
from security.models import Usuario


@dataclass
class MovimientoInput:
    empresa: Empresa
    producto: Producto
    tipo_movimiento_codigo: str
    cantidad: Decimal
    created_by: Usuario
    bodega_origen: Bodega | None = None
    bodega_destino: Bodega | None = None
    serie: Serie | None = None
    lote: Lote | None = None
    costo_unitario: Decimal | None = None
    centro_costo: CentroCosto | None = None
    referencia_tipo: str | None = None
    referencia_id: str | None = None
    observacion: str | None = None
    permitir_stock_negativo: bool = False
    omitir_actualizacion_serie: bool = False


class MovimientoInventarioService:
    @staticmethod
    @transaction.atomic
    def registrar_movimiento(datos: MovimientoInput) -> MovimientoInventario:
        producto = Producto.objects.select_for_update().get(pk=datos.producto.pk)
        tipo = TipoMovimientoInventario.objects.get(codigo=datos.tipo_movimiento_codigo)

        if datos.cantidad <= 0:
            raise CantidadInvalidaError('La cantidad debe ser mayor que cero.')

        if not producto.maneja_stock or not tipo.afecta_stock:
            raise CantidadInvalidaError('El producto o tipo de movimiento no afecta stock.')

        SerieService.validar_tipo_control_serie(producto, datos.serie, datos.lote)
        LoteService.validar_tipo_control_lote(producto, datos.lote, datos.serie)
        SerieService.validar_cantidad_serializada(producto, datos.cantidad)
        LoteService.validar_cantidad(producto, datos.cantidad)

        metodo = ValorizacionService.obtener_metodo_costeo(datos.empresa)
        ValorizacionService.asegurar_metodo_habilitado(metodo)

        naturaleza = tipo.naturaleza
        if naturaleza == TipoMovimientoInventario.NATURALEZA_ENTRADA:
            return MovimientoInventarioService._registrar_entrada(datos, producto, tipo, metodo)
        if naturaleza == TipoMovimientoInventario.NATURALEZA_SALIDA:
            return MovimientoInventarioService._registrar_salida(datos, producto, tipo, metodo)
        raise CantidadInvalidaError(
            f'El tipo de movimiento {tipo.codigo} no puede registrarse directamente.'
        )

    @staticmethod
    def _registrar_entrada(
        datos: MovimientoInput,
        producto: Producto,
        tipo: TipoMovimientoInventario,
        metodo,
    ) -> MovimientoInventario:
        if datos.bodega_destino is None:
            raise BodegaRequeridaError('La entrada requiere bodega destino.')

        es_traslado_interno = tipo.codigo == 'TRASLADO_ENTRADA'
        if es_traslado_interno:
            costo_unitario = producto.costo_promedio_actual
        else:
            costo_unitario = datos.costo_unitario or Decimal('0')
        costo_total = ValorizacionService.calcular_costo_total(datos.cantidad, costo_unitario)

        if not es_traslado_interno:
            ValorizacionService.costo_entrada(producto, datos.cantidad, costo_unitario)

        stock = StockService.obtener_stock_bloqueado(
            datos.empresa,
            datos.bodega_destino,
            producto,
            datos.lote,
        )
        StockService.aplicar_entrada(stock, datos.cantidad, producto.costo_promedio_actual)

        if datos.serie and not datos.omitir_actualizacion_serie:
            SerieService.registrar_entrada(datos.serie, datos.bodega_destino)

        movimiento = MovimientoInventario.objects.create(
            empresa=datos.empresa,
            tipo_movimiento=tipo,
            producto=producto,
            serie=datos.serie,
            lote=datos.lote,
            bodega_destino=datos.bodega_destino,
            centro_costo=datos.centro_costo,
            cantidad=datos.cantidad,
            costo_unitario=costo_unitario,
            costo_total=costo_total,
            metodo_costeo=metodo,
            referencia_tipo=datos.referencia_tipo,
            referencia_id=datos.referencia_id,
            observacion=datos.observacion,
            created_by=datos.created_by,
        )
        return movimiento

    @staticmethod
    def _registrar_salida(
        datos: MovimientoInput,
        producto: Producto,
        tipo: TipoMovimientoInventario,
        metodo,
    ) -> MovimientoInventario:
        if datos.bodega_origen is None:
            raise BodegaRequeridaError('La salida requiere bodega origen.')

        if datos.serie:
            SerieService.validar_serie_disponible_en_bodega(datos.serie, datos.bodega_origen)

        stock = StockService.obtener_stock_bloqueado(
            datos.empresa,
            datos.bodega_origen,
            producto,
            datos.lote,
        )
        StockService.validar_stock_suficiente(
            stock,
            datos.cantidad,
            producto,
            override=datos.permitir_stock_negativo,
        )

        costo_unitario, costo_total = ValorizacionService.costo_salida(producto, datos.cantidad)
        StockService.aplicar_salida(stock, datos.cantidad)

        if datos.serie and not datos.omitir_actualizacion_serie:
            SerieService.registrar_salida(datos.serie, datos.centro_costo)

        movimiento = MovimientoInventario.objects.create(
            empresa=datos.empresa,
            tipo_movimiento=tipo,
            producto=producto,
            serie=datos.serie,
            lote=datos.lote,
            bodega_origen=datos.bodega_origen,
            centro_costo=datos.centro_costo,
            cantidad=datos.cantidad,
            costo_unitario=costo_unitario,
            costo_total=costo_total,
            metodo_costeo=metodo,
            referencia_tipo=datos.referencia_tipo,
            referencia_id=datos.referencia_id,
            observacion=datos.observacion,
            created_by=datos.created_by,
        )
        return movimiento

    @staticmethod
    @transaction.atomic
    def anular_movimiento(
        movimiento: MovimientoInventario,
        usuario: Usuario,
        observacion: str | None = None,
    ) -> MovimientoInventario:
        movimiento = (
            MovimientoInventario.objects.select_for_update()
            .select_related(
                'tipo_movimiento',
                'producto',
                'producto__tipo_control_inventario',
                'serie',
                'lote',
                'bodega_origen',
                'bodega_destino',
            )
            .get(pk=movimiento.pk)
        )

        if movimiento.anulado:
            raise MovimientoYaAnuladoError('El movimiento ya está anulado.')
        if movimiento.movimiento_origen_id is not None:
            raise MovimientoNoAnulableError('No se puede anular un movimiento de reversa.')
        if movimiento.reversas.filter(anulado=False).exists():
            raise MovimientoNoAnulableError('El movimiento ya tiene una reversa activa.')

        tipo_reversa = TipoMovimientoInventario.objects.get(codigo='REVERSA')
        metodo = ValorizacionService.obtener_metodo_costeo(movimiento.empresa)
        ValorizacionService.asegurar_metodo_habilitado(metodo)

        producto = Producto.objects.select_for_update().get(pk=movimiento.producto_id)
        naturaleza_original = movimiento.tipo_movimiento.naturaleza

        if naturaleza_original == TipoMovimientoInventario.NATURALEZA_ENTRADA:
            reversa = MovimientoInventarioService._revertir_entrada(
                movimiento, producto, tipo_reversa, metodo, usuario, observacion
            )
        elif naturaleza_original == TipoMovimientoInventario.NATURALEZA_SALIDA:
            reversa = MovimientoInventarioService._revertir_salida(
                movimiento, producto, tipo_reversa, metodo, usuario, observacion
            )
        else:
            raise MovimientoNoAnulableError(
                f'No se puede anular un movimiento de tipo {movimiento.tipo_movimiento.codigo}.'
            )

        movimiento.anulado = True
        movimiento.save(update_fields=['anulado', 'updated_at'])
        return reversa

    @staticmethod
    def _revertir_entrada(
        movimiento: MovimientoInventario,
        producto: Producto,
        tipo_reversa: TipoMovimientoInventario,
        metodo,
        usuario: Usuario,
        observacion: str | None,
    ) -> MovimientoInventario:
        bodega = movimiento.bodega_destino
        if bodega is None:
            raise MovimientoNoAnulableError('La entrada original no tiene bodega destino.')

        stock = StockService.obtener_stock_bloqueado(
            movimiento.empresa,
            bodega,
            producto,
            movimiento.lote,
        )
        StockService.validar_stock_suficiente(stock, movimiento.cantidad, producto)
        StockService.aplicar_salida(stock, movimiento.cantidad)
        ValorizacionService.revertir_entrada(
            producto,
            movimiento.cantidad,
            movimiento.costo_unitario,
        )

        if movimiento.serie:
            if movimiento.tipo_movimiento.codigo == 'TRASLADO_ENTRADA':
                SerieService.registrar_transito(movimiento.serie, None)
            else:
                SerieService.revertir_entrada(movimiento.serie)

        return MovimientoInventario.objects.create(
            empresa=movimiento.empresa,
            tipo_movimiento=tipo_reversa,
            producto=producto,
            serie=movimiento.serie,
            lote=movimiento.lote,
            bodega_origen=bodega,
            cantidad=movimiento.cantidad,
            costo_unitario=movimiento.costo_unitario,
            costo_total=movimiento.costo_total,
            metodo_costeo=metodo,
            movimiento_origen=movimiento,
            referencia_tipo=movimiento.referencia_tipo,
            referencia_id=movimiento.referencia_id,
            observacion=observacion or f'Reversa de movimiento #{movimiento.pk}',
            created_by=usuario,
        )

    @staticmethod
    def _revertir_salida(
        movimiento: MovimientoInventario,
        producto: Producto,
        tipo_reversa: TipoMovimientoInventario,
        metodo,
        usuario: Usuario,
        observacion: str | None,
    ) -> MovimientoInventario:
        bodega = movimiento.bodega_origen
        if bodega is None:
            raise MovimientoNoAnulableError('La salida original no tiene bodega origen.')

        costo_unitario, costo_total = ValorizacionService.revertir_salida(producto, movimiento)

        stock = StockService.obtener_stock_bloqueado(
            movimiento.empresa,
            bodega,
            producto,
            movimiento.lote,
        )
        StockService.aplicar_entrada(stock, movimiento.cantidad, costo_unitario)

        if movimiento.serie:
            SerieService.revertir_salida(movimiento.serie, bodega)

        return MovimientoInventario.objects.create(
            empresa=movimiento.empresa,
            tipo_movimiento=tipo_reversa,
            producto=producto,
            serie=movimiento.serie,
            lote=movimiento.lote,
            bodega_destino=bodega,
            cantidad=movimiento.cantidad,
            costo_unitario=costo_unitario,
            costo_total=costo_total,
            metodo_costeo=metodo,
            movimiento_origen=movimiento,
            referencia_tipo=movimiento.referencia_tipo,
            referencia_id=movimiento.referencia_id,
            observacion=observacion or f'Reversa de movimiento #{movimiento.pk}',
            created_by=usuario,
        )

    @staticmethod
    @transaction.atomic
    def registrar_entrada_serializada(
        datos: MovimientoInput,
        numero_serie: str,
    ) -> MovimientoInventario:
        if datos.producto.tipo_control_inventario.codigo != 'SERIALIZADO':
            raise CantidadInvalidaError(
                'registrar_entrada_serializada solo aplica a productos serializados.'
            )
        serie = SerieService.crear_serie(
            datos.producto,
            numero_serie,
            bodega=None,
        )
        payload = MovimientoInput(
            empresa=datos.empresa,
            producto=datos.producto,
            tipo_movimiento_codigo=datos.tipo_movimiento_codigo,
            cantidad=Decimal('1'),
            created_by=datos.created_by,
            bodega_destino=datos.bodega_destino,
            serie=serie,
            costo_unitario=datos.costo_unitario,
            referencia_tipo=datos.referencia_tipo,
            referencia_id=datos.referencia_id,
            observacion=datos.observacion,
        )
        return MovimientoInventarioService.registrar_movimiento(payload)
