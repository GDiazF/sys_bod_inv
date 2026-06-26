from decimal import Decimal

import pytest

from catalogs.models import MetodoCosteo, TipoControlInventario, UnidadMedida
from catalogs.sync import sync_catalogos_globales
from core.models import Bodega, Empresa, ParametroEmpresa
from inventory.models import Lote, Producto, Serie
from security.models import Usuario


@pytest.fixture
def catalogos_globales(db):
    sync_catalogos_globales()


@pytest.fixture
def empresa(db, catalogos_globales):
    emp = Empresa.objects.create(codigo='SRV', nombre='Empresa Services')
    metodo = MetodoCosteo.objects.get(codigo='PROMEDIO_PONDERADO')
    ParametroEmpresa.objects.create(
        empresa=emp,
        metodo_costeo=metodo,
        stock_negativo_permitido=False,
        aprobacion_salida_requerida=True,
    )
    return emp


@pytest.fixture
def bodega(empresa):
    return Bodega.objects.create(empresa=empresa, codigo='B01', nombre='Bodega Central')


@pytest.fixture
def unidad(empresa):
    return UnidadMedida.objects.create(
        empresa=empresa,
        codigo='UND',
        nombre='Unidad',
        abreviacion='und',
    )


@pytest.fixture
def usuario(empresa):
    return Usuario.objects.create_user(
        email='bodega@example.com',
        password='pass12345',
        nombre_completo='Bodeguero Test',
        empresa=empresa,
    )


def _producto(empresa, unidad, tipo_codigo, sku, **extra):
    tipo = TipoControlInventario.objects.get(codigo=tipo_codigo)
    defaults = {
        'nombre': f'Producto {sku}',
        'unidad_medida': unidad,
        'tipo_control_inventario': tipo,
    }
    defaults.update(extra)
    return Producto.objects.create(empresa=empresa, sku=sku, **defaults)


@pytest.fixture
def producto_no_serializado(empresa, unidad):
    return _producto(empresa, unidad, 'NO_SERIALIZADO', 'NS-001')


@pytest.fixture
def producto_serializado(empresa, unidad):
    return _producto(empresa, unidad, 'SERIALIZADO', 'SER-001')


@pytest.fixture
def producto_por_lote(empresa, unidad):
    return _producto(empresa, unidad, 'POR_LOTE', 'LOT-001')


@pytest.fixture
def lote(producto_por_lote, empresa):
    return Lote.objects.create(
        empresa=empresa,
        producto=producto_por_lote,
        codigo_lote='L-001',
    )


@pytest.fixture
def serie_disponible(producto_serializado, empresa, bodega, catalogos_globales):
    from catalogs.models import EstadoSerie

    return Serie.objects.create(
        empresa=empresa,
        producto=producto_serializado,
        numero_serie='SN-100',
        estado_serie=EstadoSerie.objects.get(codigo='DISPONIBLE'),
        bodega_actual=bodega,
    )


@pytest.fixture
def movimiento_input_base(empresa, usuario):
    from inventory.services.movimiento_inventario_service import MovimientoInput

    def factory(**kwargs):
        base = {
            'empresa': empresa,
            'created_by': usuario,
            'cantidad': Decimal('10'),
            'costo_unitario': Decimal('100'),
        }
        base.update(kwargs)
        return MovimientoInput(**base)

    return factory
