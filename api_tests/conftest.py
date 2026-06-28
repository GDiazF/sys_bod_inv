from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from catalogs.models import MetodoCosteo, TipoControlInventario
from catalogs.sync import sync_catalogos_globales
from core.management.commands.load_initial_data import ROLE_PERMISSIONS
from core.models import Bodega, CentroCosto, Empresa, ParametroEmpresa
from inventory.models import Producto, Proveedor
from inventory.services.movimiento_inventario_service import (
    MovimientoInventarioService,
    MovimientoInput,
)
from security.models import Permiso, Rol, RolPermiso, Usuario, UsuarioRol
from security.sync import sync_permisos_v1
from support.services.numerador_service import NumeradorService


def _sync_roles(empresa):
    sync_permisos_v1()
    all_permisos = {p.codigo: p for p in Permiso.objects.filter(activo=True)}
    roles = {}
    for codigo_rol in ROLE_PERMISSIONS:
        rol, _ = Rol.objects.get_or_create(
            empresa=empresa,
            codigo=codigo_rol,
            defaults={'nombre': codigo_rol, 'activo': True},
        )
        permisos_codigos = ROLE_PERMISSIONS[codigo_rol]
        if permisos_codigos == '__all__':
            permisos_codigos = list(all_permisos.keys())
        for permiso_codigo in permisos_codigos:
            permiso = all_permisos.get(permiso_codigo)
            if permiso:
                RolPermiso.objects.get_or_create(rol=rol, permiso=permiso)
        roles[codigo_rol] = rol
    return roles


def _setup_numeradores(empresa):
    for tipo, prefijo in [
        ('SOLICITUD', 'SOL-'),
        ('ENTREGA', 'ENT-'),
        ('TRASLADO', 'TRA-'),
        ('COMPRA', 'COM-'),
        ('AJUSTE', 'AJU-'),
    ]:
        NumeradorService.obtener_o_crear(empresa, tipo, prefijo=prefijo, longitud=6)


@pytest.fixture
def catalogos_globales(db):
    sync_catalogos_globales()


@pytest.fixture
def empresa_a(db, catalogos_globales):
    emp = Empresa.objects.create(codigo='EMP-A', nombre='Empresa A')
    metodo = MetodoCosteo.objects.get(codigo='PROMEDIO_PONDERADO')
    ParametroEmpresa.objects.create(
        empresa=emp,
        metodo_costeo=metodo,
        stock_negativo_permitido=False,
        aprobacion_salida_requerida=True,
    )
    _setup_numeradores(emp)
    _sync_roles(emp)
    return emp


@pytest.fixture
def empresa_b(db, catalogos_globales):
    emp = Empresa.objects.create(codigo='EMP-B', nombre='Empresa B')
    metodo = MetodoCosteo.objects.get(codigo='PROMEDIO_PONDERADO')
    ParametroEmpresa.objects.create(
        empresa=emp,
        metodo_costeo=metodo,
        stock_negativo_permitido=False,
        aprobacion_salida_requerida=True,
    )
    _setup_numeradores(emp)
    _sync_roles(emp)
    return emp


def _crear_usuario_con_rol(empresa, rol_codigo, email):
    usuario = Usuario.objects.create_user(
        email=email,
        password='pass12345',
        nombre_completo=f'Usuario {rol_codigo}',
        empresa=empresa,
    )
    rol = Rol.objects.get(empresa=empresa, codigo=rol_codigo)
    UsuarioRol.objects.create(usuario=usuario, rol=rol)
    return usuario


@pytest.fixture
def usuario_bodeguero_a(empresa_a):
    return _crear_usuario_con_rol(empresa_a, 'BODEGUERO', 'bodeguero-a@example.com')


@pytest.fixture
def usuario_consulta_a(empresa_a):
    return _crear_usuario_con_rol(empresa_a, 'CONSULTA', 'consulta-a@example.com')


@pytest.fixture
def usuario_supervisor_a(empresa_a):
    return _crear_usuario_con_rol(empresa_a, 'SUPERVISOR', 'supervisor-a@example.com')


@pytest.fixture
def usuario_aprobador_a(empresa_a):
    return _crear_usuario_con_rol(empresa_a, 'APROBADOR', 'aprobador-a@example.com')


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def bodega_a(empresa_a):
    return Bodega.objects.create(empresa=empresa_a, codigo='BA', nombre='Bodega A')


@pytest.fixture
def centro_costo_a(empresa_a):
    return CentroCosto.objects.create(empresa=empresa_a, codigo='CC01', nombre='CC A')


@pytest.fixture
def unidad_a(empresa_a):
    from catalogs.models import UnidadMedida

    return UnidadMedida.objects.create(
        empresa=empresa_a,
        codigo='UND',
        nombre='Unidad',
        abreviacion='und',
    )


@pytest.fixture
def producto_a(empresa_a, unidad_a):
    tipo = TipoControlInventario.objects.get(codigo='NO_SERIALIZADO')
    return Producto.objects.create(
        empresa=empresa_a,
        sku='P-A-001',
        nombre='Producto A',
        unidad_medida=unidad_a,
        tipo_control_inventario=tipo,
    )


@pytest.fixture
def producto_b(empresa_b):
    from catalogs.models import UnidadMedida

    unidad = UnidadMedida.objects.create(
        empresa=empresa_b,
        codigo='UND',
        nombre='Unidad',
        abreviacion='und',
    )
    tipo = TipoControlInventario.objects.get(codigo='NO_SERIALIZADO')
    return Producto.objects.create(
        empresa=empresa_b,
        sku='P-B-001',
        nombre='Producto B',
        unidad_medida=unidad,
        tipo_control_inventario=tipo,
    )


@pytest.fixture
def proveedor_a(empresa_a):
    return Proveedor.objects.create(empresa=empresa_a, razon_social='Proveedor A')
