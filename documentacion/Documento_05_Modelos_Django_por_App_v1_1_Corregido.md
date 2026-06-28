Documento 05
Modelos Django por App
Sistema de Bodega e Inventario

| Campo | Valor |
| --- | --- |
| Documento | Documento 05 - Modelos Django por App |
| Base | Documento 02 Modelo Completo de Base de Datos |
| Estado | Borrador técnico inicial |
| Fecha | 2026-06-26 |


# core


| Modelo | Campos principales |
| --- | --- |
| Empresa | codigo, nombre, rut, activo, created_at, updated_at |
| Sucursal | empresa, codigo, nombre, direccion, activa, created_at, updated_at |
| Bodega | empresa, sucursal, codigo, nombre, direccion, es_principal, es_transito, activa, created_at, updated_at |
| CentroCosto | empresa, codigo, nombre, tipo, activo, created_at, updated_at |
| ParametroEmpresa | empresa, metodo_costeo, stock_negativo_permitido, aprobacion_salida_requerida, created_at, updated_at |


# security


| Modelo | Campos principales |
| --- | --- |
| Usuario | empresa, email, password_hash, nombre_completo, activo, ultimo_acceso_at, created_at, updated_at |
| Rol | empresa, codigo, nombre, descripcion, activo |
| Permiso | codigo, nombre, modulo, descripcion, activo |
| UsuarioRol | usuario, rol, created_at |
| RolPermiso | rol, permiso, created_at |


# catalogs


| Modelo | Campos principales |
| --- | --- |
| Categoria | empresa, codigo, nombre, descripcion, activa |
| Marca | empresa, codigo, nombre, activa |
| UnidadMedida | empresa, codigo, nombre, abreviacion, activa |
| TipoControlInventario | codigo, nombre, descripcion, activo |
| EstadoSerie | codigo, nombre, es_final, activo |
| TipoMovimientoInventario | codigo, nombre, signo, afecta_stock, activo |


# inventory


| Modelo | Campos principales |
| --- | --- |
| Producto | empresa, sku, nombre, descripcion, categoria, marca, unidad_medida, unidad_compra, factor_conversion, tipo_control_inventario, maneja_stock, permite_stock_negativo, requiere_aprobacion_salida, activo, created_at, updated_at |
| Serie | empresa, producto, numero_serie, estado_serie, bodega_actual, centro_costo_actual, ubicacion_bodega, custodio, fecha_alta, observacion |
| Lote | empresa, producto, codigo_lote, fecha_vencimiento, bodega_actual, cantidad_actual, activo |
| StockActual | empresa, producto, bodega, lote, cantidad, actualizado_at |
| MovimientoInventario | empresa, tipo_movimiento, producto, serie, lote, bodega_origen, bodega_destino, centro_costo, ubicacion_bodega, cantidad, costo_unitario, referencia_tipo, referencia_id, anulado, movimiento_reversa_de, created_at |


# operations


| Modelo | Campos principales |
| --- | --- |
| Solicitud | empresa, numero, centro_costo, solicitante, estado, observacion, created_at, updated_at |
| SolicitudDetalle | solicitud, producto, serie, lote, cantidad, precio_referencia, created_at |
| Entrega | empresa, numero, solicitud, bodega_origen, bodega_destino, estado, observacion, created_at, updated_at |
| EntregaDetalle | entrega, producto, serie, lote, cantidad, created_at |
| Traslado | empresa, numero, bodega_origen, bodega_destino, estado, observacion, created_at, updated_at |
| TrasladoDetalle | traslado, producto, serie, lote, cantidad, created_at |
| EstadoHistorialDocumento | empresa, documento_tipo, documento_id, estado_anterior, estado_nuevo, usuario, created_at |


# support


| Modelo | Campos principales |
| --- | --- |
| UbicacionBodega | empresa, bodega, codigo, nombre, ubicacion_padre, tipo, activa |
| Custodio | empresa, codigo, nombre_completo, documento_identidad, correo, telefono, activo |
| Numerador | empresa, tipo_documento, prefijo, ultimo_numero, longitud, activo |
| Adjunto | empresa, modulo, documento_id, nombre_archivo, ruta_archivo, mime_type, subido_por, created_at |


# Notas de consistencia

Se normalizó el uso de snake_case para los campos Django, manteniendo la lógica del SQL original.
Producto incorpora unidad de compra y factor de conversión como ajuste maduro recomendado.
Serie usa estado_serie y referencias opcionales a bodega, centro de costo, ubicación y custodio.
MovimientoInventario conserva la idea de fuente de verdad operativa.
StockActual se trata como cache operativo, no como verdad histórica.
Se incluyen permisos y rol-permiso para un RBAC completo.
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