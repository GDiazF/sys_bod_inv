import pytest
import yaml
from django.core.management import call_command
from rest_framework import status


@pytest.mark.django_db
class TestValidacionCruzadaEmpresa:
    def test_producto_rechaza_categoria_de_otra_empresa(
        self,
        api_client,
        usuario_bodeguero_a,
        unidad_a,
        producto_a,
        empresa_b,
        catalogos_globales,
    ):
        from catalogs.models import Categoria, TipoControlInventario

        categoria_b = Categoria.objects.create(
            empresa=empresa_b,
            codigo='CAT-B',
            nombre='Categoria B',
        )
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/inventory/productos/',
            {
                'sku': 'X-001',
                'nombre': 'Producto cruzado',
                'unidad_medida': unidad_a.pk,
                'tipo_control_inventario': TipoControlInventario.objects.get(
                    codigo='NO_SERIALIZADO'
                ).pk,
                'categoria': categoria_b.pk,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'categoria' in response.data

    def test_bodega_rechaza_sucursal_de_otra_empresa(
        self,
        api_client,
        usuario_supervisor_a,
        empresa_b,
    ):
        from core.models import Sucursal

        sucursal_b = Sucursal.objects.create(
            empresa=empresa_b,
            codigo='SUC-B',
            nombre='Sucursal B',
        )
        api_client.force_authenticate(user=usuario_supervisor_a)
        response = api_client.post(
            '/api/v1/core/bodegas/',
            {
                'codigo': 'B-X',
                'nombre': 'Bodega cruzada',
                'sucursal': sucursal_b.pk,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'sucursal' in response.data

    def test_solicitud_rechaza_centro_costo_de_otra_empresa(
        self,
        api_client,
        usuario_bodeguero_a,
        empresa_b,
    ):
        from core.models import CentroCosto

        cc_b = CentroCosto.objects.create(
            empresa=empresa_b,
            codigo='CC-B',
            nombre='CC Empresa B',
        )
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/operations/solicitudes/',
            {'centro_costo': cc_b.pk},
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'centro_costo' in response.data

    def test_compra_rechaza_proveedor_de_otra_empresa(
        self,
        api_client,
        usuario_bodeguero_a,
        bodega_a,
        empresa_b,
    ):
        from inventory.models import Proveedor

        proveedor_b = Proveedor.objects.create(
            empresa=empresa_b,
            rut='76.999.999-9',
            razon_social='Proveedor B',
        )
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/operations/compras/',
            {'proveedor': proveedor_b.pk, 'bodega_destino': bodega_a.pk},
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'proveedor' in response.data


@pytest.mark.django_db
class TestPaginacionYFiltros:
    def test_paginacion_estandar(
        self,
        api_client,
        usuario_bodeguero_a,
        unidad_a,
        catalogos_globales,
    ):
        from catalogs.models import TipoControlInventario
        from inventory.models import Producto

        tipo = TipoControlInventario.objects.get(codigo='NO_SERIALIZADO')
        for i in range(3):
            Producto.objects.create(
                empresa=usuario_bodeguero_a.empresa,
                sku=f'PAG-{i}',
                nombre=f'Producto {i}',
                unidad_medida=unidad_a,
                tipo_control_inventario=tipo,
            )

        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.get('/api/v1/inventory/productos/?page_size=2')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 3
        assert len(response.data['results']) == 2
        assert 'next' in response.data

    def test_filtro_activo_en_productos(
        self,
        api_client,
        usuario_bodeguero_a,
        producto_a,
        unidad_a,
        catalogos_globales,
    ):
        from catalogs.models import TipoControlInventario
        from inventory.models import Producto

        tipo = TipoControlInventario.objects.get(codigo='NO_SERIALIZADO')
        Producto.objects.create(
            empresa=usuario_bodeguero_a.empresa,
            sku='INACT',
            nombre='Inactivo',
            unidad_medida=unidad_a,
            tipo_control_inventario=tipo,
            activo=False,
        )
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.get('/api/v1/inventory/productos/?activo=true')
        assert response.status_code == status.HTTP_200_OK
        skus = {item['sku'] for item in response.data['results']}
        assert 'INACT' not in skus
        assert producto_a.sku in skus

    def test_busqueda_por_sku(
        self,
        api_client,
        usuario_bodeguero_a,
        producto_a,
    ):
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.get('/api/v1/inventory/productos/?search=P-A-001')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['sku'] == 'P-A-001'

    def test_ordenamiento_productos(
        self,
        api_client,
        usuario_bodeguero_a,
        unidad_a,
        catalogos_globales,
    ):
        from catalogs.models import TipoControlInventario
        from inventory.models import Producto

        tipo = TipoControlInventario.objects.get(codigo='NO_SERIALIZADO')
        Producto.objects.create(
            empresa=usuario_bodeguero_a.empresa,
            sku='ZZZ-999',
            nombre='Ultimo',
            unidad_medida=unidad_a,
            tipo_control_inventario=tipo,
        )
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.get('/api/v1/inventory/productos/?ordering=-sku')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['sku'] == 'ZZZ-999'


@pytest.mark.django_db
class TestSchemaSpectacular:
    def test_schema_openapi_valido(self, api_client, usuario_bodeguero_a):
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.get('/api/schema/')
        assert response.status_code == status.HTTP_200_OK
        schema = yaml.safe_load(response.content)
        assert schema['openapi'].startswith('3.')
        assert schema['info']['title'] == 'Sistema de Bodega e Inventario API'
        paths = schema.get('paths', {})
        assert '/api/v1/inventory/productos/' in paths
        assert '/api/v1/operations/solicitudes/' in paths
        for suffix in ('solicitudes', 'entregas', 'traslados', 'compras', 'ajustes'):
            matching = [
                path for path in paths
                if f'/api/v1/operations/{suffix}/' in path and 'anular' in path
            ]
            assert matching, f'Falta ruta anular para {suffix}'

    def test_comando_spectacular_valida(self):
        call_command('spectacular', '--validate', verbosity=0)
