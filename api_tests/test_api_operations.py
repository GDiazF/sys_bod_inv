from decimal import Decimal

import pytest
from rest_framework import status

from api_tests.helpers import entrada_stock
from inventory.services.stock_service import StockService


def _crear_entrega_cerrada(
    api_client,
    usuario_bodeguero,
    usuario_aprobador,
    centro_costo,
    bodega,
    producto,
):
    api_client.force_authenticate(user=usuario_bodeguero)
    response = api_client.post(
        '/api/v1/operations/solicitudes/',
        {'centro_costo': centro_costo.pk, 'motivo': 'Anulacion API'},
        format='json',
    )
    solicitud_id = response.data['id']
    api_client.post(
        f'/api/v1/operations/solicitudes/{solicitud_id}/detalles/',
        {'producto': producto.pk, 'cantidad_solicitada': '4'},
        format='json',
    )
    api_client.post(f'/api/v1/operations/solicitudes/{solicitud_id}/enviar/')
    api_client.force_authenticate(user=usuario_aprobador)
    api_client.post(f'/api/v1/operations/solicitudes/{solicitud_id}/aprobar/')
    api_client.force_authenticate(user=usuario_bodeguero)
    response = api_client.post(
        '/api/v1/operations/entregas/desde-solicitud/',
        {'solicitud': solicitud_id, 'bodega': bodega.pk},
        format='json',
    )
    entrega_id = response.data['id']
    api_client.post(f'/api/v1/operations/entregas/{entrega_id}/ejecutar/')
    return entrega_id


@pytest.mark.django_db
class TestAnulacionApiOperations:
    def test_bodeguero_no_puede_anular_entrega(
        self,
        api_client,
        usuario_bodeguero_a,
        usuario_aprobador_a,
        centro_costo_a,
        bodega_a,
        producto_a,
    ):
        entrada_stock(producto_a.empresa, producto_a, bodega_a, usuario_bodeguero_a, '20')
        entrega_id = _crear_entrega_cerrada(
            api_client,
            usuario_bodeguero_a,
            usuario_aprobador_a,
            centro_costo_a,
            bodega_a,
            producto_a,
        )

        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(f'/api/v1/operations/entregas/{entrega_id}/anular/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_supervisor_puede_anular_entrega_y_revierte_stock(
        self,
        api_client,
        usuario_bodeguero_a,
        usuario_aprobador_a,
        usuario_supervisor_a,
        centro_costo_a,
        bodega_a,
        producto_a,
    ):
        entrada_stock(producto_a.empresa, producto_a, bodega_a, usuario_bodeguero_a, '20')
        entrega_id = _crear_entrega_cerrada(
            api_client,
            usuario_bodeguero_a,
            usuario_aprobador_a,
            centro_costo_a,
            bodega_a,
            producto_a,
        )
        assert StockService.obtener_stock(bodega_a, producto_a) == Decimal('16')

        api_client.force_authenticate(user=usuario_supervisor_a)
        response = api_client.post(f'/api/v1/operations/entregas/{entrega_id}/anular/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado_codigo'] == 'ANULADO'
        assert StockService.obtener_stock(bodega_a, producto_a) == Decimal('20')


@pytest.mark.django_db
class TestAislamientoOperationsApi:
    def test_no_ve_entrega_de_otra_empresa(
        self,
        api_client,
        usuario_bodeguero_a,
        usuario_aprobador_a,
        centro_costo_a,
        bodega_a,
        producto_a,
        empresa_b,
    ):
        from api_tests.conftest import _crear_usuario_con_rol

        entrada_stock(producto_a.empresa, producto_a, bodega_a, usuario_bodeguero_a, '10')
        entrega_id = _crear_entrega_cerrada(
            api_client,
            usuario_bodeguero_a,
            usuario_aprobador_a,
            centro_costo_a,
            bodega_a,
            producto_a,
        )

        usuario_b = _crear_usuario_con_rol(empresa_b, 'BODEGUERO', 'bodeguero-b2@example.com')
        api_client.force_authenticate(user=usuario_b)
        response = api_client.get(f'/api/v1/operations/entregas/{entrega_id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

        response = api_client.post(f'/api/v1/operations/entregas/{entrega_id}/anular/')
        assert response.status_code in (
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN,
        )


@pytest.mark.django_db
class TestFlujosCriticosApiOperations:
    def test_traslado_despachar_y_recibir_via_api(
        self,
        api_client,
        usuario_bodeguero_a,
        usuario_aprobador_a,
        bodega_a,
        producto_a,
        empresa_a,
    ):
        from core.models import Bodega

        entrada_stock(empresa_a, producto_a, bodega_a, usuario_bodeguero_a, '30')
        bodega_b = Bodega.objects.create(empresa=empresa_a, codigo='BB-API', nombre='Bodega B API')

        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/operations/traslados/',
            {'bodega_origen': bodega_a.pk, 'bodega_destino': bodega_b.pk, 'motivo': 'Traslado API'},
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        traslado_id = response.data['id']

        api_client.post(
            f'/api/v1/operations/traslados/{traslado_id}/detalles/',
            {'producto': producto_a.pk, 'cantidad_trasladada': '5'},
            format='json',
        )
        api_client.post(f'/api/v1/operations/traslados/{traslado_id}/enviar/')

        api_client.force_authenticate(user=usuario_aprobador_a)
        api_client.post(f'/api/v1/operations/traslados/{traslado_id}/aprobar/')

        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(f'/api/v1/operations/traslados/{traslado_id}/despachar/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado_codigo'] == 'EN_TRANSITO'

        response = api_client.post(f'/api/v1/operations/traslados/{traslado_id}/recibir/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado_codigo'] == 'CERRADO'
        assert StockService.obtener_stock(bodega_a, producto_a) == Decimal('25')
        assert StockService.obtener_stock(bodega_b, producto_a) == Decimal('5')

    def test_supervisor_anula_compra_cerrada_via_api(
        self,
        api_client,
        usuario_bodeguero_a,
        usuario_aprobador_a,
        usuario_supervisor_a,
        bodega_a,
        proveedor_a,
        producto_a,
    ):
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/operations/compras/',
            {'proveedor': proveedor_a.pk, 'bodega_destino': bodega_a.pk},
            format='json',
        )
        compra_id = response.data['id']
        api_client.post(
            f'/api/v1/operations/compras/{compra_id}/detalles/',
            {'producto': producto_a.pk, 'cantidad': '8', 'costo_unitario': '12'},
            format='json',
        )
        api_client.post(f'/api/v1/operations/compras/{compra_id}/enviar/')

        api_client.force_authenticate(user=usuario_aprobador_a)
        api_client.post(f'/api/v1/operations/compras/{compra_id}/aprobar/')

        api_client.force_authenticate(user=usuario_bodeguero_a)
        api_client.post(f'/api/v1/operations/compras/{compra_id}/confirmar/')
        assert StockService.obtener_stock(bodega_a, producto_a) == Decimal('8')

        api_client.force_authenticate(user=usuario_supervisor_a)
        response = api_client.post(f'/api/v1/operations/compras/{compra_id}/anular/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado_codigo'] == 'ANULADO'
        assert StockService.obtener_stock(bodega_a, producto_a) == Decimal('0')

    def test_aprobador_no_puede_despachar_traslado(
        self,
        api_client,
        usuario_bodeguero_a,
        usuario_aprobador_a,
        bodega_a,
        producto_a,
        empresa_a,
    ):
        from core.models import Bodega

        entrada_stock(empresa_a, producto_a, bodega_a, usuario_bodeguero_a, '10')
        bodega_b = Bodega.objects.create(empresa=empresa_a, codigo='BB-RBAC', nombre='Bodega B RBAC')

        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/operations/traslados/',
            {'bodega_origen': bodega_a.pk, 'bodega_destino': bodega_b.pk},
            format='json',
        )
        traslado_id = response.data['id']
        api_client.post(
            f'/api/v1/operations/traslados/{traslado_id}/detalles/',
            {'producto': producto_a.pk, 'cantidad_trasladada': '2'},
            format='json',
        )
        api_client.post(f'/api/v1/operations/traslados/{traslado_id}/enviar/')

        api_client.force_authenticate(user=usuario_aprobador_a)
        api_client.post(f'/api/v1/operations/traslados/{traslado_id}/aprobar/')
        response = api_client.post(f'/api/v1/operations/traslados/{traslado_id}/despachar/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_supervisor_anula_solicitud_via_api(
        self,
        api_client,
        usuario_bodeguero_a,
        usuario_supervisor_a,
        centro_costo_a,
        producto_a,
    ):
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/operations/solicitudes/',
            {'centro_costo': centro_costo_a.pk, 'motivo': 'Anular solicitud API'},
            format='json',
        )
        solicitud_id = response.data['id']
        api_client.post(
            f'/api/v1/operations/solicitudes/{solicitud_id}/detalles/',
            {'producto': producto_a.pk, 'cantidad_solicitada': '2'},
            format='json',
        )

        api_client.force_authenticate(user=usuario_supervisor_a)
        response = api_client.post(f'/api/v1/operations/solicitudes/{solicitud_id}/anular/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado_codigo'] == 'ANULADO'

    def test_ajuste_ejecutar_via_api(
        self,
        api_client,
        usuario_supervisor_a,
        bodega_a,
        producto_a,
    ):
        entrada_stock(producto_a.empresa, producto_a, bodega_a, usuario_supervisor_a, '10')

        api_client.force_authenticate(user=usuario_supervisor_a)
        response = api_client.post(
            '/api/v1/operations/ajustes/',
            {'bodega': bodega_a.pk, 'motivo': 'Conteo API'},
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        ajuste_id = response.data['id']

        api_client.post(
            f'/api/v1/operations/ajustes/{ajuste_id}/detalles/',
            {'producto': producto_a.pk, 'cantidad_contada': '7'},
            format='json',
        )
        api_client.post(f'/api/v1/operations/ajustes/{ajuste_id}/enviar/')
        api_client.post(f'/api/v1/operations/ajustes/{ajuste_id}/aprobar/')
        response = api_client.post(f'/api/v1/operations/ajustes/{ajuste_id}/ejecutar/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado_codigo'] == 'CERRADO'
        assert StockService.obtener_stock(bodega_a, producto_a) == Decimal('7')

    def test_aprobador_rechaza_solicitud_via_api(
        self,
        api_client,
        usuario_bodeguero_a,
        usuario_aprobador_a,
        centro_costo_a,
        producto_a,
    ):
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/operations/solicitudes/',
            {'centro_costo': centro_costo_a.pk, 'motivo': 'Rechazo API'},
            format='json',
        )
        solicitud_id = response.data['id']
        api_client.post(
            f'/api/v1/operations/solicitudes/{solicitud_id}/detalles/',
            {'producto': producto_a.pk, 'cantidad_solicitada': '1'},
            format='json',
        )
        api_client.post(f'/api/v1/operations/solicitudes/{solicitud_id}/enviar/')

        api_client.force_authenticate(user=usuario_aprobador_a)
        response = api_client.post(f'/api/v1/operations/solicitudes/{solicitud_id}/rechazar/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado_codigo'] == 'RECHAZADO'

