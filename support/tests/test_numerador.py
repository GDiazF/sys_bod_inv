import concurrent.futures

import pytest
from django.core.exceptions import ValidationError
from django.db import close_old_connections, connection

from core.models import Bodega, Empresa
from support.models import Numerador, UbicacionBodega
from support.services.exceptions import NumeradorInactivoError, NumeradorNoConfiguradoError
from support.services.numerador_service import NumeradorService


@pytest.fixture
def empresa(db):
    return Empresa.objects.create(codigo='TEST', nombre='Empresa Test')


@pytest.fixture
def bodega(empresa):
    return Bodega.objects.create(
        empresa=empresa,
        codigo='B01',
        nombre='Bodega Principal',
    )


def _generar_folio_en_hilo(empresa_id, tipo_documento):
    close_old_connections()
    empresa = Empresa.objects.get(pk=empresa_id)
    return NumeradorService.generar_folio(empresa, tipo_documento)


@pytest.mark.django_db(transaction=True)
class TestNumeradorService:
    def test_genera_folio_secuencial(self, empresa):
        NumeradorService.obtener_o_crear(empresa, 'SOLICITUD', prefijo='SOL-')
        folio1 = NumeradorService.generar_folio(empresa, 'SOLICITUD')
        folio2 = NumeradorService.generar_folio(empresa, 'SOLICITUD')
        assert folio1 == 'SOL-000001'
        assert folio2 == 'SOL-000002'

    def test_numerador_no_configurado(self, empresa):
        with pytest.raises(NumeradorNoConfiguradoError):
            NumeradorService.generar_folio(empresa, 'COMPRA')

    def test_numerador_inactivo(self, empresa):
        Numerador.objects.create(
            empresa=empresa,
            tipo_documento='TRASLADO',
            prefijo='TRA-',
            ultimo_numero=0,
            activo=False,
        )
        with pytest.raises(NumeradorInactivoError):
            NumeradorService.generar_folio(empresa, 'TRASLADO')

    def test_obtener_o_crear_idempotente(self, empresa):
        n1 = NumeradorService.obtener_o_crear(empresa, 'ENTREGA', prefijo='ENT-')
        n2 = NumeradorService.obtener_o_crear(empresa, 'ENTREGA', prefijo='ENT-')
        assert n1.pk == n2.pk
        assert Numerador.objects.filter(empresa=empresa, tipo_documento='ENTREGA').count() == 1

    def test_generar_folio_secuencial_sin_duplicados(self, empresa):
        """En SQLite valida unicidad secuencial (20 folios distintos)."""
        NumeradorService.obtener_o_crear(empresa, 'SEQ', prefijo='S-', longitud=3)
        folios = [NumeradorService.generar_folio(empresa, 'SEQ') for _ in range(20)]
        assert len(set(folios)) == 20
        assert folios[-1] == 'S-020'

    @pytest.mark.skipif(
        connection.vendor == 'sqlite',
        reason='Concurrencia con select_for_update requiere PostgreSQL.',
    )
    def test_generar_folio_concurrente_sin_duplicados(self, empresa):
        NumeradorService.obtener_o_crear(empresa, 'CONC', prefijo='C-', longitud=3)
        total = 20
        workers = 8

        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
            folios = list(
                pool.map(
                    lambda _: _generar_folio_en_hilo(empresa.pk, 'CONC'),
                    range(total),
                )
            )

        assert len(folios) == total
        assert len(set(folios)) == total
        assert sorted(folios) == [f'C-{i:03d}' for i in range(1, total + 1)]

        numerador = Numerador.objects.get(empresa=empresa, tipo_documento='CONC')
        assert numerador.ultimo_numero == total


@pytest.mark.django_db
class TestUbicacionBodega:
    def test_ubicacion_no_padre_de_si_misma(self, empresa, bodega):
        ubicacion = UbicacionBodega(
            empresa=empresa,
            bodega=bodega,
            codigo='A1',
            nombre='Pasillo A1',
        )
        ubicacion.save()
        ubicacion.ubicacion_padre = ubicacion
        with pytest.raises(ValidationError):
            ubicacion.full_clean()

    def test_ubicacion_padre_misma_bodega(self, empresa, bodega):
        padre = UbicacionBodega.objects.create(
            empresa=empresa,
            bodega=bodega,
            codigo='A',
            nombre='Zona A',
        )
        otra_bodega = Bodega.objects.create(
            empresa=empresa,
            codigo='B02',
            nombre='Bodega Secundaria',
        )
        hija = UbicacionBodega(
            empresa=empresa,
            bodega=otra_bodega,
            codigo='A1',
            nombre='Estante',
            ubicacion_padre=padre,
        )
        with pytest.raises(ValidationError):
            hija.full_clean()
