from decimal import Decimal

import pytest

from core.models import ParametroEmpresa
from inventory.models import MovimientoInventario, Serie
from inventory.services.exceptions import (
    LoteRequeridoError,
    SerieProhibidaError,
    SerieRequeridaError,
    StockInsuficienteError,
)
from inventory.services.movimiento_inventario_service import MovimientoInventarioService
from inventory.services.stock_service import StockService


@pytest.mark.django_db
class TestEntradaSalida:
    def test_entrada_incrementa_stock(
        self, movimiento_input_base, producto_no_serializado, bodega
    ):
        datos = movimiento_input_base(
            producto=producto_no_serializado,
            tipo_movimiento_codigo='ENTRADA_COMPRA',
            bodega_destino=bodega,
            cantidad=Decimal('25'),
            costo_unitario=Decimal('50'),
        )
        MovimientoInventarioService.registrar_movimiento(datos)

        assert StockService.obtener_stock(bodega, producto_no_serializado) == Decimal('25')
        producto_no_serializado.refresh_from_db()
        assert producto_no_serializado.costo_promedio_actual == Decimal('50.0000')

    def test_salida_decrementa_stock(
        self, movimiento_input_base, producto_no_serializado, bodega
    ):
        MovimientoInventarioService.registrar_movimiento(
            movimiento_input_base(
                producto=producto_no_serializado,
                tipo_movimiento_codigo='ENTRADA_COMPRA',
                bodega_destino=bodega,
                cantidad=Decimal('30'),
                costo_unitario=Decimal('10'),
            )
        )
        MovimientoInventarioService.registrar_movimiento(
            movimiento_input_base(
                producto=producto_no_serializado,
                tipo_movimiento_codigo='SALIDA_ENTREGA',
                bodega_origen=bodega,
                cantidad=Decimal('12'),
            )
        )
        assert StockService.obtener_stock(bodega, producto_no_serializado) == Decimal('18')

    def test_salida_stock_insuficiente(
        self, movimiento_input_base, producto_no_serializado, bodega
    ):
        with pytest.raises(StockInsuficienteError):
            MovimientoInventarioService.registrar_movimiento(
                movimiento_input_base(
                    producto=producto_no_serializado,
                    tipo_movimiento_codigo='SALIDA_ENTREGA',
                    bodega_origen=bodega,
                    cantidad=Decimal('1'),
                )
            )


@pytest.mark.django_db
class TestStockNegativo:
    def test_stock_negativo_bloqueado_por_defecto(
        self, movimiento_input_base, producto_no_serializado, bodega, empresa
    ):
        producto_no_serializado.permite_stock_negativo = True
        producto_no_serializado.save()

        with pytest.raises(StockInsuficienteError):
            MovimientoInventarioService.registrar_movimiento(
                movimiento_input_base(
                    producto=producto_no_serializado,
                    tipo_movimiento_codigo='SALIDA_ENTREGA',
                    bodega_origen=bodega,
                    cantidad=Decimal('5'),
                )
            )

    def test_stock_negativo_con_parametros_y_producto(
        self, movimiento_input_base, producto_no_serializado, bodega, empresa
    ):
        parametros = ParametroEmpresa.objects.get(empresa=empresa)
        parametros.stock_negativo_permitido = True
        parametros.save()
        producto_no_serializado.permite_stock_negativo = True
        producto_no_serializado.save()

        MovimientoInventarioService.registrar_movimiento(
            movimiento_input_base(
                producto=producto_no_serializado,
                tipo_movimiento_codigo='SALIDA_ENTREGA',
                bodega_origen=bodega,
                cantidad=Decimal('5'),
            )
        )
        assert StockService.obtener_stock(bodega, producto_no_serializado) == Decimal('-5')

    def test_override_stock_negativo(
        self, movimiento_input_base, producto_no_serializado, bodega
    ):
        MovimientoInventarioService.registrar_movimiento(
            movimiento_input_base(
                producto=producto_no_serializado,
                tipo_movimiento_codigo='SALIDA_ENTREGA',
                bodega_origen=bodega,
                cantidad=Decimal('3'),
                permitir_stock_negativo=True,
            )
        )
        assert StockService.obtener_stock(bodega, producto_no_serializado) == Decimal('-3')


@pytest.mark.django_db
class TestReversa:
    def test_reversa_salida_restaura_stock(
        self, movimiento_input_base, producto_no_serializado, bodega, usuario
    ):
        MovimientoInventarioService.registrar_movimiento(
            movimiento_input_base(
                producto=producto_no_serializado,
                tipo_movimiento_codigo='ENTRADA_COMPRA',
                bodega_destino=bodega,
                cantidad=Decimal('20'),
                costo_unitario=Decimal('40'),
            )
        )
        salida = MovimientoInventarioService.registrar_movimiento(
            movimiento_input_base(
                producto=producto_no_serializado,
                tipo_movimiento_codigo='SALIDA_ENTREGA',
                bodega_origen=bodega,
                cantidad=Decimal('8'),
            )
        )
        MovimientoInventarioService.anular_movimiento(salida, usuario)

        assert StockService.obtener_stock(bodega, producto_no_serializado) == Decimal('20')
        salida.refresh_from_db()
        assert salida.anulado is True
        assert MovimientoInventario.objects.filter(movimiento_origen=salida).count() == 1

    def test_reversa_entrada_restaura_stock(
        self, movimiento_input_base, producto_no_serializado, bodega, usuario
    ):
        entrada = MovimientoInventarioService.registrar_movimiento(
            movimiento_input_base(
                producto=producto_no_serializado,
                tipo_movimiento_codigo='ENTRADA_COMPRA',
                bodega_destino=bodega,
                cantidad=Decimal('15'),
                costo_unitario=Decimal('20'),
            )
        )
        MovimientoInventarioService.anular_movimiento(entrada, usuario)
        assert StockService.obtener_stock(bodega, producto_no_serializado) == Decimal('0')
        entrada.refresh_from_db()
        assert entrada.anulado is True


@pytest.mark.django_db
class TestTipoControl:
    def test_serializado_requiere_serie(
        self, movimiento_input_base, producto_serializado, bodega
    ):
        with pytest.raises(SerieRequeridaError):
            MovimientoInventarioService.registrar_movimiento(
                movimiento_input_base(
                    producto=producto_serializado,
                    tipo_movimiento_codigo='SALIDA_ENTREGA',
                    bodega_origen=bodega,
                    cantidad=Decimal('1'),
                )
            )

    def test_no_serializado_rechaza_serie(
        self, movimiento_input_base, producto_no_serializado, bodega, serie_disponible
    ):
        with pytest.raises(SerieProhibidaError):
            MovimientoInventarioService.registrar_movimiento(
                movimiento_input_base(
                    producto=producto_no_serializado,
                    tipo_movimiento_codigo='ENTRADA_COMPRA',
                    bodega_destino=bodega,
                    serie=serie_disponible,
                    cantidad=Decimal('10'),
                )
            )

    def test_por_lote_requiere_lote(
        self, movimiento_input_base, producto_por_lote, bodega
    ):
        with pytest.raises(LoteRequeridoError):
            MovimientoInventarioService.registrar_movimiento(
                movimiento_input_base(
                    producto=producto_por_lote,
                    tipo_movimiento_codigo='ENTRADA_COMPRA',
                    bodega_destino=bodega,
                    cantidad=Decimal('5'),
                )
            )

    def test_por_lote_con_lote_ok(
        self, movimiento_input_base, producto_por_lote, bodega, lote
    ):
        MovimientoInventarioService.registrar_movimiento(
            movimiento_input_base(
                producto=producto_por_lote,
                tipo_movimiento_codigo='ENTRADA_COMPRA',
                bodega_destino=bodega,
                lote=lote,
                cantidad=Decimal('5'),
                costo_unitario=Decimal('15'),
            )
        )
        assert StockService.obtener_stock(bodega, producto_por_lote, lote) == Decimal('5')

    def test_entrada_serializada_flujo_completo(
        self, movimiento_input_base, producto_serializado, bodega, empresa
    ):
        datos = movimiento_input_base(
            producto=producto_serializado,
            tipo_movimiento_codigo='ENTRADA_COMPRA',
            bodega_destino=bodega,
            costo_unitario=Decimal('500'),
        )
        mov = MovimientoInventarioService.registrar_entrada_serializada(
            datos,
            numero_serie='NB-999',
        )
        serie = Serie.objects.get(numero_serie='NB-999', empresa=empresa)
        assert mov.serie_id == serie.id
        assert serie.estado_serie.codigo == 'DISPONIBLE'
        assert serie.bodega_actual_id == bodega.id
        assert StockService.obtener_stock(bodega, producto_serializado) == Decimal('1')

    def test_salida_serializada_cambia_estado(
        self,
        movimiento_input_base,
        producto_serializado,
        bodega,
    ):
        MovimientoInventarioService.registrar_entrada_serializada(
            movimiento_input_base(
                producto=producto_serializado,
                tipo_movimiento_codigo='ENTRADA_COMPRA',
                bodega_destino=bodega,
                costo_unitario=Decimal('500'),
            ),
            numero_serie='SN-100',
        )
        serie = Serie.objects.get(numero_serie='SN-100')
        MovimientoInventarioService.registrar_movimiento(
            movimiento_input_base(
                producto=producto_serializado,
                tipo_movimiento_codigo='SALIDA_ENTREGA',
                bodega_origen=bodega,
                serie=serie,
                cantidad=Decimal('1'),
            )
        )
        serie.refresh_from_db()
        assert serie.estado_serie.codigo == 'ENTREGADO'
        assert serie.bodega_actual is None
