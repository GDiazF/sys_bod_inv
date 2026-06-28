import pytest

from django.core.management import call_command
from core.models import ParametroEmpresa
from security.models import Permiso, Rol, RolPermiso


@pytest.mark.django_db
def test_load_initial_data_es_idempotente():
    call_command('load_initial_data', verbosity=0)
    counts_first = {
        'permisos': Permiso.objects.count(),
        'empresas': ParametroEmpresa.objects.filter(empresa__codigo='DEMO').count(),
    }

    call_command('load_initial_data', verbosity=0)
    counts_second = {
        'permisos': Permiso.objects.count(),
        'empresas': ParametroEmpresa.objects.filter(empresa__codigo='DEMO').count(),
    }

    assert counts_first == counts_second
    assert counts_first['permisos'] == 31
    assert counts_first['empresas'] == 1


@pytest.mark.django_db
def test_load_initial_data_preserva_permisos_y_parametros_custom():
    call_command('load_initial_data', verbosity=0)

    parametros = ParametroEmpresa.objects.get(empresa__codigo='DEMO')
    parametros.stock_negativo_permitido = True
    parametros.aprobacion_salida_requerida = False
    parametros.save(update_fields=['stock_negativo_permitido', 'aprobacion_salida_requerida'])

    rol_bodeguero = Rol.objects.get(empresa__codigo='DEMO', codigo='BODEGUERO')
    permiso_extra = Permiso.objects.get(codigo='core.empresa.ver')
    RolPermiso.objects.get_or_create(rol=rol_bodeguero, permiso=permiso_extra)
    permisos_antes = RolPermiso.objects.filter(rol=rol_bodeguero).count()

    call_command('load_initial_data', verbosity=0)

    parametros.refresh_from_db()
    assert parametros.stock_negativo_permitido is True
    assert parametros.aprobacion_salida_requerida is False

    permisos_despues = RolPermiso.objects.filter(rol=rol_bodeguero).count()
    assert permisos_despues >= permisos_antes
    assert RolPermiso.objects.filter(rol=rol_bodeguero, permiso=permiso_extra).exists()
