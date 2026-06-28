Documento 02
Modelo Completo de Base de Datos
Sistema de Bodega e Inventario
Versión 1.1 Corregida

| Campo | Valor |
| --- | --- |
| Documento | Documento 02 - Modelo Completo de Base de Datos |
| Versión | 1.1 Corregida |
| Estado | Aprobado para implementación técnica |
| Base documental | Documento 01 de alcance y reglas validado |
| Uso previsto | Diagrama ER, SQL físico PostgreSQL, modelos Django, servicios e API |
| Fecha | 2026-06-26 |


# Decisiones cerradas para implementación


| Tema | Decisión final |
| --- | --- |
| Modelo general | Sistema multiempresa, múltiples bodegas por empresa y movimientos como fuente de verdad. |
| Inventario | Soporte para productos serializados, no serializados y por lote. |
| Trazabilidad | Centro de costo integrado desde el inicio. |
| Seguridad | RBAC con usuarios, roles, permisos y rol_permisos. |
| Aprobaciones | Documentos sensibles con estados parametrizables y trazabilidad de aprobación. |
| Traslados | Flujo con posible estado EN_TRANSITO. |
| Anulaciones | Preferencia por reversas, nunca borrado físico de registros críticos. |
| Numeración | Numeradores por empresa y tipo_documento. |
| Series | Estados parametrizables y datos actuales permitidos solo como cache operativo. |
| Unidades | Soporte para unidad base, unidad de compra y factor de conversión. |
| Costeo inicial | Promedio ponderado como decisión base de la versión 1, con soporte posterior para FIFO. |
| Ubicaciones internas | Diseñadas en el modelo, uso opcional en primera implementación. |
| Custodios | Diseñados en el modelo, uso según necesidad operativa. |


# Nota crítica de consistencia

La fuente histórica de verdad del inventario es la tabla movimientos_inventario. Cualquier dato actual o resumido almacenado en tablas como series o stock_actual debe entenderse como cache operativo o dato derivado, nunca como reemplazo del historial de movimientos.

# 50. Actualización de costeo configurable

Se actualiza la política de costeo del sistema para permitir más de un método de valorización configurable por empresa. Los métodos mínimos soportados serán PROMEDIO_PONDERADO y FIFO. La recomendación operativa para nuevas implementaciones sigue siendo iniciar con PROMEDIO_PONDERADO, pero la arquitectura deberá permitir operar con FIFO cuando el negocio lo requiera.

# 51. Decisión de diseño actualizada


| Tema | Decisión final |
| --- | --- |
| Método de costeo | El sistema soportará PROMEDIO_PONDERADO y FIFO como métodos configurables por empresa. |
| Método por defecto | Para nuevas empresas se recomienda PROMEDIO_PONDERADO como configuración inicial. |
| Cambio de método | No debe permitirse libremente con inventario valorizado; si se habilita, debe ser mediante proceso controlado. |


# 52. Tabla: metodos_costeo


| Campo | Tipo sugerido | Nulo | Descripción |
| --- | --- | --- | --- |
| id | bigserial / uuid | No | Identificador único del método de costeo. |
| codigo | varchar(30) | No | Código del método, por ejemplo PROMEDIO_PONDERADO o FIFO. |
| nombre | varchar(80) | No | Nombre visible del método. |
| descripcion | text | Sí | Descripción funcional del método. |
| activo | boolean | No | Indica si el método está habilitado. |


# 53. Ajuste recomendado a tabla: parametros_empresa


| Clave sugerida | Uso |
| --- | --- |
| metodo_costeo | Define el método de valorización de inventario usado por la empresa. |
| permite_cambio_metodo_costeo | Indica si el método puede modificarse mediante proceso controlado. |


# 54. Ajuste recomendado a tabla: productos


| Campo propuesto | Tipo sugerido | Obligatorio | Descripción |
| --- | --- | --- | --- |
| costo_promedio_actual | numeric(18,4) | No | Costo promedio vigente del producto como dato operativo si la empresa usa PROMEDIO_PONDERADO. |
| unidad_compra_id | fk | Sí recomendado | Unidad habitual de compra del producto. |
| factor_conversion | numeric(18,6) | Sí recomendado | Cantidad de unidades base contenidas en la unidad de compra. |


# 55. Tabla: capas_costeo_fifo


| Campo | Tipo sugerido | Nulo | Descripción |
| --- | --- | --- | --- |
| id | bigserial / uuid | No | Identificador único de la capa FIFO. |
| empresa_id | fk | No | Empresa propietaria de la capa. |
| producto_id | fk | No | Producto al que pertenece la capa. |
| bodega_id | fk | No | Bodega en la que se generó o mantiene la capa. |
| lote_id | fk | Sí | Lote asociado si aplica. |
| movimiento_entrada_id | fk | No | Movimiento de inventario que originó la capa. |
| fecha_entrada | timestamp | No | Fecha efectiva de creación de la capa. |
| cantidad_inicial | numeric(18,4) | No | Cantidad inicial ingresada en la capa. |
| cantidad_consumida | numeric(18,4) | No | Cantidad ya consumida desde la capa. |
| cantidad_saldo | numeric(18,4) | No | Saldo disponible de la capa. |
| costo_unitario | numeric(18,4) | No | Costo unitario asignado a la capa. |
| cerrada | boolean | No | Indica si la capa ya fue consumida completamente. |
| created_at | timestamp | No | Fecha de creación del registro. |


# 56. Tabla: consumo_capas_fifo


| Campo | Tipo sugerido | Nulo | Descripción |
| --- | --- | --- | --- |
| id | bigserial / uuid | No | Identificador único del consumo de capa. |
| empresa_id | fk | No | Empresa propietaria del consumo. |
| movimiento_salida_id | fk | No | Movimiento de salida que consume inventario. |
| capa_fifo_id | fk | No | Capa FIFO consumida. |
| cantidad_consumida | numeric(18,4) | No | Cantidad tomada desde esa capa. |
| costo_unitario | numeric(18,4) | No | Costo unitario heredado de la capa. |
| costo_total | numeric(18,4) | No | Costo total consumido en esa porción de la capa. |
| created_at | timestamp | No | Fecha de creación del registro. |


# 57. Reglas operativas de costeo


| Regla | Descripción |
| --- | --- |
| RC1 | Cada empresa debe tener un único método de costeo activo para inventario operativo, definido en configuración. |
| RC2 | Si la empresa usa PROMEDIO_PONDERADO, las salidas se valorizan usando el costo promedio vigente del producto al momento del movimiento. |
| RC3 | Si la empresa usa FIFO, las salidas deben consumir capas de inventario en orden cronológico de entrada. |
| RC4 | El cambio de método de costeo con inventario existente debe considerarse proceso excepcional y controlado. |
| RC5 | Las reversas deben revertir no solo cantidades, sino también el efecto de costeo correspondiente al método activo. |


# 48. Política de costeo actualizada

El sistema soportará los métodos de costeo PROMEDIO_PONDERADO y FIFO como configuración por empresa. Para nuevas empresas se recomienda iniciar con PROMEDIO_PONDERADO como valor predeterminado, dejando FIFO disponible como opción avanzada cuando el negocio lo requiera.

# 49. Nota sobre datos derivados y caché

En algunas tablas, como series o stock_actual, puede ser útil guardar información derivada o de acceso rápido, por ejemplo bodega actual, centro de costo actual o existencias consolidadas. Esto es válido siempre que quede explícito que la fuente histórica de verdad continúa siendo movimientos_inventario y que dichos datos puedan recalcularse si fuera necesario.

# 50. Reglas finales de consistencia


| Regla | Descripción |
| --- | --- |
| C1 | El Documento 02 debe mantener una sola política vigente de costeo, no versiones contradictorias. |
| C2 | La fuente histórica de verdad del inventario es movimientos_inventario. |
| C3 | series y stock_actual pueden conservar datos operativos derivados, pero no sustituyen el historial. |
| C4 | El método de costeo debe configurarse por empresa y no cambiarse libremente con inventario valorizado. |
| C5 | La versión final del documento debe ser la única referencia para SQL, ERD y Django. |


# 58. Correcciones finales incorporadas

Se corrige la tabla series para que el estado no dependa de un texto libre. El campo operativo principal debe ser estado_serie_id como FK hacia estados_series. Si se mantiene un campo de texto como apoyo o caché, este debe quedar explícitamente marcado como derivado y no como fuente oficial.

| Tema | Corrección aplicada |
| --- | --- |
| series.estado | Se reemplaza por estado_serie_id como referencia al catálogo estados_series. |
| Numeración | Se mantiene centralizada en numeradores por empresa y tipo_documento. |
| Costeo | Se conserva la configuración por empresa con PROMEDIO_PONDERADO y FIFO. |
| Fuente de verdad | movimientos_inventario sigue siendo el historial maestro. |


# 59. Tabla: estados_series


| Campo | Tipo sugerido | Nulo | Descripción |
| --- | --- | --- | --- |
| id | bigserial / uuid | No | Identificador único del estado de serie. |
| codigo | varchar(30) | No | Código del estado, por ejemplo DISPONIBLE, EN_TRANSITO, ENTREGADO, BAJA o MANTENIMIENTO. |
| nombre | varchar(80) | No | Nombre visible del estado. |
| es_final | boolean | No | Indica si el estado representa el cierre de la vida útil operativa. |
| activo | boolean | No | Indica si el estado está habilitado. |


# 60. Ajuste definitivo a tabla: series


| Campo | Tipo sugerido | Nulo | Descripción |
| --- | --- | --- | --- |
| id | bigserial / uuid | No | Identificador único del registro de serie. |
| empresa_id | fk | No | Empresa propietaria del bien. |
| producto_id | fk | No | Producto al que pertenece la serie. |
| numero_serie | varchar(120) | No | Número de serie o identificador único del bien. |
| estado_serie_id | fk | No | Estado actual de la serie, referenciado al catálogo estados_series. |
| bodega_actual_id | fk | Sí | Bodega en la que se encuentra la serie si está en inventario. |
| centro_costo_actual_id | fk | Sí | Centro de costo actual si fue entregado. |
| fecha_alta | date | Sí | Fecha en que la serie ingresó al sistema o al inventario. |
| observacion | text | Sí | Notas adicionales sobre la unidad. |


| Tabla | Ajuste final |
| --- | --- |
| ubicaciones_bodega | Usar db_table = ubicaciones_bodega con guion bajo. |
| foreign keys Django | Usar referencias por cadena entre apps para evitar imports circulares. |
| usuario | Definir como custom user model compatible con Django auth. |
