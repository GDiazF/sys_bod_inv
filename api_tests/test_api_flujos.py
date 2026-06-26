from decimal import Decimal

import pytest
from rest_framework import status

from api_tests.helpers import entrada_stock
from inventory.services.stock_service import StockService


@pytest.mark.django_db
class TestFlujoApiSolicitudEntrega:
    def test_flujo_completo_via_api(
        self,
        api_client,
        usuario_bodeguero_a,
        usuario_aprobador_a,
        empresa_a,
        centro_costo_a,
        bodega_a,
        producto_a,
    ):
        entrada_stock(empresa_a, producto_a, bodega_a, usuario_bodeguero_a, '50')

        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/operations/solicitudes/',
            {'centro_costo': centro_costo_a.pk, 'motivo': 'Consumo interno'},
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        solicitud_id = response.data['id']

        response = api_client.post(
            f'/api/v1/operations/solicitudes/{solicitud_id}/detalles/',
            {'producto': producto_a.pk, 'cantidad_solicitada': '10'},
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED

        response = api_client.post(f'/api/v1/operations/solicitudes/{solicitud_id}/enviar/')
        assert response.status_code == status.HTTP_200_OK

        api_client.force_authenticate(user=usuario_aprobador_a)
        response = api_client.post(f'/api/v1/operations/solicitudes/{solicitud_id}/aprobar/')
        assert response.status_code == status.HTTP_200_OK

        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/operations/entregas/desde-solicitud/',
            {'solicitud': solicitud_id, 'bodega': bodega_a.pk},
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        entrega_id = response.data['id']

        response = api_client.post(f'/api/v1/operations/entregas/{entrega_id}/ejecutar/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado_codigo'] == 'CERRADO'
        assert StockService.obtener_stock(bodega_a, producto_a) == Decimal('40')


@pytest.mark.django_db
class TestFlujoApiCompra:
    def test_compra_confirmada_via_api(
        self,
        api_client,
        usuario_bodeguero_a,
        usuario_aprobador_a,
        bodega_a,
        proveedor_a,
        producto_a,
    ):
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/operations/compras/',
            {
                'proveedor': proveedor_a.pk,
                'bodega_destino': bodega_a.pk,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        compra_id = response.data['id']

        response = api_client.post(
            f'/api/v1/operations/compras/{compra_id}/detalles/',
            {
                'producto': producto_a.pk,
                'cantidad': '15',
                'costo_unitario': '20',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED

        response = api_client.post(f'/api/v1/operations/compras/{compra_id}/enviar/')
        assert response.status_code == status.HTTP_200_OK

        api_client.force_authenticate(user=usuario_aprobador_a)
        response = api_client.post(f'/api/v1/operations/compras/{compra_id}/aprobar/')
        assert response.status_code == status.HTTP_200_OK

        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(f'/api/v1/operations/compras/{compra_id}/confirmar/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado_codigo'] == 'CERRADO'
        assert StockService.obtener_stock(bodega_a, producto_a) == Decimal('15')
