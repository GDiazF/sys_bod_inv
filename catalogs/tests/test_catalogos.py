from catalogs.models import (
    EstadoDocumento,
    EstadoSerie,
    MetodoCosteo,
    TipoControlInventario,
    TipoMovimientoInventario,
)


class TestCatalogosGlobales:
    def test_fixtures_globales_cargan(self, catalogos_globales):
        assert MetodoCosteo.objects.count() >= 2
        assert TipoControlInventario.objects.count() == 3
        assert EstadoSerie.objects.count() == 5
        assert TipoMovimientoInventario.objects.count() >= 7
        assert EstadoDocumento.objects.count() == 7

    def test_tipo_control_inventario_codigos(self, catalogos_globales):
        codigos = set(
            TipoControlInventario.objects.values_list('codigo', flat=True)
        )
        assert codigos == {'SERIALIZADO', 'NO_SERIALIZADO', 'POR_LOTE'}

    def test_estado_documento_transiciones_catalogo(self, catalogos_globales):
        requeridos = {
            'BORRADOR',
            'PENDIENTE',
            'APROBADO',
            'RECHAZADO',
            'EN_TRANSITO',
            'CERRADO',
            'ANULADO',
        }
        codigos = set(EstadoDocumento.objects.values_list('codigo', flat=True))
        assert requeridos.issubset(codigos)

    def test_estado_serie_codigos(self, catalogos_globales):
        codigos = set(EstadoSerie.objects.values_list('codigo', flat=True))
        assert 'DISPONIBLE' in codigos
        assert 'EN_TRANSITO' in codigos
        assert 'ENTREGADO' in codigos

    def test_tipo_movimiento_naturaleza(self, catalogos_globales):
        entrada = TipoMovimientoInventario.objects.get(codigo='ENTRADA_COMPRA')
        salida = TipoMovimientoInventario.objects.get(codigo='SALIDA_ENTREGA')
        assert entrada.naturaleza == TipoMovimientoInventario.NATURALEZA_ENTRADA
        assert salida.naturaleza == TipoMovimientoInventario.NATURALEZA_SALIDA

    def test_metodo_costeo_fifo_inactivo_v1(self, catalogos_globales):
        fifo = MetodoCosteo.objects.get(codigo='FIFO')
        promedio = MetodoCosteo.objects.get(codigo='PROMEDIO_PONDERADO')
        assert fifo.activo is False
        assert promedio.activo is True
