from django.contrib import admin

from support.models import Adjunto, Custodio, Numerador, UbicacionBodega


@admin.register(UbicacionBodega)
class UbicacionBodegaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'bodega', 'empresa', 'ubicacion_padre', 'activa')
    list_filter = ('activa', 'empresa', 'bodega')
    search_fields = ('codigo', 'nombre')


@admin.register(Custodio)
class CustodioAdmin(admin.ModelAdmin):
    list_display = ('nombre_completo', 'codigo', 'empresa', 'documento_identidad', 'activo')
    list_filter = ('activo', 'empresa')
    search_fields = ('nombre_completo', 'codigo', 'documento_identidad')


@admin.register(Numerador)
class NumeradorAdmin(admin.ModelAdmin):
    list_display = (
        'tipo_documento',
        'empresa',
        'prefijo',
        'ultimo_numero',
        'longitud',
        'activo',
    )
    list_filter = ('activo', 'empresa', 'tipo_documento')
    search_fields = ('tipo_documento', 'prefijo')


@admin.register(Adjunto)
class AdjuntoAdmin(admin.ModelAdmin):
    list_display = (
        'nombre_archivo',
        'modulo',
        'documento_id',
        'empresa',
        'subido_por',
        'created_at',
    )
    list_filter = ('modulo', 'empresa')
    search_fields = ('nombre_archivo', 'documento_id')
