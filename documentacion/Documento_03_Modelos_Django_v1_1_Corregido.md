Documento 03
Modelos Django
Sistema de Bodega e Inventario
Versión 1.1 Corregida

| Campo | Valor |
| --- | --- |
| Documento | Documento 03 - Modelos Django |
| Versión | 1.1 Corregida |
| Base | Documento 02 corregido |
| Propósito | Archivo de modelos Django que refleja la base de datos PostgreSQL |
| Fecha | 2026-06-26 |

Este archivo ajusta los modelos Django para alinearlos con el Documento 02 corregido y con las decisiones técnicas que ya quedaron cerradas.

| Cambio aplicado | Motivo |
| --- | --- |
| Usuario pasa a custom user model | Compatibilidad con Django auth y login por email. |
| FK entre apps referenciadas como strings | Evitar imports circulares. |
| db_table con guion bajo donde aplique | Consistencia con SQL físico. |
| series.estado pasa a estado_serie | Evitar texto libre y alinear con catálogo. |
| costeo soporta PROMEDIO_PONDERADO y FIFO | Consistencia con Documento 02. |


# core/models.py

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

class Sucursal(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='sucursales')
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=120)
    direccion = models.CharField(max_length=250, blank=True, null=True)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sucursales'
        constraints = [models.UniqueConstraint(fields=['empresa', 'codigo'], name='uq_sucursal_empresa_codigo')]

class Bodega(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='bodegas')
    sucursal = models.ForeignKey('core.Sucursal', on_delete=models.PROTECT, related_name='bodegas', blank=True, null=True)
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
        constraints = [models.UniqueConstraint(fields=['empresa', 'codigo'], name='uq_bodega_empresa_codigo')]

class CentroCosto(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='centroscosto')
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=50, blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'centroscosto'
        constraints = [models.UniqueConstraint(fields=['empresa', 'codigo'], name='uq_cc_empresa_codigo')]

class ParametroEmpresa(models.Model):
    empresa = models.OneToOneField('core.Empresa', on_delete=models.PROTECT, related_name='parametros')
    metodo_costeo = models.CharField(max_length=30)
    stock_negativo_permitido = models.BooleanField(default=False)
    aprobacion_salida_requerida = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'parametrosempresa'

# catalogs/models.py

from django.db import models

class Categoria(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='categorias')
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True, null=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'categorias'
        constraints = [models.UniqueConstraint(fields=['empresa', 'codigo'], name='uq_categoria_empresa_codigo')]

class Marca(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='marcas')
    codigo = models.CharField(max_length=30, blank=True, null=True)
    nombre = models.CharField(max_length=120)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'marcas'
        constraints = [models.UniqueConstraint(fields=['empresa', 'nombre'], name='uq_marca_empresa_nombre')]

class UnidadMedida(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='unidades_medida')
    codigo = models.CharField(max_length=20)
    nombre = models.CharField(max_length=80)
    abreviacion = models.CharField(max_length=20)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'unidadesmedida'
        constraints = [models.UniqueConstraint(fields=['empresa', 'codigo'], name='uq_um_empresa_codigo')]

class TipoControlInventario(models.Model):
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=80)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'tiposcontrolinventario'

class EstadoSerie(models.Model):
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=80)
    es_final = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'estadosseries'

class TipoMovimientoInventario(models.Model):
    codigo = models.CharField(max_length=40, unique=True)
    nombre = models.CharField(max_length=100)
    naturaleza = models.CharField(max_length=20)
    requiere_aprobacion = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'tiposmovimientoinventario'

# security/models.py

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='usuarios')
    email = models.EmailField(max_length=150, unique=True)
    nombre_completo = models.CharField(max_length=150)
    activo = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    ultimo_acceso_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UsuarioManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre_completo']

    class Meta:
        db_table = 'usuarios'

class Rol(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='roles')
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'roles'
        constraints = [models.UniqueConstraint(fields=['empresa', 'codigo'], name='uq_rol_empresa_codigo')]

class Permiso(models.Model):
    codigo = models.CharField(max_length=60, unique=True)
    nombre = models.CharField(max_length=120)
    modulo = models.CharField(max_length=50, blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'permisos'

class UsuarioRol(models.Model):
    usuario = models.ForeignKey('security.Usuario', on_delete=models.PROTECT)
    rol = models.ForeignKey('security.Rol', on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuarioroles'
        constraints = [models.UniqueConstraint(fields=['usuario', 'rol'], name='uq_usuario_rol')]

class RolPermiso(models.Model):
    rol = models.ForeignKey('security.Rol', on_delete=models.PROTECT)
    permiso = models.ForeignKey('security.Permiso', on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rolpermisos'
        constraints = [models.UniqueConstraint(fields=['rol', 'permiso'], name='uq_rol_permiso')]

# inventory/models.py

from django.db import models

class MetodoCosteo(models.Model):
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=80)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'metodos_costeo'

class EstadoDocumento(models.Model):
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=80)
    modulo = models.CharField(max_length=50, blank=True, null=True)
    es_final = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'estados_documento'

class Proveedor(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='proveedores')
    rut = models.CharField(max_length=20, blank=True, null=True)
    razon_social = models.CharField(max_length=180)
    nombre_contacto = models.CharField(max_length=120, blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    correo = models.CharField(max_length=150, blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'proveedores'

class Producto(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='productos')
    sku = models.CharField(max_length=50)
    nombre = models.CharField(max_length=180)
    descripcion = models.TextField(blank=True, null=True)
    categoria = models.ForeignKey('catalogs.Categoria', on_delete=models.PROTECT, blank=True, null=True)
    marca = models.ForeignKey('catalogs.Marca', on_delete=models.PROTECT, blank=True, null=True)
    unidad_medida = models.ForeignKey('catalogs.UnidadMedida', on_delete=models.PROTECT, related_name='productos_base')
    unidad_compra = models.ForeignKey('catalogs.UnidadMedida', on_delete=models.PROTECT, related_name='productos_compra', blank=True, null=True)
    tipo_control_inventario = models.ForeignKey('catalogs.TipoControlInventario', on_delete=models.PROTECT)
    maneja_stock = models.BooleanField(default=True)
    permite_stock_negativo = models.BooleanField(default=False)
    requiere_aprobacion_salida = models.BooleanField(default=False)
    costo_promedio_actual = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    factor_conversion = models.DecimalField(max_digits=18, decimal_places=6, default=1)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'productos'
        constraints = [models.UniqueConstraint(fields=['empresa', 'sku'], name='uq_producto_empresa_sku')]

class EstadoSerie(models.Model):
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=80)
    es_final = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'estadosseries'

class Serie(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='series')
    producto = models.ForeignKey('inventory.Producto', on_delete=models.PROTECT, related_name='series')
    numero_serie = models.CharField(max_length=120)
    estado_serie = models.ForeignKey('inventory.EstadoSerie', on_delete=models.PROTECT)
    bodega_actual = models.ForeignKey('core.Bodega', on_delete=models.PROTECT, blank=True, null=True, related_name='series')
    centro_costo_actual = models.ForeignKey('core.CentroCosto', on_delete=models.PROTECT, blank=True, null=True, related_name='series')
    fecha_alta = models.DateField(blank=True, null=True)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'series'
        constraints = [models.UniqueConstraint(fields=['empresa', 'numero_serie'], name='uq_serie_empresa_numero')]

class Lote(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='lotes')
    producto = models.ForeignKey('inventory.Producto', on_delete=models.PROTECT, related_name='lotes')
    codigo_lote = models.CharField(max_length=120)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    fecha_fabricacion = models.DateField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'lotes'
        constraints = [models.UniqueConstraint(fields=['empresa', 'producto', 'codigo_lote'], name='uq_lote_producto_codigo')]

class MovimientoInventario(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    tipo_movimiento = models.ForeignKey('inventory.TipoMovimientoInventario', on_delete=models.PROTECT)
    estado = models.ForeignKey('inventory.EstadoDocumento', on_delete=models.PROTECT)
    metodo_costeo = models.ForeignKey('inventory.MetodoCosteo', on_delete=models.PROTECT, blank=True, null=True)
    compra = models.ForeignKey('operations.Compra', on_delete=models.PROTECT, blank=True, null=True)
    solicitud = models.ForeignKey('operations.Solicitud', on_delete=models.PROTECT, blank=True, null=True)
    entrega = models.ForeignKey('operations.Entrega', on_delete=models.PROTECT, blank=True, null=True)
    traslado = models.ForeignKey('operations.Traslado', on_delete=models.PROTECT, blank=True, null=True)
    bodega_origen = models.ForeignKey('core.Bodega', on_delete=models.PROTECT, blank=True, null=True, related_name='movimientos_origen')
    bodega_destino = models.ForeignKey('core.Bodega', on_delete=models.PROTECT, blank=True, null=True, related_name='movimientos_destino')
    centro_costo = models.ForeignKey('core.CentroCosto', on_delete=models.PROTECT, blank=True, null=True)
    producto = models.ForeignKey('inventory.Producto', on_delete=models.PROTECT)
    lote = models.ForeignKey('inventory.Lote', on_delete=models.PROTECT, blank=True, null=True)
    serie = models.ForeignKey('inventory.Serie', on_delete=models.PROTECT, blank=True, null=True)
    cantidad = models.DecimalField(max_digits=18, decimal_places=4)
    costo_unitario = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    costo_total = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    fecha_movimiento = models.DateTimeField(auto_now_add=True)
    anulado = models.BooleanField(default=False)
    movimiento_origen = models.ForeignKey('self', on_delete=models.PROTECT, blank=True, null=True, related_name='reversas')
    observacion = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey('security.Usuario', on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'movimientosinventario'

class StockActual(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    bodega = models.ForeignKey('core.Bodega', on_delete=models.PROTECT)
    producto = models.ForeignKey('inventory.Producto', on_delete=models.PROTECT)
    lote = models.ForeignKey('inventory.Lote', on_delete=models.PROTECT, blank=True, null=True)
    cantidad = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    costo_promedio = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stockactual'
        constraints = [models.UniqueConstraint(fields=['empresa', 'bodega', 'producto', 'lote'], name='uq_stock_unico')]

# operations/models.py

from django.db import models

class Solicitud(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    centro_costo = models.ForeignKey('core.CentroCosto', on_delete=models.PROTECT)
    estado = models.ForeignKey('inventory.EstadoDocumento', on_delete=models.PROTECT)
    metodo_costeo = models.ForeignKey('inventory.MetodoCosteo', on_delete=models.PROTECT, blank=True, null=True)
    numero_solicitud = models.CharField(max_length=60, blank=True, null=True)
    fecha_solicitud = models.DateField()
    prioridad = models.CharField(max_length=20, blank=True, null=True)
    motivo = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey('security.Usuario', on_delete=models.PROTECT, related_name='solicitudes_creadas')
    approved_by = models.ForeignKey('security.Usuario', on_delete=models.PROTECT, blank=True, null=True, related_name='solicitudes_aprobadas')
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'solicitudes'

class SolicitudDetalle(models.Model):
    solicitud = models.ForeignKey('operations.Solicitud', on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey('inventory.Producto', on_delete=models.PROTECT)
    lote = models.ForeignKey('inventory.Lote', on_delete=models.PROTECT, blank=True, null=True)
    cantidad_solicitada = models.DecimalField(max_digits=18, decimal_places=4)
    cantidad_aprobada = models.DecimalField(max_digits=18, decimal_places=4, blank=True, null=True)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'solicitudesdetalle'

class Entrega(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    solicitud = models.ForeignKey('operations.Solicitud', on_delete=models.PROTECT, blank=True, null=True)
    bodega = models.ForeignKey('core.Bodega', on_delete=models.PROTECT)
    centro_costo = models.ForeignKey('core.CentroCosto', on_delete=models.PROTECT)
    estado = models.ForeignKey('inventory.EstadoDocumento', on_delete=models.PROTECT)
    metodo_costeo = models.ForeignKey('inventory.MetodoCosteo', on_delete=models.PROTECT, blank=True, null=True)
    numero_entrega = models.CharField(max_length=60, blank=True, null=True)
    fecha_entrega = models.DateField()
    recibido_por = models.CharField(max_length=150, blank=True, null=True)
    observacion = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey('security.Usuario', on_delete=models.PROTECT, related_name='entregas_creadas')
    approved_by = models.ForeignKey('security.Usuario', on_delete=models.PROTECT, blank=True, null=True, related_name='entregas_aprobadas')
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'entregas'

class EntregaDetalle(models.Model):
    entrega = models.ForeignKey('operations.Entrega', on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey('inventory.Producto', on_delete=models.PROTECT)
    lote = models.ForeignKey('inventory.Lote', on_delete=models.PROTECT, blank=True, null=True)
    serie = models.ForeignKey('inventory.Serie', on_delete=models.PROTECT, blank=True, null=True)
    cantidad_entregada = models.DecimalField(max_digits=18, decimal_places=4)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'entregasdetalle'

class Traslado(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    bodega_origen = models.ForeignKey('core.Bodega', on_delete=models.PROTECT, related_name='traslados_origen')
    bodega_transito = models.ForeignKey('core.Bodega', on_delete=models.PROTECT, blank=True, null=True, related_name='traslados_transito')
    bodega_destino = models.ForeignKey('core.Bodega', on_delete=models.PROTECT, related_name='traslados_destino')
    estado = models.ForeignKey('inventory.EstadoDocumento', on_delete=models.PROTECT)
    metodo_costeo = models.ForeignKey('inventory.MetodoCosteo', on_delete=models.PROTECT, blank=True, null=True)
    numero_traslado = models.CharField(max_length=60, blank=True, null=True)
    fecha_salida = models.DateField(blank=True, null=True)
    fecha_recepcion = models.DateField(blank=True, null=True)
    motivo = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey('security.Usuario', on_delete=models.PROTECT, related_name='traslados_creados')
    approved_by = models.ForeignKey('security.Usuario', on_delete=models.PROTECT, blank=True, null=True, related_name='traslados_aprobados')
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'traslados'

class TrasladoDetalle(models.Model):
    traslado = models.ForeignKey('operations.Traslado', on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey('inventory.Producto', on_delete=models.PROTECT)
    lote = models.ForeignKey('inventory.Lote', on_delete=models.PROTECT, blank=True, null=True)
    serie = models.ForeignKey('inventory.Serie', on_delete=models.PROTECT, blank=True, null=True)
    cantidad_trasladada = models.DecimalField(max_digits=18, decimal_places=4)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'trasladosdetalle'

# support/models.py

from django.db import models

class UbicacionBodega(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    bodega = models.ForeignKey('core.Bodega', on_delete=models.PROTECT)
    codigo = models.CharField(max_length=60)
    nombre = models.CharField(max_length=120)
    ubicacion_padre = models.ForeignKey('self', on_delete=models.PROTECT, blank=True, null=True)
    tipo = models.CharField(max_length=40, blank=True, null=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'ubicaciones_bodega'
        constraints = [models.UniqueConstraint(fields=['bodega', 'codigo'], name='uq_ubicacion_bodega_codigo')]

class Custodio(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    codigo = models.CharField(max_length=30, blank=True, null=True)
    nombre_completo = models.CharField(max_length=150)
    documento_identidad = models.CharField(max_length=50, blank=True, null=True)
    correo = models.EmailField(max_length=150, blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'custodios'

class Numerador(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    tipo_documento = models.CharField(max_length=40)
    prefijo = models.CharField(max_length=20, blank=True, null=True)
    ultimo_numero = models.BigIntegerField(default=0)
    longitud = models.IntegerField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'numeradores'
        constraints = [models.UniqueConstraint(fields=['empresa', 'tipo_documento'], name='uq_numerador_empresa_tipo')]

class Adjunto(models.Model):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    modulo = models.CharField(max_length=50)
    documento_id = models.CharField(max_length=50)
    nombre_archivo = models.CharField(max_length=255)
    ruta_archivo = models.CharField(max_length=500)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    subido_por = models.ForeignKey('security.Usuario', on_delete=models.PROTECT, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'adjuntos'

| Nota final | Detalle |
| --- | --- |
| Importaciones cruzadas | Todas las relaciones entre apps se dejaron como strings. |
| Usuario | Se corrigió a custom user model. |
| Tabla física | Se ajustaron nombres como ubicaciones_bodega y movimientosinventario. |
| Costeo | Se añadió el soporte de FIFO y promedio ponderado a nivel de documento. |
