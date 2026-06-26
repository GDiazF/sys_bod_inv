class InventoryServiceError(Exception):
    """Error base de servicios de inventario."""


class StockInsuficienteError(InventoryServiceError):
    pass


class CantidadInvalidaError(InventoryServiceError):
    pass


class BodegaRequeridaError(InventoryServiceError):
    pass


class SerieRequeridaError(InventoryServiceError):
    pass


class LoteRequeridoError(InventoryServiceError):
    pass


class SerieProhibidaError(InventoryServiceError):
    pass


class LoteProhibidoError(InventoryServiceError):
    pass


class TipoControlInvalidoError(InventoryServiceError):
    pass


class SerieNoDisponibleError(InventoryServiceError):
    pass


class SerieEnTransitoError(InventoryServiceError):
    pass


class MovimientoYaAnuladoError(InventoryServiceError):
    pass


class MovimientoNoAnulableError(InventoryServiceError):
    pass


class FifoNoHabilitadoError(InventoryServiceError):
    pass


class ProductoSinStockError(InventoryServiceError):
    pass
