from django.db import models


class Categoria(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='categorias',
    )
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True, null=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'categorias'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'codigo'],
                name='uq_categoria_empresa_codigo',
            ),
        ]
        verbose_name = 'categoría'
        verbose_name_plural = 'categorías'

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class Marca(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='marcas',
    )
    codigo = models.CharField(max_length=30, blank=True, null=True)
    nombre = models.CharField(max_length=120)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'marcas'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'nombre'],
                name='uq_marca_empresa_nombre',
            ),
        ]
        verbose_name = 'marca'
        verbose_name_plural = 'marcas'

    def __str__(self):
        return self.nombre


class UnidadMedida(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='unidades_medida',
    )
    codigo = models.CharField(max_length=20)
    nombre = models.CharField(max_length=80)
    abreviacion = models.CharField(max_length=20)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'unidadesmedida'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'codigo'],
                name='uq_um_empresa_codigo',
            ),
        ]
        verbose_name = 'unidad de medida'
        verbose_name_plural = 'unidades de medida'

    def __str__(self):
        return f'{self.codigo} ({self.abreviacion})'


class TipoControlInventario(models.Model):
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=80)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'tiposcontrolinventario'
        verbose_name = 'tipo de control de inventario'
        verbose_name_plural = 'tipos de control de inventario'

    def __str__(self):
        return self.nombre


class EstadoSerie(models.Model):
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=80)
    es_final = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'estadosseries'
        verbose_name = 'estado de serie'
        verbose_name_plural = 'estados de serie'

    def __str__(self):
        return self.nombre


class TipoMovimientoInventario(models.Model):
    NATURALEZA_ENTRADA = 'ENTRADA'
    NATURALEZA_SALIDA = 'SALIDA'
    NATURALEZA_NEUTRO = 'NEUTRO'
    NATURALEZA_CHOICES = [
        (NATURALEZA_ENTRADA, 'Entrada'),
        (NATURALEZA_SALIDA, 'Salida'),
        (NATURALEZA_NEUTRO, 'Neutro'),
    ]

    codigo = models.CharField(max_length=40, unique=True)
    nombre = models.CharField(max_length=100)
    naturaleza = models.CharField(max_length=20, choices=NATURALEZA_CHOICES)
    afecta_stock = models.BooleanField(default=True)
    requiere_aprobacion = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'tiposmovimientoinventario'
        verbose_name = 'tipo de movimiento de inventario'
        verbose_name_plural = 'tipos de movimiento de inventario'

    def __str__(self):
        return self.nombre


class MetodoCosteo(models.Model):
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=80)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'metodos_costeo'
        verbose_name = 'método de costeo'
        verbose_name_plural = 'métodos de costeo'

    def __str__(self):
        return self.nombre


class EstadoDocumento(models.Model):
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=80)
    modulo = models.CharField(max_length=50, blank=True, null=True)
    documento_tipo = models.CharField(
        max_length=40,
        blank=True,
        null=True,
        help_text='Tipo de documento al que aplica (SOLICITUD, TRASLADO, etc.). Vacío = transversal.',
    )
    es_final = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'estados_documento'
        verbose_name = 'estado de documento'
        verbose_name_plural = 'estados de documento'

    def __str__(self):
        return self.nombre
