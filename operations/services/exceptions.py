class OperationsServiceError(Exception):
    """Error base de servicios de operaciones."""


class DocumentoEstadoInvalidoError(OperationsServiceError):
    pass


class DocumentoNoEditableError(OperationsServiceError):
    pass


class DocumentoSinDetalleError(OperationsServiceError):
    pass


class DocumentoNoAprobadoError(OperationsServiceError):
    pass


class CantidadExcedeAprobadaError(OperationsServiceError):
    pass


class BodegaOrigenDestinoIgualError(OperationsServiceError):
    pass


class TrasladoEstadoInvalidoError(OperationsServiceError):
    pass
