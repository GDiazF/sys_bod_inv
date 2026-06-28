from rest_framework.permissions import BasePermission

from security.services.permiso_service import PermisoService


class RBACPermission(BasePermission):
    message = 'No tiene permiso para realizar esta acción.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        codigo = view.get_required_permission()
        if codigo is None:
            return False
        if isinstance(codigo, (list, tuple, set)):
            return PermisoService.tiene_alguno(request.user, codigo)
        return PermisoService.tiene_permiso(request.user, codigo)
