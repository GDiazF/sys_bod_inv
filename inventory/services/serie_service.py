from decimal import Decimal

from catalogs.models import EstadoSerie
from core.models import Bodega, CentroCosto
from inventory.models import Producto, Serie
from inventory.services.exceptions import (
    CantidadInvalidaError,
    LoteProhibidoError,
    SerieNoDisponibleError,
    SerieProhibidaError,
    SerieRequeridaError,
    TipoControlInvalidoError,
)


class SerieService:
    CODIGO_DISPONIBLE = 'DISPONIBLE'
    CODIGO_EN_TRANSITO = 'EN_TRANSITO'
    CODIGO_ENTREGADO = 'ENTREGADO'

    @staticmethod
    def _estado(codigo: str) -> EstadoSerie:
        return EstadoSerie.objects.get(codigo=codigo)

    @staticmethod
    def validar_tipo_control_serie(producto: Producto, serie: Serie | None, lote) -> None:
        codigo = producto.tipo_control_inventario.codigo
        if codigo == 'SERIALIZADO':
            if serie is None:
                raise SerieRequeridaError('Producto serializado requiere número de serie.')
            if lote is not None:
                raise LoteProhibidoError('Producto serializado no admite lote.')
        elif codigo == 'NO_SERIALIZADO':
            if serie is not None:
                raise SerieProhibidaError('Producto no serializado no admite serie.')
            if lote is not None:
                raise LoteProhibidoError('Producto no serializado no admite lote.')
        elif codigo == 'POR_LOTE':
            if serie is not None:
                raise SerieProhibidaError('Producto por lote no admite serie.')
        else:
            raise TipoControlInvalidoError(f'Tipo de control desconocido: {codigo}.')

    @staticmethod
    def validar_cantidad_serializada(producto: Producto, cantidad: Decimal) -> None:
        if producto.tipo_control_inventario.codigo == 'SERIALIZADO' and cantidad != Decimal('1'):
            raise CantidadInvalidaError(
                'Producto serializado requiere cantidad igual a 1.'
            )

    @staticmethod
    def validar_serie_disponible_en_bodega(serie: Serie, bodega: Bodega) -> None:
        if serie.estado_serie.codigo != SerieService.CODIGO_DISPONIBLE:
            raise SerieNoDisponibleError(
                f'La serie {serie.numero_serie} no está disponible (estado: {serie.estado_serie.codigo}).'
            )
        if serie.bodega_actual_id != bodega.id:
            raise SerieNoDisponibleError(
                f'La serie {serie.numero_serie} no se encuentra en la bodega {bodega.codigo}.'
            )

    @staticmethod
    def registrar_entrada(
        serie: Serie,
        bodega: Bodega,
    ) -> None:
        serie.estado_serie = SerieService._estado(SerieService.CODIGO_DISPONIBLE)
        serie.bodega_actual = bodega
        serie.centro_costo_actual = None
        serie.save(update_fields=['estado_serie', 'bodega_actual', 'centro_costo_actual'])

    @staticmethod
    def registrar_salida(
        serie: Serie,
        centro_costo: CentroCosto | None = None,
    ) -> None:
        serie.estado_serie = SerieService._estado(SerieService.CODIGO_ENTREGADO)
        serie.bodega_actual = None
        serie.centro_costo_actual = centro_costo
        serie.save(update_fields=['estado_serie', 'bodega_actual', 'centro_costo_actual'])

    @staticmethod
    def registrar_transito(serie: Serie, bodega_transito: Bodega | None = None) -> None:
        serie.estado_serie = SerieService._estado(SerieService.CODIGO_EN_TRANSITO)
        serie.bodega_actual = bodega_transito
        serie.save(update_fields=['estado_serie', 'bodega_actual'])

    @staticmethod
    def registrar_recepcion_traslado(serie: Serie, bodega_destino: Bodega) -> None:
        serie.estado_serie = SerieService._estado(SerieService.CODIGO_DISPONIBLE)
        serie.bodega_actual = bodega_destino
        serie.save(update_fields=['estado_serie', 'bodega_actual'])

    @staticmethod
    def revertir_transito(serie: Serie, bodega_origen: Bodega) -> None:
        SerieService.registrar_entrada(serie, bodega_origen)

    @staticmethod
    def revertir_salida(serie: Serie, bodega: Bodega) -> None:
        serie.estado_serie = SerieService._estado(SerieService.CODIGO_DISPONIBLE)
        serie.bodega_actual = bodega
        serie.centro_costo_actual = None
        serie.save(update_fields=['estado_serie', 'bodega_actual', 'centro_costo_actual'])

    @staticmethod
    def revertir_entrada(serie: Serie) -> None:
        serie.estado_serie = SerieService._estado('BAJA')
        serie.bodega_actual = None
        serie.centro_costo_actual = None
        serie.save(update_fields=['estado_serie', 'bodega_actual', 'centro_costo_actual'])

    @staticmethod
    def crear_serie(
        producto: Producto,
        numero_serie: str,
        bodega: Bodega | None = None,
    ) -> Serie:
        estado = SerieService._estado(SerieService.CODIGO_DISPONIBLE)
        return Serie.objects.create(
            empresa=producto.empresa,
            producto=producto,
            numero_serie=numero_serie,
            estado_serie=estado,
            bodega_actual=bodega,
        )
