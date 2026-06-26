from catalogs.models import (
    EstadoDocumento,
    EstadoSerie,
    MetodoCosteo,
    TipoControlInventario,
    TipoMovimientoInventario,
)
from catalogs.seeds import (
    ESTADOS_DOCUMENTO,
    ESTADOS_SERIE,
    METODOS_COSTEO,
    TIPOS_CONTROL_INVENTARIO,
    TIPOS_MOVIMIENTO,
)


def sync_catalogos_globales():
    """Inserta o actualiza catálogos globales por código (idempotente)."""
    for data in METODOS_COSTEO:
        MetodoCosteo.objects.update_or_create(
            codigo=data['codigo'],
            defaults=data,
        )

    for data in TIPOS_CONTROL_INVENTARIO:
        TipoControlInventario.objects.update_or_create(
            codigo=data['codigo'],
            defaults={**data, 'activo': True},
        )

    for data in ESTADOS_SERIE:
        EstadoSerie.objects.update_or_create(
            codigo=data['codigo'],
            defaults={**data, 'activo': True},
        )

    for data in TIPOS_MOVIMIENTO:
        TipoMovimientoInventario.objects.update_or_create(
            codigo=data['codigo'],
            defaults={**data, 'activo': True},
        )

    for data in ESTADOS_DOCUMENTO:
        EstadoDocumento.objects.update_or_create(
            codigo=data['codigo'],
            defaults={**data, 'activo': True},
        )
