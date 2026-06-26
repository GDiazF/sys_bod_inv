class SupportServiceError(Exception):
    """Error base de servicios de support."""


class NumeradorInactivoError(SupportServiceError):
    pass


class NumeradorNoConfiguradoError(SupportServiceError):
    pass
