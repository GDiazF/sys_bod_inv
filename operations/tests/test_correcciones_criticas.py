from decimal import Decimal

import pytest

from inventory.models import MovimientoInventario, Serie
from inventory.services.movimiento_inventario_service import (
    MovimientoInventarioService,
    MovimientoInput,
)
from inventory.services.stock_service import StockService
from operations.services.ajuste_service import AjusteInventarioService
from operations.services.compra_service import CompraService
from operations.services.entrega_service import EntregaService
from operations.services.solicitud_service import SolicitudService
from operations.services.traslado_service import TrasladoService
from operations.tests.conftest import entrada_stock


@pytest.mark.django_db
class TestTrasladoPreservaCosto:
    def test_traslado_no_altera_costo_promedio(self, empresa, bodega_a, bodega_b, producto, usuario):
        entrada_stock(empresa, producto, bodega_a, usuario, '30', '100')
        producto.refresh_from_db()
        costo_inicial = producto.costo_promedio_actual

        traslado = TrasladoService.crear(empresa, bodega_a, bodega_b, usuario)
        TrasladoService.agregar_detalle(traslado, producto, Decimal('12'))
        traslado = TrasladoService.enviar(traslado, usuario)
        traslado = TrasladoService.aprobar(traslado, usuario)
        traslado = TrasladoService.despachar(traslado, usuario)
        TrasladoService.recibir(traslado, usuario)

        producto.refresh_from_db()
        assert producto.costo_promedio_actual == costo_inicial


@pytest.mark.django_db
class TestSolicitudEntregaSerializado:
    def test_flujo_solicitud_entrega_serializado(
        self,
        empresa,
        centro_costo,
        bodega_a,
        unidad,
        usuario,
        catalogos_globales,
    ):
        from catalogs.models import TipoControlInventario
        from inventory.models import Producto

        producto_ser = Producto.objects.create(
            empresa=empresa,
            sku='SER-SOL',
            nombre='Notebook Solicitud',
            unidad_medida=unidad,
            tipo_control_inventario=TipoControlInventario.objects.get(codigo='SERIALIZADO'),
        )
        MovimientoInventarioService.registrar_entrada_serializada(
            MovimientoInput(
                empresa=empresa,
                producto=producto_ser,
                tipo_movimiento_codigo='ENTRADA_COMPRA',
                cantidad=Decimal('1'),
                costo_unitario=Decimal('500'),
                created_by=usuario,
                bodega_destino=bodega_a,
            ),
            numero_serie='NB-SOL-001',
        )
        serie = Serie.objects.get(numero_serie='NB-SOL-001')

        solicitud = SolicitudService.crear(empresa, centro_costo, usuario)
        SolicitudService.agregar_detalle(
            solicitud, producto_ser, Decimal('1'), serie=serie
        )
        solicitud = SolicitudService.enviar(solicitud, usuario)
        solicitud = SolicitudService.aprobar(solicitud, usuario)

        entrega = EntregaService.crear_desde_solicitud(solicitud, bodega_a, usuario)
        entrega = EntregaService.ejecutar(entrega, usuario)

        assert entrega.estado.codigo == 'CERRADO'
        serie.refresh_from_db()
        assert serie.estado_serie.codigo == 'ENTREGADO'
        assert StockService.obtener_stock(bodega_a, producto_ser) == Decimal('0')


@pytest.mark.django_db
class TestAjusteRecalculaStock:
    def test_ajuste_ejecutar_usa_stock_actual(
        self, empresa, bodega_a, producto, usuario
    ):
        entrada_stock(empresa, producto, bodega_a, usuario, '10')

        ajuste = AjusteInventarioService.crear(empresa, bodega_a, usuario)
        AjusteInventarioService.agregar_detalle_desde_conteo(
            ajuste, producto, Decimal('7')
        )

        MovimientoInventarioService.registrar_movimiento(
            MovimientoInput(
                empresa=empresa,
                producto=producto,
                tipo_movimiento_codigo='SALIDA_ENTREGA',
                cantidad=Decimal('3'),
                created_by=usuario,
                bodega_origen=bodega_a,
            )
        )

        ajuste = AjusteInventarioService.enviar(ajuste, usuario)
        ajuste = AjusteInventarioService.aprobar(ajuste, usuario)
        ajuste = AjusteInventarioService.ejecutar(ajuste, usuario)

        assert ajuste.estado.codigo == 'CERRADO'
        assert StockService.obtener_stock(bodega_a, producto) == Decimal('7')


@pytest.mark.django_db
class TestAnulacionDocumentos:
    def test_anular_entrega_cerrada_revierte_stock(
        self, empresa, centro_costo, bodega_a, producto, usuario
    ):
        entrada_stock(empresa, producto, bodega_a, usuario, '20')
        solicitud = SolicitudService.crear(empresa, centro_costo, usuario)
        SolicitudService.agregar_detalle(solicitud, producto, Decimal('5'))
        solicitud = SolicitudService.enviar(solicitud, usuario)
        solicitud = SolicitudService.aprobar(solicitud, usuario)
        entrega = EntregaService.crear_desde_solicitud(solicitud, bodega_a, usuario)
        entrega = EntregaService.ejecutar(entrega, usuario)

        assert StockService.obtener_stock(bodega_a, producto) == Decimal('15')

        entrega = EntregaService.anular(entrega, usuario)
        assert entrega.estado.codigo == 'ANULADO'
        assert StockService.obtener_stock(bodega_a, producto) == Decimal('20')

    def test_anular_traslado_en_transito_revierte_origen(
        self, empresa, bodega_a, bodega_b, producto, usuario
    ):
        entrada_stock(empresa, producto, bodega_a, usuario, '20')
        traslado = TrasladoService.crear(empresa, bodega_a, bodega_b, usuario)
        TrasladoService.agregar_detalle(traslado, producto, Decimal('8'))
        traslado = TrasladoService.enviar(traslado, usuario)
        traslado = TrasladoService.aprobar(traslado, usuario)
        traslado = TrasladoService.despachar(traslado, usuario)

        assert StockService.obtener_stock(bodega_a, producto) == Decimal('12')

        traslado = TrasladoService.anular(traslado, usuario)
        assert traslado.estado.codigo == 'ANULADO'
        assert StockService.obtener_stock(bodega_a, producto) == Decimal('20')

    def test_anular_traslado_en_transito_serializado_restaura_serie_en_origen(
        self,
        empresa,
        unidad,
        bodega_a,
        bodega_b,
        usuario,
        catalogos_globales,
    ):
        from catalogs.models import TipoControlInventario
        from inventory.models import Producto

        producto_ser = Producto.objects.create(
            empresa=empresa,
            sku='SER-TRA-ANUL',
            nombre='Notebook Traslado Anulacion',
            unidad_medida=unidad,
            tipo_control_inventario=TipoControlInventario.objects.get(codigo='SERIALIZADO'),
        )
        MovimientoInventarioService.registrar_entrada_serializada(
            MovimientoInput(
                empresa=empresa,
                producto=producto_ser,
                tipo_movimiento_codigo='ENTRADA_COMPRA',
                cantidad=Decimal('1'),
                costo_unitario=Decimal('500'),
                created_by=usuario,
                bodega_destino=bodega_a,
            ),
            numero_serie='NB-ANUL-001',
        )
        serie = Serie.objects.get(numero_serie='NB-ANUL-001')

        traslado = TrasladoService.crear(empresa, bodega_a, bodega_b, usuario)
        TrasladoService.agregar_detalle(traslado, producto_ser, Decimal('1'), serie=serie)
        traslado = TrasladoService.enviar(traslado, usuario)
        traslado = TrasladoService.aprobar(traslado, usuario)
        traslado = TrasladoService.despachar(traslado, usuario)

        serie.refresh_from_db()
        assert traslado.estado.codigo == 'EN_TRANSITO'
        assert serie.estado_serie.codigo == 'EN_TRANSITO'

        traslado = TrasladoService.anular(traslado, usuario)

        serie.refresh_from_db()
        assert traslado.estado.codigo == 'ANULADO'
        assert serie.estado_serie.codigo == 'DISPONIBLE'
        assert serie.bodega_actual_id == bodega_a.id
        assert StockService.obtener_stock(bodega_a, producto_ser) == Decimal('1')

    def test_anular_compra_cerrada_revierte_stock(
        self, empresa, proveedor, bodega_a, producto, usuario
    ):
        compra = CompraService.crear(empresa, proveedor, bodega_a, usuario)
        CompraService.agregar_detalle(compra, producto, Decimal('10'), Decimal('25'))
        compra = CompraService.enviar(compra, usuario)
        compra = CompraService.aprobar(compra, usuario)
        compra = CompraService.confirmar(compra, usuario)

        assert StockService.obtener_stock(bodega_a, producto) == Decimal('10')

        compra = CompraService.anular(compra, usuario)
        assert compra.estado.codigo == 'ANULADO'
        assert StockService.obtener_stock(bodega_a, producto) == Decimal('0')

    def test_anular_ajuste_cerrado_revierte_stock(
        self, empresa, bodega_a, producto, usuario
    ):
        entrada_stock(empresa, producto, bodega_a, usuario, '10')
        ajuste = AjusteInventarioService.crear(empresa, bodega_a, usuario)
        AjusteInventarioService.agregar_detalle_desde_conteo(
            ajuste, producto, Decimal('6')
        )
        ajuste = AjusteInventarioService.enviar(ajuste, usuario)
        ajuste = AjusteInventarioService.aprobar(ajuste, usuario)
        ajuste = AjusteInventarioService.ejecutar(ajuste, usuario)

        assert StockService.obtener_stock(bodega_a, producto) == Decimal('6')

        ajuste = AjusteInventarioService.anular(ajuste, usuario)
        assert ajuste.estado.codigo == 'ANULADO'
        assert StockService.obtener_stock(bodega_a, producto) == Decimal('10')
