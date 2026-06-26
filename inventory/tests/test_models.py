import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from catalogs.models import EstadoSerie, TipoControlInventario, TipoMovimientoInventario, UnidadMedida
from core.models import Bodega, Empresa
from inventory.models import Lote, Producto, Serie, StockActual
from security.models import Usuario


@pytest.fixture
def catalogos(catalogos_globales):
    return catalogos_globales


@pytest.fixture
def empresa(db):
    return Empresa.objects.create(codigo='INV', nombre='Empresa Inventario')


@pytest.fixture
def bodega(empresa):
    return Bodega.objects.create(empresa=empresa, codigo='B01', nombre='Bodega 1')


@pytest.fixture
def unidad(empresa):
    return UnidadMedida.objects.create(
        empresa=empresa,
        codigo='UND',
        nombre='Unidad',
        abreviacion='und',
    )


@pytest.fixture
def tipo_no_serializado(catalogos):
    return TipoControlInventario.objects.get(codigo='NO_SERIALIZADO')


@pytest.fixture
def producto(empresa, unidad, tipo_no_serializado):
    return Producto.objects.create(
        empresa=empresa,
        sku='SKU-001',
        nombre='Producto Test',
        unidad_medida=unidad,
        tipo_control_inventario=tipo_no_serializado,
    )


@pytest.fixture
def usuario(empresa):
    return Usuario.objects.create_user(
        email='test@example.com',
        password='testpass123',
        nombre_completo='Usuario Test',
        empresa=empresa,
    )


@pytest.mark.django_db
class TestProductoConstraints:
    def test_sku_unico_por_empresa(self, producto, empresa, unidad, tipo_no_serializado):
        dup = Producto(
            empresa=empresa,
            sku='SKU-001',
            nombre='Duplicado',
            unidad_medida=unidad,
            tipo_control_inventario=tipo_no_serializado,
        )
        with pytest.raises(IntegrityError):
            dup.save()

    def test_factor_conversion_debe_ser_positivo(self, producto):
        producto.factor_conversion = 0
        with pytest.raises(ValidationError):
            producto.full_clean()


@pytest.mark.django_db
class TestSerieConstraints:
    def test_numero_serie_unico_por_empresa(self, producto, empresa, bodega):
        estado = EstadoSerie.objects.get(codigo='DISPONIBLE')
        Serie.objects.create(
            empresa=empresa,
            producto=producto,
            numero_serie='SN-001',
            estado_serie=estado,
            bodega_actual=bodega,
        )
        dup = Serie(
            empresa=empresa,
            producto=producto,
            numero_serie='SN-001',
            estado_serie=estado,
        )
        with pytest.raises(IntegrityError):
            dup.save()


@pytest.mark.django_db
class TestLoteConstraints:
    def test_codigo_lote_unico_por_producto(self, producto, empresa):
        Lote.objects.create(
            empresa=empresa,
            producto=producto,
            codigo_lote='LOTE-A',
        )
        dup = Lote(
            empresa=empresa,
            producto=producto,
            codigo_lote='LOTE-A',
        )
        with pytest.raises(IntegrityError):
            dup.save()


@pytest.mark.django_db
class TestStockActualConstraints:
    def test_stock_unico_por_bodega_producto_lote(self, producto, empresa, bodega):
        StockActual.objects.create(
            empresa=empresa,
            bodega=bodega,
            producto=producto,
            lote=None,
            cantidad=10,
        )
        dup = StockActual(
            empresa=empresa,
            bodega=bodega,
            producto=producto,
            lote=None,
            cantidad=5,
        )
        with pytest.raises(IntegrityError):
            dup.save()


@pytest.mark.django_db
class TestMovimientoInventarioModel:
    def test_crear_movimiento_basico(self, producto, empresa, bodega, usuario, catalogos):
        tipo = TipoMovimientoInventario.objects.get(codigo='ENTRADA_COMPRA')
        from inventory.models import MovimientoInventario

        movimiento = MovimientoInventario.objects.create(
            empresa=empresa,
            tipo_movimiento=tipo,
            producto=producto,
            bodega_destino=bodega,
            cantidad=10,
            costo_unitario=100,
            costo_total=1000,
            referencia_tipo='COMPRA',
            referencia_id='1',
            created_by=usuario,
        )
        assert movimiento.pk is not None
        assert movimiento.anulado is False
