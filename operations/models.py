from django.db import models


class EstadoHistorialDocumento(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    documento_tipo = models.CharField(max_length=40)
    documento_id = models.CharField(max_length=50)
    estado_anterior = models.CharField(max_length=40, blank=True, null=True)
    estado_nuevo = models.CharField(max_length=40)
    usuario = models.ForeignKey('security.Usuario', on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'estadohistorialdocumento'
        indexes = [
            models.Index(fields=['empresa', 'documento_tipo', 'documento_id']),
        ]
        verbose_name = 'historial de estado de documento'
        verbose_name_plural = 'historial de estados de documento'

    def __str__(self):
        return f'{self.documento_tipo}#{self.documento_id}: {self.estado_anterior} -> {self.estado_nuevo}'


class Solicitud(models.Model):
    TIPO_DOCUMENTO = 'SOLICITUD'

    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    numero = models.CharField(max_length=60)
    centro_costo = models.ForeignKey('core.CentroCosto', on_delete=models.PROTECT)
    estado = models.ForeignKey('catalogs.EstadoDocumento', on_delete=models.PROTECT)
    fecha_solicitud = models.DateField()
    prioridad = models.CharField(max_length=20, blank=True, null=True)
    motivo = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        'security.Usuario',
        on_delete=models.PROTECT,
        related_name='solicitudes_creadas',
    )
    approved_by = models.ForeignKey(
        'security.Usuario',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='solicitudes_aprobadas',
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'solicitudes'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'numero'],
                name='uq_solicitud_empresa_numero',
            ),
        ]
        verbose_name = 'solicitud'
        verbose_name_plural = 'solicitudes'

    def __str__(self):
        return self.numero


class SolicitudDetalle(models.Model):
    solicitud = models.ForeignKey(
        'operations.Solicitud',
        on_delete=models.CASCADE,
        related_name='detalles',
    )
    producto = models.ForeignKey('inventory.Producto', on_delete=models.PROTECT)
    lote = models.ForeignKey(
        'inventory.Lote',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    cantidad_solicitada = models.DecimalField(max_digits=18, decimal_places=4)
    cantidad_aprobada = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        blank=True,
        null=True,
    )
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'solicitudesdetalle'
        verbose_name = 'detalle de solicitud'
        verbose_name_plural = 'detalles de solicitud'


class Entrega(models.Model):
    TIPO_DOCUMENTO = 'ENTREGA'

    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    numero = models.CharField(max_length=60)
    solicitud = models.ForeignKey(
        'operations.Solicitud',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='entregas',
    )
    bodega = models.ForeignKey('core.Bodega', on_delete=models.PROTECT)
    centro_costo = models.ForeignKey('core.CentroCosto', on_delete=models.PROTECT)
    estado = models.ForeignKey('catalogs.EstadoDocumento', on_delete=models.PROTECT)
    fecha_entrega = models.DateField()
    recibido_por = models.CharField(max_length=150, blank=True, null=True)
    observacion = models.TextField(blank=True, null=True)
    es_ad_hoc = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'security.Usuario',
        on_delete=models.PROTECT,
        related_name='entregas_creadas',
    )
    approved_by = models.ForeignKey(
        'security.Usuario',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='entregas_aprobadas',
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'entregas'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'numero'],
                name='uq_entrega_empresa_numero',
            ),
        ]
        verbose_name = 'entrega'
        verbose_name_plural = 'entregas'

    def __str__(self):
        return self.numero


class EntregaDetalle(models.Model):
    entrega = models.ForeignKey(
        'operations.Entrega',
        on_delete=models.CASCADE,
        related_name='detalles',
    )
    producto = models.ForeignKey('inventory.Producto', on_delete=models.PROTECT)
    serie = models.ForeignKey(
        'inventory.Serie',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    lote = models.ForeignKey(
        'inventory.Lote',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    cantidad_entregada = models.DecimalField(max_digits=18, decimal_places=4)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'entregasdetalle'
        verbose_name = 'detalle de entrega'
        verbose_name_plural = 'detalles de entrega'


class Traslado(models.Model):
    TIPO_DOCUMENTO = 'TRASLADO'

    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    numero = models.CharField(max_length=60)
    bodega_origen = models.ForeignKey(
        'core.Bodega',
        on_delete=models.PROTECT,
        related_name='traslados_origen',
    )
    bodega_transito = models.ForeignKey(
        'core.Bodega',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='traslados_transito',
    )
    bodega_destino = models.ForeignKey(
        'core.Bodega',
        on_delete=models.PROTECT,
        related_name='traslados_destino',
    )
    estado = models.ForeignKey('catalogs.EstadoDocumento', on_delete=models.PROTECT)
    fecha_salida = models.DateField(blank=True, null=True)
    fecha_recepcion = models.DateField(blank=True, null=True)
    motivo = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        'security.Usuario',
        on_delete=models.PROTECT,
        related_name='traslados_creados',
    )
    approved_by = models.ForeignKey(
        'security.Usuario',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='traslados_aprobados',
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'traslados'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'numero'],
                name='uq_traslado_empresa_numero',
            ),
        ]
        verbose_name = 'traslado'
        verbose_name_plural = 'traslados'

    def __str__(self):
        return self.numero


class TrasladoDetalle(models.Model):
    traslado = models.ForeignKey(
        'operations.Traslado',
        on_delete=models.CASCADE,
        related_name='detalles',
    )
    producto = models.ForeignKey('inventory.Producto', on_delete=models.PROTECT)
    serie = models.ForeignKey(
        'inventory.Serie',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    lote = models.ForeignKey(
        'inventory.Lote',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    cantidad_trasladada = models.DecimalField(max_digits=18, decimal_places=4)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'trasladosdetalle'
        verbose_name = 'detalle de traslado'
        verbose_name_plural = 'detalles de traslado'


class Compra(models.Model):
    TIPO_DOCUMENTO = 'COMPRA'

    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    numero = models.CharField(max_length=60)
    proveedor = models.ForeignKey('inventory.Proveedor', on_delete=models.PROTECT)
    bodega_destino = models.ForeignKey('core.Bodega', on_delete=models.PROTECT)
    estado = models.ForeignKey('catalogs.EstadoDocumento', on_delete=models.PROTECT)
    fecha_compra = models.DateField()
    observacion = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        'security.Usuario',
        on_delete=models.PROTECT,
        related_name='compras_creadas',
    )
    approved_by = models.ForeignKey(
        'security.Usuario',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='compras_aprobadas',
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'compras'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'numero'],
                name='uq_compra_empresa_numero',
            ),
        ]
        verbose_name = 'compra'
        verbose_name_plural = 'compras'

    def __str__(self):
        return self.numero


class CompraDetalle(models.Model):
    compra = models.ForeignKey(
        'operations.Compra',
        on_delete=models.CASCADE,
        related_name='detalles',
    )
    producto = models.ForeignKey('inventory.Producto', on_delete=models.PROTECT)
    lote = models.ForeignKey(
        'inventory.Lote',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    numero_serie = models.CharField(max_length=120, blank=True, null=True)
    cantidad = models.DecimalField(max_digits=18, decimal_places=4)
    costo_unitario = models.DecimalField(max_digits=18, decimal_places=4)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'comprasdetalle'
        verbose_name = 'detalle de compra'
        verbose_name_plural = 'detalles de compra'


class AjusteInventario(models.Model):
    TIPO_DOCUMENTO = 'AJUSTE'

    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    numero = models.CharField(max_length=60)
    bodega = models.ForeignKey('core.Bodega', on_delete=models.PROTECT)
    estado = models.ForeignKey('catalogs.EstadoDocumento', on_delete=models.PROTECT)
    fecha_ajuste = models.DateField()
    motivo = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        'security.Usuario',
        on_delete=models.PROTECT,
        related_name='ajustes_creados',
    )
    approved_by = models.ForeignKey(
        'security.Usuario',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='ajustes_aprobados',
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ajustesinventario'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'numero'],
                name='uq_ajuste_empresa_numero',
            ),
        ]
        verbose_name = 'ajuste de inventario'
        verbose_name_plural = 'ajustes de inventario'

    def __str__(self):
        return self.numero


class AjusteInventarioDetalle(models.Model):
    ajuste = models.ForeignKey(
        'operations.AjusteInventario',
        on_delete=models.CASCADE,
        related_name='detalles',
    )
    producto = models.ForeignKey('inventory.Producto', on_delete=models.PROTECT)
    serie = models.ForeignKey(
        'inventory.Serie',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    lote = models.ForeignKey(
        'inventory.Lote',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    cantidad_sistema = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    cantidad_contada = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'ajustesinventariodetalle'
        verbose_name = 'detalle de ajuste'
        verbose_name_plural = 'detalles de ajuste'

    @property
    def diferencia(self):
        return self.cantidad_contada - self.cantidad_sistema
