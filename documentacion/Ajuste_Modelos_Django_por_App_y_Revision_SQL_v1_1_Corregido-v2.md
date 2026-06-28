Ajuste de Modelos Django por App
Revisión de Consistencia SQL
Sistema de Bodega e Inventario

| Campo | Valor |
| --- | --- |
| Documento | Ajuste de modelos Django por app y consistencia SQL |
| Base revisada | Documento 02 - Modelo Completo de Base de Datos |
| Estado | Borrador técnico para implementación |
| Fecha | 2026-06-26 |


# Objetivo

Alinear las apps Django con el modelo SQL físico y marcar los puntos consistentes, los que requieren ajuste y los que conviene completar antes de codificar.

| App | Estado |
| --- | --- |
| core | Bien alineado con el esquema base. |
| security | Usuario/Rol/UsuarioRol están en el SQL; permisos/rolpermisos deben agregarse. |
| catalogs | Mayormente alineado; EstadoSerie aparece como ajuste maduro. |
| inventory | Producto y Serie están claros; faltan tablas operativas completas en el fragmento revisado. |
| operations | Debe verificarse en el SQL completo antes de implementar. |
| support | Ajustes maduros presentes en el documento SQL. |


# Consistencia SQL


| Elemento | Estado | Observación |
| --- | --- | --- |
| Empresa, Sucursal, Bodega, CentroCosto | Consistente | Estructura base lista para modelar en Django. |
| Usuario, Rol, UsuarioRol | Consistente | Encaja con RBAC básico. |
| Categoria, Marca, UnidadMedida, TipoControlInventario | Consistente | Catálogos bien definidos. |
| Producto | Consistente con ajustes | Conviene agregar unidad de compra y factor de conversión. |
| Serie | Consistente con ajustes | Usar estado_serie_id en lugar de texto libre. |
| MovimientosInventario | Pendiente de ver detalle completo | Debe ser la fuente de verdad operativa. |
| StockActual | Derivado/cache | No debe reemplazar el historial de movimientos. |
| Permisos y rolpermisos | Faltante si se activa RBAC fino | Recomendado incorporarlos al modelo Django. |


# Ajustes recomendados


| Tabla/Modelo | Ajuste recomendado | Motivo |
| --- | --- | --- |
| Producto | Agregar unidadcompra_id y factor_conversion | Soportar compra y consumo con unidades distintas. |
| Serie | Cambiar estado texto por estado_serie_id | Evitar valores hardcodeados y asegurar integridad. |
| Serie | Agregar ubicacion_bodega_id y custodio_id | Mejor trazabilidad física. |
| MovimientoInventario | Agregar ubicacion_bodega_id opcional | Granularidad interna dentro de bodega. |
| Aprobaciones | Agregar documentotipo además de modulo | Simplifica filtros y reportes. |
| ParametroEmpresa | Definir metodo_costeo como catálogo | Alinea la política base recomendada. |


# Modelos Django sugeridos

core.models: Empresa, Sucursal, Bodega, CentroCosto, ParametroEmpresa.
security.models: Usuario, Rol, Permiso, UsuarioRol, RolPermiso.
catalogs.models: Categoria, Marca, UnidadMedida, TipoControlInventario, EstadoSerie.
inventory.models: Producto, Serie, Lote, MovimientoInventario, StockActual, CapaCosteoFifo, ConsumoCapaFifo.
operations.models: Solicitud, SolicitudDetalle, Entrega, EntregaDetalle, Traslado, TrasladoDetalle, EstadoHistorialDocumento.
support.models: UbicacionBodega, Custodio, Numerador, Adjunto.

# Conclusión técnica

La división por apps es coherente con el dominio funcional del SQL.
El núcleo de inventario debe quedar centrado en movimientos_inventario como fuente de verdad.
StockActual y otros resúmenes deben tratarse como cache operativo.
Antes de generar migraciones, conviene revisar el SQL completo para confirmar tablas operativas faltantes.