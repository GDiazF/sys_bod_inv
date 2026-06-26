from django.db import models


class Empresa(models.Model):
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=150)
    rut = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'empresas'
        indexes = [models.Index(fields=['codigo'])]
        verbose_name = 'empresa'
        verbose_name_plural = 'empresas'

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class Sucursal(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='sucursales',
    )
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=120)
    direccion = models.CharField(max_length=250, blank=True, null=True)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sucursales'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'codigo'],
                name='uq_sucursal_empresa_codigo',
            ),
        ]
        indexes = [models.Index(fields=['empresa', 'codigo'])]
        verbose_name = 'sucursal'
        verbose_name_plural = 'sucursales'

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class Bodega(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='bodegas',
    )
    sucursal = models.ForeignKey(
        'core.Sucursal',
        on_delete=models.PROTECT,
        related_name='bodegas',
        blank=True,
        null=True,
    )
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=120)
    direccion = models.CharField(max_length=250, blank=True, null=True)
    es_principal = models.BooleanField(default=False)
    es_transito = models.BooleanField(default=False)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bodegas'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'codigo'],
                name='uq_bodega_empresa_codigo',
            ),
        ]
        indexes = [models.Index(fields=['empresa', 'codigo'])]
        verbose_name = 'bodega'
        verbose_name_plural = 'bodegas'

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class CentroCosto(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='centroscosto',
    )
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=50, blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'centroscosto'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'codigo'],
                name='uq_cc_empresa_codigo',
            ),
        ]
        indexes = [models.Index(fields=['empresa', 'codigo'])]
        verbose_name = 'centro de costo'
        verbose_name_plural = 'centros de costo'

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class ParametroEmpresa(models.Model):
    empresa = models.OneToOneField(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='parametros',
    )
    metodo_costeo = models.ForeignKey(
        'catalogs.MetodoCosteo',
        on_delete=models.PROTECT,
        related_name='parametros_empresa',
        null=True,
        blank=True,
    )
    stock_negativo_permitido = models.BooleanField(default=False)
    aprobacion_salida_requerida = models.BooleanField(default=True)
    permite_cambio_metodo_costeo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'parametrosempresa'
        verbose_name = 'parámetro de empresa'
        verbose_name_plural = 'parámetros de empresa'

    def __str__(self):
        return f'Parámetros {self.empresa.codigo}'
