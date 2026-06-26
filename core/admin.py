from django.contrib import admin

from core.models import Bodega, CentroCosto, Empresa, ParametroEmpresa, Sucursal


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'rut', 'activo', 'updated_at')
    list_filter = ('activo',)
    search_fields = ('codigo', 'nombre', 'rut')


@admin.register(Sucursal)
class SucursalAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'empresa', 'activa')
    list_filter = ('activa', 'empresa')
    search_fields = ('codigo', 'nombre')


@admin.register(Bodega)
class BodegaAdmin(admin.ModelAdmin):
    list_display = (
        'codigo',
        'nombre',
        'empresa',
        'sucursal',
        'es_principal',
        'es_transito',
        'activa',
    )
    list_filter = ('activa', 'es_principal', 'es_transito', 'empresa')
    search_fields = ('codigo', 'nombre')


@admin.register(CentroCosto)
class CentroCostoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'empresa', 'tipo', 'activo')
    list_filter = ('activo', 'empresa')
    search_fields = ('codigo', 'nombre')


@admin.register(ParametroEmpresa)
class ParametroEmpresaAdmin(admin.ModelAdmin):
    list_display = (
        'empresa',
        'metodo_costeo',
        'stock_negativo_permitido',
        'aprobacion_salida_requerida',
    )
    list_filter = ('stock_negativo_permitido', 'aprobacion_salida_requerida')
