import pytest
from rest_framework import status

from inventory.models import Producto


@pytest.mark.django_db
class TestAislamientoEmpresa:
    def test_no_ve_producto_de_otra_empresa(
        self,
        api_client,
        usuario_bodeguero_a,
        producto_a,
        producto_b,
    ):
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.get(f'/api/v1/inventory/productos/{producto_b.pk}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_lista_solo_productos_propios(
        self,
        api_client,
        usuario_bodeguero_a,
        producto_a,
        producto_b,
    ):
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.get('/api/v1/inventory/productos/')
        assert response.status_code == status.HTTP_200_OK
        ids = {item['id'] for item in response.data['results']}
        assert producto_a.pk in ids
        assert producto_b.pk not in ids


@pytest.mark.django_db
class TestPermisosRBAC:
    def test_consulta_no_puede_crear_producto(
        self,
        api_client,
        usuario_consulta_a,
        unidad_a,
        catalogos_globales,
    ):
        from catalogs.models import TipoControlInventario

        api_client.force_authenticate(user=usuario_consulta_a)
        response = api_client.post(
            '/api/v1/inventory/productos/',
            {
                'sku': 'NEW-001',
                'nombre': 'Nuevo',
                'unidad_medida': unidad_a.pk,
                'tipo_control_inventario': TipoControlInventario.objects.get(
                    codigo='NO_SERIALIZADO'
                ).pk,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_bodeguero_puede_crear_producto(
        self,
        api_client,
        usuario_bodeguero_a,
        unidad_a,
        catalogos_globales,
    ):
        from catalogs.models import TipoControlInventario

        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/inventory/productos/',
            {
                'sku': 'NEW-002',
                'nombre': 'Nuevo Bodeguero',
                'unidad_medida': unidad_a.pk,
                'tipo_control_inventario': TipoControlInventario.objects.get(
                    codigo='NO_SERIALIZADO'
                ).pk,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert Producto.objects.filter(sku='NEW-002', empresa=usuario_bodeguero_a.empresa).exists()

    def test_consulta_no_puede_crear_solicitud(
        self,
        api_client,
        usuario_consulta_a,
        centro_costo_a,
    ):
        api_client.force_authenticate(user=usuario_consulta_a)
        response = api_client.post(
            '/api/v1/operations/solicitudes/',
            {'centro_costo': centro_costo_a.pk},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_me_expone_permisos(
        self,
        api_client,
        usuario_bodeguero_a,
    ):
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.get('/api/v1/security/me/')
        assert response.status_code == status.HTTP_200_OK
        assert 'operations.solicitud.crear' in response.data['permisos']
        assert 'operations.solicitud.aprobar' not in response.data['permisos']


@pytest.mark.django_db
class TestSchema:
    def test_openapi_schema_disponible(self, api_client, usuario_bodeguero_a):
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.get('/api/schema/')
        assert response.status_code == status.HTTP_200_OK
        assert b'openapi' in response.content.lower()
