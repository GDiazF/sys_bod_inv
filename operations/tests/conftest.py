from decimal import Decimal

import pytest

from catalogs.models import MetodoCosteo, TipoControlInventario, UnidadMedida
from catalogs.sync import sync_catalogos_globales
from core.models import Bodega, CentroCosto, Empresa, ParametroEmpresa
from inventory.models import Proveedor, Serie
from inventory.services.movimiento_inventario_service import (
    MovimientoInventarioService,
    MovimientoInput,
)
from core.management.commands.load_initial_data import ROLE_PERMISSIONS
from security.models import Permiso, Rol, RolPermiso, Usuario, UsuarioRol
from security.sync import sync_permisos_v1
from support.services.numerador_service import NumeradorService


@pytest.fixture
def catalogos_globales(db):
    sync_catalogos_globales()


@pytest.fixture
def empresa(db, catalogos_globales):
    emp = Empresa.objects.create(codigo='OPS', nombre='Empresa Operations')
    metodo = MetodoCosteo.objects.get(codigo='PROMEDIO_PONDERADO')
    ParametroEmpresa.objects.create(
        empresa=emp,
        metodo_costeo=metodo,
        stock_negativo_permitido=False,
        aprobacion_salida_requerida=True,
    )
    for tipo, prefijo in [
        ('SOLICITUD', 'SOL-'),
        ('ENTREGA', 'ENT-'),
        ('TRASLADO', 'TRA-'),
        ('COMPRA', 'COM-'),
        ('AJUSTE', 'AJU-'),
    ]:
        NumeradorService.obtener_o_crear(emp, tipo, prefijo=prefijo, longitud=6)
    sync_permisos_v1()
    rol, _ = Rol.objects.get_or_create(
        empresa=emp,
        codigo='BODEGUERO',
        defaults={'nombre': 'Bodeguero', 'activo': True},
    )
    RolPermiso.objects.filter(rol=rol).delete()
    all_permisos = {p.codigo: p for p in Permiso.objects.filter(activo=True)}
    for permiso_codigo in ROLE_PERMISSIONS['BODEGUERO']:
        permiso = all_permisos.get(permiso_codigo)
        if permiso:
            RolPermiso.objects.get_or_create(rol=rol, permiso=permiso)
    emp._rol_bodeguero = rol
    return emp


@pytest.fixture
def centro_costo(empresa):
    return CentroCosto.objects.create(
        empresa=empresa,
        codigo='CC01',
        nombre='Centro Operaciones',
    )


@pytest.fixture
def bodega_a(empresa):
    return Bodega.objects.create(empresa=empresa, codigo='BA', nombre='Bodega A')


@pytest.fixture
def bodega_b(empresa):
    return Bodega.objects.create(empresa=empresa, codigo='BB', nombre='Bodega B')


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
    user = Usuario.objects.create_user(
        email='ops@example.com',
        password='pass12345',
        nombre_completo='Operador',
        empresa=empresa,
    )
    UsuarioRol.objects.create(usuario=user, rol=empresa._rol_bodeguero)
    return user


@pytest.fixture
def producto(empresa, unidad):
    from inventory.models import Producto

    tipo = TipoControlInventario.objects.get(codigo='NO_SERIALIZADO')
    return Producto.objects.create(
        empresa=empresa,
        sku='P-001',
        nombre='Insumo Test',
        unidad_medida=unidad,
        tipo_control_inventario=tipo,
    )


@pytest.fixture
def proveedor(empresa):
    return Proveedor.objects.create(
        empresa=empresa,
        razon_social='Proveedor Test',
    )


def entrada_stock(empresa, producto, bodega, usuario, cantidad='100', costo='10'):
    MovimientoInventarioService.registrar_movimiento(
        MovimientoInput(
            empresa=empresa,
            producto=producto,
            tipo_movimiento_codigo='ENTRADA_COMPRA',
            cantidad=Decimal(cantidad),
            costo_unitario=Decimal(costo),
            created_by=usuario,
            bodega_destino=bodega,
        )
    )
