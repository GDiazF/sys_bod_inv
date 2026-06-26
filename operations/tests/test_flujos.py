from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from inventory.models import MovimientoInventario, Serie
from inventory.services.movimiento_inventario_service import (
    MovimientoInventarioService,
    MovimientoInput,
)
from inventory.services.stock_service import StockService
from operations.models import EstadoHistorialDocumento
from operations.services.ajuste_service import AjusteInventarioService
from operations.services.compra_service import CompraService
from operations.services.entrega_service import EntregaService
from operations.services.solicitud_service import SolicitudService
from operations.services.traslado_service import TrasladoService
from operations.tests.conftest import entrada_stock


@pytest.mark.django_db
class TestFlujoSolicitudEntrega:
    def test_solicitud_aprobada_entrega_ejecutada(
        self,
        empresa,
        centro_costo,
        bodega_a,
        producto,
        usuario,
    ):
        entrada_stock(empresa, producto, bodega_a, usuario, '50')

        solicitud = SolicitudService.crear(empresa, centro_costo, usuario)
        SolicitudService.agregar_detalle(solicitud, producto, Decimal('10'))
        solicitud = SolicitudService.enviar(solicitud, usuario)
        solicitud = SolicitudService.aprobar(solicitud, usuario)

        entrega = EntregaService.crear_desde_solicitud(solicitud, bodega_a, usuario)
        entrega = EntregaService.ejecutar(entrega, usuario)

        assert entrega.estado.codigo == 'CERRADO'
        solicitud.refresh_from_db()
        assert solicitud.estado.codigo == 'CERRADO'
        assert StockService.obtener_stock(bodega_a, producto) == Decimal('40')
        assert MovimientoInventario.objects.filter(
            referencia_tipo='ENTREGA',
            referencia_id=str(entrega.pk),
            anulado=False,
        ).count() == 1
        assert EstadoHistorialDocumento.objects.filter(
            documento_tipo='ENTREGA',
            documento_id=str(entrega.pk),
        ).exists()


@pytest.mark.django_db
class TestFlujoTraslado:
    def test_traslado_aprobado_despachado_recibido(
        self,
        empresa,
        bodega_a,
        bodega_b,
        producto,
        usuario,
    ):
        entrada_stock(empresa, producto, bodega_a, usuario, '30')

        traslado = TrasladoService.crear(empresa, bodega_a, bodega_b, usuario)
        TrasladoService.agregar_detalle(traslado, producto, Decimal('12'))
        traslado = TrasladoService.enviar(traslado, usuario)
        traslado = TrasladoService.aprobar(traslado, usuario)
        traslado = TrasladoService.despachar(traslado, usuario)
        traslado = TrasladoService.recibir(traslado, usuario)

        assert traslado.estado.codigo == 'CERRADO'
        assert StockService.obtener_stock(bodega_a, producto) == Decimal('18')
        assert StockService.obtener_stock(bodega_b, producto) == Decimal('12')
        assert MovimientoInventario.objects.filter(
            referencia_tipo='TRASLADO',
            anulado=False,
        ).count() == 2


@pytest.mark.django_db
class TestFlujoTrasladoSerializado:
    def test_traslado_serie_en_transito_y_destino(
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
            sku='SER-01',
            nombre='Notebook',
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
            numero_serie='NB-001',
        )
        serie = Serie.objects.get(numero_serie='NB-001')

        traslado = TrasladoService.crear(empresa, bodega_a, bodega_b, usuario)
        TrasladoService.agregar_detalle(traslado, producto_ser, Decimal('1'), serie=serie)
        traslado = TrasladoService.enviar(traslado, usuario)
        traslado = TrasladoService.aprobar(traslado, usuario)
        traslado = TrasladoService.despachar(traslado, usuario)

        serie.refresh_from_db()
        assert serie.estado_serie.codigo == 'EN_TRANSITO'

        traslado = TrasladoService.recibir(traslado, usuario)
        serie.refresh_from_db()
        assert serie.estado_serie.codigo == 'DISPONIBLE'
        assert serie.bodega_actual_id == bodega_b.id


@pytest.mark.django_db
class TestFlujoCompra:
    def test_compra_aprobada_confirmada(
        self,
        empresa,
        proveedor,
        bodega_a,
        producto,
        usuario,
    ):
        compra = CompraService.crear(empresa, proveedor, bodega_a, usuario)
        CompraService.agregar_detalle(compra, producto, Decimal('20'), Decimal('25'))
        compra = CompraService.enviar(compra, usuario)
        compra = CompraService.aprobar(compra, usuario)
        compra = CompraService.confirmar(compra, usuario)

        assert compra.estado.codigo == 'CERRADO'
        assert StockService.obtener_stock(bodega_a, producto) == Decimal('20')
        producto.refresh_from_db()
        assert producto.costo_promedio_actual == Decimal('25.0000')


@pytest.mark.django_db
class TestFlujoAjuste:
    def test_ajuste_aprobado_ejecutado(
        self,
        empresa,
        bodega_a,
        producto,
        usuario,
    ):
        entrada_stock(empresa, producto, bodega_a, usuario, '10')

        ajuste = AjusteInventarioService.crear(empresa, bodega_a, usuario)
        AjusteInventarioService.agregar_detalle_desde_conteo(
            ajuste, producto, Decimal('7')
        )
        ajuste = AjusteInventarioService.enviar(ajuste, usuario)
        ajuste = AjusteInventarioService.aprobar(ajuste, usuario)
        ajuste = AjusteInventarioService.ejecutar(ajuste, usuario)

        assert ajuste.estado.codigo == 'CERRADO'
        assert StockService.obtener_stock(bodega_a, producto) == Decimal('7')
        assert MovimientoInventario.objects.filter(
            referencia_tipo='AJUSTE',
            tipo_movimiento__codigo='AJUSTE_NEGATIVO',
        ).exists()


@pytest.mark.django_db
class TestApiEntregaEjecutar:
    def test_api_ejecutar_entrega(
        self,
        empresa,
        centro_costo,
        bodega_a,
        producto,
        usuario,
    ):
        entrada_stock(empresa, producto, bodega_a, usuario, '15')

        solicitud = SolicitudService.crear(empresa, centro_costo, usuario)
        SolicitudService.agregar_detalle(solicitud, producto, Decimal('5'))
        solicitud = SolicitudService.enviar(solicitud, usuario)
        solicitud = SolicitudService.aprobar(solicitud, usuario)
        entrega = EntregaService.crear_desde_solicitud(solicitud, bodega_a, usuario)

        client = APIClient()
        client.force_authenticate(user=usuario)
        response = client.post(f'/api/v1/operations/entregas/{entrega.pk}/ejecutar/')

        assert response.status_code == 200
        assert response.data['estado_codigo'] == 'CERRADO'
        assert StockService.obtener_stock(bodega_a, producto) == Decimal('10')
