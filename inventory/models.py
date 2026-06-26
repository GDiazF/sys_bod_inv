from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class Proveedor(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='proveedores',
    )
    rut = models.CharField(max_length=20, blank=True, null=True)
    razon_social = models.CharField(max_length=180)
    nombre_contacto = models.CharField(max_length=120, blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    correo = models.CharField(max_length=150, blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'proveedores'
        verbose_name = 'proveedor'
        verbose_name_plural = 'proveedores'

    def __str__(self):
        return self.razon_social


class Producto(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='productos',
    )
    sku = models.CharField(max_length=50)
    nombre = models.CharField(max_length=180)
    descripcion = models.TextField(blank=True, null=True)
    categoria = models.ForeignKey(
        'catalogs.Categoria',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='productos',
    )
    marca = models.ForeignKey(
        'catalogs.Marca',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='productos',
    )
    unidad_medida = models.ForeignKey(
        'catalogs.UnidadMedida',
        on_delete=models.PROTECT,
        related_name='productos_base',
    )
    unidad_compra = models.ForeignKey(
        'catalogs.UnidadMedida',
        on_delete=models.PROTECT,
        related_name='productos_compra',
        blank=True,
        null=True,
    )
    tipo_control_inventario = models.ForeignKey(
        'catalogs.TipoControlInventario',
        on_delete=models.PROTECT,
        related_name='productos',
    )
    maneja_stock = models.BooleanField(default=True)
    permite_stock_negativo = models.BooleanField(default=False)
    requiere_aprobacion_salida = models.BooleanField(default=False)
    costo_promedio_actual = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        default=Decimal('0'),
    )
    factor_conversion = models.DecimalField(
        max_digits=18,
        decimal_places=6,
        default=Decimal('1'),
    )
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'productos'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'sku'],
                name='uq_producto_empresa_sku',
            ),
        ]
        indexes = [
            models.Index(fields=['empresa', 'sku']),
        ]
        verbose_name = 'producto'
        verbose_name_plural = 'productos'

    def __str__(self):
        return f'{self.sku} - {self.nombre}'

    def clean(self):
        super().clean()
        if self.factor_conversion is not None and self.factor_conversion <= 0:
            raise ValidationError(
                {'factor_conversion': 'El factor de conversión debe ser mayor que cero.'}
            )


class Serie(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='series',
    )
    producto = models.ForeignKey(
        'inventory.Producto',
        on_delete=models.PROTECT,
        related_name='series',
    )
    numero_serie = models.CharField(max_length=120)
    estado_serie = models.ForeignKey(
        'catalogs.EstadoSerie',
        on_delete=models.PROTECT,
        related_name='series',
    )
    bodega_actual = models.ForeignKey(
        'core.Bodega',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='series',
    )
    centro_costo_actual = models.ForeignKey(
        'core.CentroCosto',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='series',
    )
    ubicacion_bodega = models.ForeignKey(
        'support.UbicacionBodega',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='series',
    )
    custodio = models.ForeignKey(
        'support.Custodio',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='series',
    )
    fecha_alta = models.DateField(blank=True, null=True)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'series'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'numero_serie'],
                name='uq_serie_empresa_numero',
            ),
        ]
        verbose_name = 'serie'
        verbose_name_plural = 'series'

    def __str__(self):
        return self.numero_serie


class Lote(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='lotes',
    )
    producto = models.ForeignKey(
        'inventory.Producto',
        on_delete=models.PROTECT,
        related_name='lotes',
    )
    codigo_lote = models.CharField(max_length=120)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    fecha_fabricacion = models.DateField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'lotes'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'producto', 'codigo_lote'],
                name='uq_lote_producto_codigo',
            ),
        ]
        verbose_name = 'lote'
        verbose_name_plural = 'lotes'

    def __str__(self):
        return self.codigo_lote


class MovimientoInventario(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='movimientos_inventario',
    )
    tipo_movimiento = models.ForeignKey(
        'catalogs.TipoMovimientoInventario',
        on_delete=models.PROTECT,
        related_name='movimientos',
    )
    producto = models.ForeignKey(
        'inventory.Producto',
        on_delete=models.PROTECT,
        related_name='movimientos',
    )
    serie = models.ForeignKey(
        'inventory.Serie',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='movimientos',
    )
    lote = models.ForeignKey(
        'inventory.Lote',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='movimientos',
    )
    bodega_origen = models.ForeignKey(
        'core.Bodega',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='movimientos_origen',
    )
    bodega_destino = models.ForeignKey(
        'core.Bodega',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='movimientos_destino',
    )
    centro_costo = models.ForeignKey(
        'core.CentroCosto',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='movimientos_inventario',
    )
    ubicacion_bodega = models.ForeignKey(
        'support.UbicacionBodega',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='movimientos',
    )
    cantidad = models.DecimalField(max_digits=18, decimal_places=4)
    costo_unitario = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        default=Decimal('0'),
    )
    costo_total = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        default=Decimal('0'),
    )
    metodo_costeo = models.ForeignKey(
        'catalogs.MetodoCosteo',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='movimientos',
    )
    referencia_tipo = models.CharField(max_length=50, blank=True, null=True)
    referencia_id = models.CharField(max_length=50, blank=True, null=True)
    anulado = models.BooleanField(default=False)
    movimiento_origen = models.ForeignKey(
        'self',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='reversas',
    )
    fecha_movimiento = models.DateTimeField(auto_now_add=True)
    observacion = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        'security.Usuario',
        on_delete=models.PROTECT,
        related_name='movimientos_creados',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'movimientosinventario'
        indexes = [
            models.Index(fields=['empresa', 'producto', 'created_at']),
            models.Index(fields=['empresa', 'referencia_tipo', 'referencia_id']),
        ]
        verbose_name = 'movimiento de inventario'
        verbose_name_plural = 'movimientos de inventario'

    def __str__(self):
        return f'{self.tipo_movimiento.codigo} - {self.producto.sku}'


class StockActual(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='stocks_actuales',
    )
    bodega = models.ForeignKey(
        'core.Bodega',
        on_delete=models.PROTECT,
        related_name='stocks_actuales',
    )
    producto = models.ForeignKey(
        'inventory.Producto',
        on_delete=models.PROTECT,
        related_name='stocks_actuales',
    )
    lote = models.ForeignKey(
        'inventory.Lote',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='stocks_actuales',
    )
    cantidad = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        default=Decimal('0'),
    )
    costo_promedio = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        default=Decimal('0'),
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stockactual'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'bodega', 'producto', 'lote'],
                condition=Q(lote__isnull=False),
                name='uq_stock_con_lote',
            ),
            models.UniqueConstraint(
                fields=['empresa', 'bodega', 'producto'],
                condition=Q(lote__isnull=True),
                name='uq_stock_sin_lote',
            ),
        ]
        verbose_name = 'stock actual'
        verbose_name_plural = 'stocks actuales'

    def __str__(self):
        return f'{self.bodega.codigo}/{self.producto.sku}: {self.cantidad}'


class CapaCosteoFifo(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='capas_costeo_fifo',
    )
    producto = models.ForeignKey(
        'inventory.Producto',
        on_delete=models.PROTECT,
        related_name='capas_costeo_fifo',
    )
    bodega = models.ForeignKey(
        'core.Bodega',
        on_delete=models.PROTECT,
        related_name='capas_costeo_fifo',
    )
    lote = models.ForeignKey(
        'inventory.Lote',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='capas_costeo_fifo',
    )
    movimiento_entrada = models.ForeignKey(
        'inventory.MovimientoInventario',
        on_delete=models.PROTECT,
        related_name='capas_fifo_generadas',
    )
    fecha_entrada = models.DateTimeField()
    cantidad_inicial = models.DecimalField(max_digits=18, decimal_places=4)
    cantidad_consumida = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        default=Decimal('0'),
    )
    cantidad_saldo = models.DecimalField(max_digits=18, decimal_places=4)
    costo_unitario = models.DecimalField(max_digits=18, decimal_places=4)
    cerrada = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'capas_costeo_fifo'
        indexes = [
            models.Index(fields=['empresa', 'producto', 'bodega', 'fecha_entrada']),
        ]
        verbose_name = 'capa de costeo FIFO'
        verbose_name_plural = 'capas de costeo FIFO'

    def __str__(self):
        return f'FIFO {self.producto.sku} @ {self.bodega.codigo}'


class ConsumoCapaFifo(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='consumos_capa_fifo',
    )
    movimiento_salida = models.ForeignKey(
        'inventory.MovimientoInventario',
        on_delete=models.PROTECT,
        related_name='consumos_capa_fifo',
    )
    capa_fifo = models.ForeignKey(
        'inventory.CapaCosteoFifo',
        on_delete=models.PROTECT,
        related_name='consumos',
    )
    cantidad_consumida = models.DecimalField(max_digits=18, decimal_places=4)
    costo_unitario = models.DecimalField(max_digits=18, decimal_places=4)
    costo_total = models.DecimalField(max_digits=18, decimal_places=4)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'consumo_capas_fifo'
        verbose_name = 'consumo de capa FIFO'
        verbose_name_plural = 'consumos de capa FIFO'

    def __str__(self):
        return f'Consumo {self.cantidad_consumida} capa {self.capa_fifo_id}'
