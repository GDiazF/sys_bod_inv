from decimal import Decimal

import pytest

from inventory.models import MovimientoInventario
from inventory.services.movimiento_inventario_service import (
    MovimientoInventarioService,
    MovimientoInput,
)
from operations.services.documento_anulacion_service import DocumentoAnulacionService
from operations.services.exceptions import (
    EmpresaInconsistenteError,
    ObjetoEmpresaInvalidoError,
)
from operations.services.tenant_validation import validar_serie_producto
from operations.tests.conftest import entrada_stock


@pytest.mark.django_db
class TestDocumentoAnulacionEmpresa:
    def test_reversar_movimientos_filtra_por_empresa(
        self, empresa, bodega_a, producto, usuario, catalogos_globales
    ):
        from core.models import Empresa

        entrada_stock(empresa, producto, bodega_a, usuario, '5')
        movimiento = MovimientoInventario.objects.filter(empresa=empresa).first()
        movimiento.referencia_tipo = 'ENTREGA'
        movimiento.referencia_id = '99'
        movimiento.save(update_fields=['referencia_tipo', 'referencia_id'])

        otra = Empresa.objects.create(codigo='OTRA', nombre='Otra')
        MovimientoInventario.objects.create(
            empresa=otra,
            producto=producto,
            tipo_movimiento=movimiento.tipo_movimiento,
            cantidad=Decimal('1'),
            costo_unitario=Decimal('10'),
            bodega_destino=bodega_a,
            referencia_tipo='ENTREGA',
            referencia_id='99',
            created_by=usuario,
        )

        DocumentoAnulacionService.reversar_movimientos(
            'ENTREGA',
            99,
            usuario,
            empresa.id,
        )

        movimiento.refresh_from_db()
        movimiento_otra = MovimientoInventario.objects.get(empresa=otra)
        assert movimiento.anulado is True
        assert movimiento_otra.anulado is False

    def test_reversar_rechaza_usuario_de_otra_empresa(
        self, empresa, bodega_a, producto, usuario, catalogos_globales
    ):
        from core.models import Empresa
        from security.models import Usuario

        empresa_b = Empresa.objects.create(codigo='EMP-B-VAL', nombre='Empresa B Val')
        otro = Usuario.objects.create_user(
            email='otro@example.com',
            password='pass12345',
            nombre_completo='Otro',
            empresa=empresa_b,
        )
        with pytest.raises(EmpresaInconsistenteError):
            DocumentoAnulacionService.reversar_movimientos(
                'ENTREGA',
                1,
                otro,
                empresa.id,
            )


@pytest.mark.django_db
class TestTenantValidation:
    def test_validar_serie_producto_rechaza_serie_incorrecta(
        self, empresa, unidad, bodega_a, usuario, catalogos_globales
    ):
        from catalogs.models import TipoControlInventario
        from inventory.models import Producto, Serie

        tipo_ser = TipoControlInventario.objects.get(codigo='SERIALIZADO')
        tipo_no = TipoControlInventario.objects.get(codigo='NO_SERIALIZADO')
        producto_a = Producto.objects.create(
            empresa=empresa,
            sku='PA',
            nombre='A',
            unidad_medida=unidad,
            tipo_control_inventario=tipo_ser,
        )
        producto_b = Producto.objects.create(
            empresa=empresa,
            sku='PB',
            nombre='B',
            unidad_medida=unidad,
            tipo_control_inventario=tipo_no,
        )
        MovimientoInventarioService.registrar_entrada_serializada(
            MovimientoInput(
                empresa=empresa,
                producto=producto_a,
                tipo_movimiento_codigo='ENTRADA_COMPRA',
                cantidad=Decimal('1'),
                costo_unitario=Decimal('100'),
                created_by=usuario,
                bodega_destino=bodega_a,
            ),
            numero_serie='SER-VAL-001',
        )
        serie = Serie.objects.get(numero_serie='SER-VAL-001')

        with pytest.raises(ObjetoEmpresaInvalidoError):
            validar_serie_producto(producto_b, serie)

    def test_solicitud_crear_rechaza_centro_costo_de_otra_empresa(
        self, empresa, usuario, catalogos_globales
    ):
        from core.models import CentroCosto, Empresa

        otra = Empresa.objects.create(codigo='OTRA-CC', nombre='Otra CC')
        centro_otra = CentroCosto.objects.create(
            empresa=otra,
            codigo='CC-OTRA',
            nombre='Centro otra',
        )
        from operations.services.solicitud_service import SolicitudService

        with pytest.raises(ObjetoEmpresaInvalidoError):
            SolicitudService.crear(empresa, centro_otra, usuario)

    def test_compra_detalle_serializado_requiere_numero_serie(
        self, empresa, bodega_a, proveedor, usuario, unidad, catalogos_globales
    ):
        from catalogs.models import TipoControlInventario
        from inventory.models import Producto
        from operations.services.compra_service import CompraService

        tipo_ser = TipoControlInventario.objects.get(codigo='SERIALIZADO')
        producto_ser = Producto.objects.create(
            empresa=empresa,
            sku='COM-SER-EARLY',
            nombre='Compra serial early',
            unidad_medida=unidad,
            tipo_control_inventario=tipo_ser,
        )
        compra = CompraService.crear(empresa, proveedor, bodega_a, usuario)
        with pytest.raises(ObjetoEmpresaInvalidoError):
            CompraService.agregar_detalle(
                compra,
                producto_ser,
                Decimal('1'),
                Decimal('100'),
            )
