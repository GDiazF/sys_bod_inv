from django.contrib import admin

from catalogs.models import (
    Categoria,
    EstadoDocumento,
    EstadoSerie,
    Marca,
    MetodoCosteo,
    TipoControlInventario,
    TipoMovimientoInventario,
    UnidadMedida,
)


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'empresa', 'activa')
    list_filter = ('activa', 'empresa')
    search_fields = ('codigo', 'nombre')


@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'codigo', 'empresa', 'activa')
    list_filter = ('activa', 'empresa')
    search_fields = ('nombre', 'codigo')


@admin.register(UnidadMedida)
class UnidadMedidaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'abreviacion', 'empresa', 'activa')
    list_filter = ('activa', 'empresa')
    search_fields = ('codigo', 'nombre')


@admin.register(TipoControlInventario)
class TipoControlInventarioAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'activo')
    list_filter = ('activo',)
    search_fields = ('codigo', 'nombre')


@admin.register(EstadoSerie)
class EstadoSerieAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'es_final', 'activo')
    list_filter = ('activo', 'es_final')
    search_fields = ('codigo', 'nombre')


@admin.register(TipoMovimientoInventario)
class TipoMovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = (
        'codigo',
        'nombre',
        'naturaleza',
        'afecta_stock',
        'requiere_aprobacion',
        'activo',
    )
    list_filter = ('naturaleza', 'afecta_stock', 'activo')
    search_fields = ('codigo', 'nombre')


@admin.register(MetodoCosteo)
class MetodoCosteoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'activo')
    list_filter = ('activo',)
    search_fields = ('codigo', 'nombre')


@admin.register(EstadoDocumento)
class EstadoDocumentoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'modulo', 'documento_tipo', 'es_final', 'activo')
    list_filter = ('activo', 'es_final', 'modulo', 'documento_tipo')
    search_fields = ('codigo', 'nombre')
