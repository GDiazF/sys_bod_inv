Documento 06
Modelos Django completos por app
Versión para implementación

| Archivo | Formato |
| --- | --- |
| output/Documento_06_Modelos_Django_Completos.md | Markdown |
| Documento_06_Modelos_Django_Completos.docx | Word |


# core

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

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'

class Sucursal(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='sucursales')
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=120)
    direccion = models.CharField(max_length=250, blank=True, null=True)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sucursales'
        constraints = [models.UniqueConstraint(fields=['empresa', 'codigo'], name='uq_sucursal_empresa_codigo')]
        indexes = [models.Index(fields=['empresa', 'codigo'])]

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'

class Bodega(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='bodegas')
    sucursal = models.ForeignKey(Sucursal, on_delete=models.PROTECT, related_name='bodegas', blank=True, null=True)
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
        indexes = [models.Index(fields=['empresa', 'codigo'])]

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'

class CentroCosto(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='centroscosto')
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=50, blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'centroscosto'
        constraints = [models.UniqueConstraint(fields=['empresa', 'codigo'], name='uq_cc_empresa_codigo')]
        indexes = [models.Index(fields=['empresa', 'codigo'])]

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'

class ParametroEmpresa(models.Model):
    METODO_COSTEO_CHOICES = [('PROMEDIOPONDERADO', 'Promedio ponderado')]
    empresa = models.OneToOneField(Empresa, on_delete=models.PROTECT, related_name='parametros')
    metodo_costeo = models.CharField(max_length=30, choices=METODO_COSTEO_CHOICES, default='PROMEDIOPONDERADO')
    stock_negativo_permitido = models.BooleanField(default=False)
    aprobacion_salida_requerida = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'parametrosempresa'

# security

from django.db import models
from core.models import Empresa

class Usuario(AbstractBaseUser, PermissionsMixin):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='usuarios')
    email = models.EmailField(max_length=150)
    password_hash = models.CharField(max_length=255)
    nombre_completo = models.CharField(max_length=150)
    activo = models.BooleanField(default=True)
    ultimo_acceso_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'usuarios'
        constraints = [models.UniqueConstraint(fields=['empresa', 'email'], name='uq_usuario_empresa_email')]

class Rol(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='roles')
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
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT)
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuario_roles'
        constraints = [models.UniqueConstraint(fields=['usuario', 'rol'], name='uq_usuario_rol')]

class RolPermiso(models.Model):
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT)
    permiso = models.ForeignKey(Permiso, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rol_permisos'
        constraints = [models.UniqueConstraint(fields=['rol', 'permiso'], name='uq_rol_permiso')]

# catalogs

from django.db import models
from core.models import Empresa

class Categoria(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='categorias')
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True, null=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'categorias'
        constraints = [models.UniqueConstraint(fields=['empresa', 'codigo'], name='uq_categoria_empresa_codigo')]

class Marca(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='marcas')
    codigo = models.CharField(max_length=30, blank=True, null=True)
    nombre = models.CharField(max_length=120)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'marcas'
        constraints = [models.UniqueConstraint(fields=['empresa', 'nombre'], name='uq_marca_empresa_nombre')]

class UnidadMedida(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='unidades_medida')
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
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=80)
    signo = models.SmallIntegerField()
    afecta_stock = models.BooleanField(default=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'tiposmovimientoinventario'

# inventory

from django.db import models
from core.models import Empresa, Bodega, CentroCosto
from catalogs.models import Categoria, Marca, UnidadMedida, TipoControlInventario, EstadoSerie, TipoMovimientoInventario
from security.models import Usuario

class Producto(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='productos')
    sku = models.CharField(max_length=50)
    nombre = models.CharField(max_length=180)
    descripcion = models.TextField(blank=True, null=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, blank=True, null=True)
    marca = models.ForeignKey(Marca, on_delete=models.PROTECT, blank=True, null=True)
    unidad_medida = models.ForeignKey(UnidadMedida, on_delete=models.PROTECT, related_name='productos_base')
    unidad_compra = models.ForeignKey(UnidadMedida, on_delete=models.PROTECT, related_name='productos_compra', blank=True, null=True)
    factor_conversion = models.DecimalField(max_digits=18, decimal_places=6, default=1)
    tipo_control_inventario = models.ForeignKey(TipoControlInventario, on_delete=models.PROTECT)
    maneja_stock = models.BooleanField(default=True)
    permite_stock_negativo = models.BooleanField(default=False)
    requiere_aprobacion_salida = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'productos'
        constraints = [models.UniqueConstraint(fields=['empresa', 'sku'], name='uq_producto_empresa_sku')]
        indexes = [models.Index(fields=['empresa', 'sku'])]

class Custodio(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    codigo = models.CharField(max_length=30, blank=True, null=True)
    nombre_completo = models.CharField(max_length=150)
    documento_identidad = models.CharField(max_length=50, blank=True, null=True)
    correo = models.EmailField(max_length=150, blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'custodios'

class UbicacionBodega(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    bodega = models.ForeignKey(Bodega, on_delete=models.PROTECT)
    codigo = models.CharField(max_length=60)
    nombre = models.CharField(max_length=120)
    ubicacion_padre = models.ForeignKey('self', on_delete=models.PROTECT, blank=True, null=True)
    tipo = models.CharField(max_length=40, blank=True, null=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'ubicaciones_bodega'
        constraints = [models.UniqueConstraint(fields=['bodega', 'codigo'], name='uq_ubicacion_bodega_codigo')]

class Serie(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    numero_serie = models.CharField(max_length=120)
    estado_serie = models.ForeignKey(EstadoSerie, on_delete=models.PROTECT)
    bodega_actual = models.ForeignKey(Bodega, on_delete=models.PROTECT, blank=True, null=True)
    centro_costo_actual = models.ForeignKey(CentroCosto, on_delete=models.PROTECT, blank=True, null=True)
    ubicacion_bodega = models.ForeignKey(UbicacionBodega, on_delete=models.PROTECT, blank=True, null=True)
    custodio = models.ForeignKey(Custodio, on_delete=models.PROTECT, blank=True, null=True)
    fecha_alta = models.DateField(blank=True, null=True)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'series'
        constraints = [models.UniqueConstraint(fields=['empresa', 'numero_serie'], name='uq_serie_empresa_numero')]

class Lote(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    codigo_lote = models.CharField(max_length=80)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    bodega_actual = models.ForeignKey(Bodega, on_delete=models.PROTECT, blank=True, null=True)
    cantidad_actual = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'lotes'
        constraints = [models.UniqueConstraint(fields=['empresa', 'producto', 'codigo_lote'], name='uq_lote_producto_codigo')]

class StockActual(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    bodega = models.ForeignKey(Bodega, on_delete=models.PROTECT)
    lote = models.ForeignKey(Lote, on_delete=models.PROTECT, blank=True, null=True)
    cantidad = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    actualizado_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stock_actual'
        constraints = [models.UniqueConstraint(fields=['empresa', 'producto', 'bodega', 'lote'], name='uq_stock_unico')]

class MovimientoInventario(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    tipo_movimiento = models.ForeignKey(TipoMovimientoInventario, on_delete=models.PROTECT)
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    serie = models.ForeignKey(Serie, on_delete=models.PROTECT, blank=True, null=True)
    lote = models.ForeignKey(Lote, on_delete=models.PROTECT, blank=True, null=True)
    bodega_origen = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='movimientos_origen', blank=True, null=True)
    bodega_destino = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='movimientos_destino', blank=True, null=True)
    centro_costo = models.ForeignKey(CentroCosto, on_delete=models.PROTECT, blank=True, null=True)
    ubicacion_bodega = models.ForeignKey(UbicacionBodega, on_delete=models.PROTECT, blank=True, null=True)
    cantidad = models.DecimalField(max_digits=18, decimal_places=6)
    costo_unitario = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    referencia_tipo = models.CharField(max_length=50, blank=True, null=True)
    referencia_id = models.CharField(max_length=50, blank=True, null=True)
    anulado = models.BooleanField(default=False)
    movimiento_reversa_de = models.ForeignKey('self', on_delete=models.PROTECT, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'movimientos_inventario'
        indexes = [models.Index(fields=['empresa', 'producto', 'created_at'])]

# operations

from django.db import models
from core.models import Empresa, Bodega, CentroCosto
from security.models import Usuario
from inventory.models import Producto, Serie, Lote

class Solicitud(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    numero = models.CharField(max_length=40)
    centro_costo = models.ForeignKey(CentroCosto, on_delete=models.PROTECT)
    solicitante = models.ForeignKey(Usuario, on_delete=models.PROTECT)
    estado = models.CharField(max_length=40)
    observacion = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'solicitudes'
        constraints = [models.UniqueConstraint(fields=['empresa', 'numero'], name='uq_solicitud_empresa_numero')]

class SolicitudDetalle(models.Model):
    solicitud = models.ForeignKey(Solicitud, on_delete=models.PROTECT, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    serie = models.ForeignKey(Serie, on_delete=models.PROTECT, blank=True, null=True)
    lote = models.ForeignKey(Lote, on_delete=models.PROTECT, blank=True, null=True)
    cantidad = models.DecimalField(max_digits=18, decimal_places=6)
    precio_referencia = models.DecimalField(max_digits=18, decimal_places=6, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'solicitudesdetalle'

class Entrega(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    numero = models.CharField(max_length=40)
    solicitud = models.ForeignKey(Solicitud, on_delete=models.PROTECT, blank=True, null=True)
    bodega_origen = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='entregas_origen')
    bodega_destino = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='entregas_destino', blank=True, null=True)
    estado = models.CharField(max_length=40)
    observacion = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'entregas'
        constraints = [models.UniqueConstraint(fields=['empresa', 'numero'], name='uq_entrega_empresa_numero')]

class EntregaDetalle(models.Model):
    entrega = models.ForeignKey(Entrega, on_delete=models.PROTECT, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    serie = models.ForeignKey(Serie, on_delete=models.PROTECT, blank=True, null=True)
    lote = models.ForeignKey(Lote, on_delete=models.PROTECT, blank=True, null=True)
    cantidad = models.DecimalField(max_digits=18, decimal_places=6)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'entregasdetalle'

class Traslado(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    numero = models.CharField(max_length=40)
    bodega_origen = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='traslados_origen')
    bodega_destino = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='traslados_destino')
    estado = models.CharField(max_length=40)
    observacion = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'traslados'
        constraints = [models.UniqueConstraint(fields=['empresa', 'numero'], name='uq_traslado_empresa_numero')]

class TrasladoDetalle(models.Model):
    traslado = models.ForeignKey(Traslado, on_delete=models.PROTECT, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    serie = models.ForeignKey(Serie, on_delete=models.PROTECT, blank=True, null=True)
    lote = models.ForeignKey(Lote, on_delete=models.PROTECT, blank=True, null=True)
    cantidad = models.DecimalField(max_digits=18, decimal_places=6)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'trasladosdetalle'

class EstadoHistorialDocumento(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    documento_tipo = models.CharField(max_length=40)
    documento_id = models.CharField(max_length=50)
    estado_anterior = models.CharField(max_length=40, blank=True, null=True)
    estado_nuevo = models.CharField(max_length=40)
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'estadohistorialdocumento'

# support

from django.db import models
from core.models import Empresa, Bodega
from security.models import Usuario

class UbicacionBodega(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    bodega = models.ForeignKey(Bodega, on_delete=models.PROTECT)
    codigo = models.CharField(max_length=60)
    nombre = models.CharField(max_length=120)
    ubicacion_padre = models.ForeignKey('self', on_delete=models.PROTECT, blank=True, null=True)
    tipo = models.CharField(max_length=40, blank=True, null=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'ubicaciones_bodega'
        constraints = [models.UniqueConstraint(fields=['bodega', 'codigo'], name='uq_ubicacion_bodega_codigo')]

class Numerador(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    tipo_documento = models.CharField(max_length=40)
    prefijo = models.CharField(max_length=20, blank=True, null=True)
    ultimo_numero = models.BigIntegerField(default=0)
    longitud = models.IntegerField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'numeradores'
        constraints = [models.UniqueConstraint(fields=['empresa', 'tipo_documento'], name='uq_numerador_empresa_tipo')]

class Adjunto(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT)
    modulo = models.CharField(max_length=50)
    documento_id = models.CharField(max_length=50)
    nombre_archivo = models.CharField(max_length=255)
    ruta_archivo = models.CharField(max_length=500)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    subido_por = models.ForeignKey(Usuario, on_delete=models.PROTECT, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'adjuntos'
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
# Nota: agregar AUTH_USER_MODEL = 'security.Usuario' en settings.py
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
# Nota: agregar AUTH_USER_MODEL = 'security.Usuario' en settings.py
# En UbicacionBodega, validar que ubicacion_padre_id != self.id en clean() o serializer