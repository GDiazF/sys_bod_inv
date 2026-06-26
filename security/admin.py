from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from security.models import Permiso, Rol, RolPermiso, Usuario, UsuarioRol


@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    ordering = ('email',)
    list_display = ('email', 'nombre_completo', 'empresa', 'activo', 'is_staff')
    list_filter = ('activo', 'is_staff', 'empresa')
    search_fields = ('email', 'nombre_completo')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información personal', {'fields': ('nombre_completo', 'empresa')}),
        ('Permisos', {'fields': ('activo', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas', {'fields': ('ultimo_acceso_at', 'last_login')}),
    )
    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': ('email', 'nombre_completo', 'empresa', 'password1', 'password2'),
            },
        ),
    )
    filter_horizontal = ('groups', 'user_permissions')


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'empresa', 'activo')
    list_filter = ('activo', 'empresa')
    search_fields = ('codigo', 'nombre')


@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'modulo', 'documento_tipo', 'activo')
    list_filter = ('activo', 'modulo', 'documento_tipo')
    search_fields = ('codigo', 'nombre')


@admin.register(UsuarioRol)
class UsuarioRolAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'rol', 'created_at')
    list_filter = ('rol__empresa',)


@admin.register(RolPermiso)
class RolPermisoAdmin(admin.ModelAdmin):
    list_display = ('rol', 'permiso', 'created_at')
    list_filter = ('rol__empresa',)
