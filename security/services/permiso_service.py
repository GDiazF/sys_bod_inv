from security.models import Permiso


class PermisoService:
    @staticmethod
    def obtener_codigos_usuario(usuario) -> set[str]:
        if not usuario or not usuario.is_authenticated:
            return set()
        if usuario.is_superuser:
            return set(Permiso.objects.filter(activo=True).values_list('codigo', flat=True))
        return set(
            Permiso.objects.filter(
                activo=True,
                rolpermiso__rol__usuariorol__usuario=usuario,
                rolpermiso__rol__activo=True,
            )
            .values_list('codigo', flat=True)
            .distinct()
        )

    @classmethod
    def tiene_permiso(cls, usuario, codigo: str) -> bool:
        if not usuario or not usuario.is_authenticated:
            return False
        if usuario.is_superuser:
            return True
        return codigo in cls.obtener_codigos_usuario(usuario)

    @classmethod
    def tiene_alguno(cls, usuario, codigos) -> bool:
        if not codigos:
            return True
        if usuario.is_superuser:
            return True
        user_perms = cls.obtener_codigos_usuario(usuario)
        return any(c in user_perms for c in codigos)
