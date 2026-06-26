from django.core.exceptions import ValidationError
from django.db import models


class UbicacionBodega(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='ubicaciones_bodega',
    )
    bodega = models.ForeignKey(
        'core.Bodega',
        on_delete=models.PROTECT,
        related_name='ubicaciones',
    )
    codigo = models.CharField(max_length=60)
    nombre = models.CharField(max_length=120)
    ubicacion_padre = models.ForeignKey(
        'self',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='ubicaciones_hijas',
    )
    tipo = models.CharField(max_length=40, blank=True, null=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'ubicaciones_bodega'
        constraints = [
            models.UniqueConstraint(
                fields=['bodega', 'codigo'],
                name='uq_ubicacion_bodega_codigo',
            ),
        ]
        verbose_name = 'ubicación de bodega'
        verbose_name_plural = 'ubicaciones de bodega'

    def __str__(self):
        return f'{self.bodega.codigo}/{self.codigo}'

    def clean(self):
        super().clean()
        if self.ubicacion_padre_id and self.pk and self.ubicacion_padre_id == self.pk:
            raise ValidationError({'ubicacion_padre': 'Una ubicación no puede ser padre de sí misma.'})
        if self.ubicacion_padre_id and self.bodega_id:
            if self.ubicacion_padre.bodega_id != self.bodega_id:
                raise ValidationError(
                    {'ubicacion_padre': 'La ubicación padre debe pertenecer a la misma bodega.'}
                )
        if self.empresa_id and self.bodega_id and self.bodega.empresa_id != self.empresa_id:
            raise ValidationError({'bodega': 'La bodega debe pertenecer a la misma empresa.'})


class Custodio(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='custodios',
    )
    codigo = models.CharField(max_length=30, blank=True, null=True)
    nombre_completo = models.CharField(max_length=150)
    documento_identidad = models.CharField(max_length=50, blank=True, null=True)
    correo = models.EmailField(max_length=150, blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'custodios'
        verbose_name = 'custodio'
        verbose_name_plural = 'custodios'

    def __str__(self):
        return self.nombre_completo


class Numerador(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='numeradores',
    )
    tipo_documento = models.CharField(max_length=40)
    prefijo = models.CharField(max_length=20, blank=True, null=True)
    ultimo_numero = models.BigIntegerField(default=0)
    longitud = models.IntegerField(blank=True, null=True, default=6)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'numeradores'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'tipo_documento'],
                name='uq_numerador_empresa_tipo',
            ),
        ]
        verbose_name = 'numerador'
        verbose_name_plural = 'numeradores'

    def __str__(self):
        prefijo = self.prefijo or ''
        return f'{self.empresa.codigo}/{self.tipo_documento} ({prefijo})'


class Adjunto(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='adjuntos',
    )
    modulo = models.CharField(max_length=50)
    documento_id = models.CharField(max_length=50)
    nombre_archivo = models.CharField(max_length=255)
    ruta_archivo = models.CharField(max_length=500)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    subido_por = models.ForeignKey(
        'security.Usuario',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='adjuntos_subidos',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'adjuntos'
        indexes = [
            models.Index(fields=['empresa', 'modulo', 'documento_id']),
        ]
        verbose_name = 'adjunto'
        verbose_name_plural = 'adjuntos'

    def __str__(self):
        return self.nombre_archivo
