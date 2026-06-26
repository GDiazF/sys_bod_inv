import pytest
from django.core.management import call_command

from catalogs.models import MetodoCosteo, TipoControlInventario
from core.models import Empresa, ParametroEmpresa
from security.models import Permiso
from support.models import Numerador


@pytest.mark.django_db
def test_load_initial_data_es_idempotente():
    call_command('load_initial_data', verbosity=0)
    counts_first = {
        'tipos_control': TipoControlInventario.objects.count(),
        'permisos': Permiso.objects.count(),
        'empresas': Empresa.objects.filter(codigo='DEMO').count(),
        'numeradores': Numerador.objects.count(),
    }

    call_command('load_initial_data', verbosity=0)
    counts_second = {
        'tipos_control': TipoControlInventario.objects.count(),
        'permisos': Permiso.objects.count(),
        'empresas': Empresa.objects.filter(codigo='DEMO').count(),
        'numeradores': Numerador.objects.count(),
    }

    assert counts_first == counts_second
    assert counts_first['tipos_control'] == 3
    assert counts_first['permisos'] == 31
    assert counts_first['empresas'] == 1

    parametros = ParametroEmpresa.objects.get(empresa__codigo='DEMO')
    assert parametros.metodo_costeo.codigo == 'PROMEDIO_PONDERADO'
    assert MetodoCosteo.objects.filter(codigo='PROMEDIO_PONDERADO').exists()
