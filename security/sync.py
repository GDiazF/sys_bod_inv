from security.models import Permiso
from security.seeds import PERMISOS_V1


def sync_permisos_v1():
    """Inserta o actualiza permisos v1 por código (idempotente)."""
    for codigo, nombre, modulo, documento_tipo, descripcion in PERMISOS_V1:
        Permiso.objects.update_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'modulo': modulo,
                'documento_tipo': documento_tipo,
                'descripcion': descripcion,
                'activo': True,
            },
        )
