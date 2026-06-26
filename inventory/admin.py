from django.contrib import admin

from inventory.models import (
    CapaCosteoFifo,
    ConsumoCapaFifo,
    Lote,
    MovimientoInventario,
    Producto,
    Proveedor,
    Serie,
    StockActual,
)


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('razon_social', 'rut', 'empresa', 'activo')
    list_filter = ('activo', 'empresa')
    search_fields = ('razon_social', 'rut')


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = (
        'sku',
        'nombre',
        'empresa',
        'tipo_control_inventario',
        'activo',
        'costo_promedio_actual',
    )
    list_filter = ('activo', 'empresa', 'tipo_control_inventario')
    search_fields = ('sku', 'nombre')


@admin.register(Serie)
class SerieAdmin(admin.ModelAdmin):
    list_display = (
        'numero_serie',
        'producto',
        'estado_serie',
        'bodega_actual',
        'empresa',
    )
    list_filter = ('estado_serie', 'empresa')
    search_fields = ('numero_serie', 'producto__sku')


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ('codigo_lote', 'producto', 'fecha_vencimiento', 'empresa', 'activo')
    list_filter = ('activo', 'empresa')
    search_fields = ('codigo_lote', 'producto__sku')


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'tipo_movimiento',
        'producto',
        'cantidad',
        'bodega_origen',
        'bodega_destino',
        'anulado',
        'fecha_movimiento',
    )
    list_filter = ('anulado', 'tipo_movimiento', 'empresa')
    search_fields = ('producto__sku', 'referencia_id')
    readonly_fields = ('created_at', 'updated_at', 'fecha_movimiento')


@admin.register(StockActual)
class StockActualAdmin(admin.ModelAdmin):
    list_display = ('producto', 'bodega', 'lote', 'cantidad', 'costo_promedio', 'empresa')
    list_filter = ('empresa', 'bodega')
    search_fields = ('producto__sku',)


@admin.register(CapaCosteoFifo)
class CapaCosteoFifoAdmin(admin.ModelAdmin):
    list_display = (
        'producto',
        'bodega',
        'cantidad_saldo',
        'costo_unitario',
        'cerrada',
        'fecha_entrada',
    )
    list_filter = ('cerrada', 'empresa')
    readonly_fields = ('created_at',)


@admin.register(ConsumoCapaFifo)
class ConsumoCapaFifoAdmin(admin.ModelAdmin):
    list_display = (
        'capa_fifo',
        'movimiento_salida',
        'cantidad_consumida',
        'costo_total',
        'created_at',
    )
    readonly_fields = ('created_at',)
