from django.contrib import admin

from operations.models import (
    AjusteInventario,
    AjusteInventarioDetalle,
    Compra,
    CompraDetalle,
    Entrega,
    EntregaDetalle,
    EstadoHistorialDocumento,
    Solicitud,
    SolicitudDetalle,
    Traslado,
    TrasladoDetalle,
)


class SolicitudDetalleInline(admin.TabularInline):
    model = SolicitudDetalle
    extra = 0


@admin.register(Solicitud)
class SolicitudAdmin(admin.ModelAdmin):
    list_display = ('numero', 'empresa', 'estado', 'centro_costo', 'fecha_solicitud')
    list_filter = ('estado', 'empresa')
    inlines = [SolicitudDetalleInline]


class EntregaDetalleInline(admin.TabularInline):
    model = EntregaDetalle
    extra = 0


@admin.register(Entrega)
class EntregaAdmin(admin.ModelAdmin):
    list_display = ('numero', 'empresa', 'estado', 'bodega', 'solicitud', 'es_ad_hoc')
    list_filter = ('estado', 'empresa', 'es_ad_hoc')
    inlines = [EntregaDetalleInline]


class TrasladoDetalleInline(admin.TabularInline):
    model = TrasladoDetalle
    extra = 0


@admin.register(Traslado)
class TrasladoAdmin(admin.ModelAdmin):
    list_display = (
        'numero',
        'empresa',
        'estado',
        'bodega_origen',
        'bodega_destino',
    )
    list_filter = ('estado', 'empresa')
    inlines = [TrasladoDetalleInline]


class CompraDetalleInline(admin.TabularInline):
    model = CompraDetalle
    extra = 0


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = ('numero', 'empresa', 'estado', 'proveedor', 'bodega_destino')
    list_filter = ('estado', 'empresa')
    inlines = [CompraDetalleInline]


class AjusteDetalleInline(admin.TabularInline):
    model = AjusteInventarioDetalle
    extra = 0


@admin.register(AjusteInventario)
class AjusteInventarioAdmin(admin.ModelAdmin):
    list_display = ('numero', 'empresa', 'estado', 'bodega', 'fecha_ajuste')
    list_filter = ('estado', 'empresa')
    inlines = [AjusteDetalleInline]


@admin.register(EstadoHistorialDocumento)
class EstadoHistorialDocumentoAdmin(admin.ModelAdmin):
    list_display = (
        'documento_tipo',
        'documento_id',
        'estado_anterior',
        'estado_nuevo',
        'usuario',
        'created_at',
    )
    list_filter = ('documento_tipo', 'empresa')
