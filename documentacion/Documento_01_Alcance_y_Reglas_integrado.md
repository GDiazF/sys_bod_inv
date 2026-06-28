Documento 01
Alcance y Reglas del Sistema de Bodega e Inventario
Versión base para validación y trabajo por fases

# Propósito del documento

Este documento define la idea general del sistema antes de entrar al detalle técnico de la base de datos o la programación. Su objetivo es dejar claros el alcance, los módulos, los actores, las reglas y las decisiones base para construir el sistema de manera profesional y ordenada.

# Visión general

El sistema será una plataforma de bodega e inventario orientada a controlar productos, bodegas, movimientos, compras, solicitudes, entregas, traslados e inventarios físicos. La lógica principal no será modificar stock manualmente, sino registrar movimientos que luego permitan calcular existencias, trazabilidad y auditoría.

# Objetivo del sistema


| Elemento | Definición |
| --- | --- |
| Objetivo principal | Controlar existencias y movimientos de inventario con trazabilidad completa. |
| Enfoque | Base de datos profesional, reglas claras, auditoría y crecimiento por fases. |
| Uso esperado | Soporte para operación interna y futura expansión a múltiples empresas o clientes. |


# Alcance funcional inicial


| Incluye | No incluye por ahora |
| --- | --- |
| Empresas, usuarios, roles, bodegas, productos, categorías, unidades y movimientos de inventario. | ERP contable completo, facturación electrónica o logística avanzada compleja. |
| Compras, solicitudes, entregas, traslados e inventario físico. | Optimización con inteligencia artificial, optimización avanzada de rutas o integración con hardware especial. |
| Auditoría y estados de documento. | Módulos externos no definidos aún. |


# Actores del sistema


| Actor | Responsabilidad |
| --- | --- |
| Administrador | Configura el sistema, usuarios, permisos y parámetros generales. |
| Bodeguero | Registra entradas, salidas, traslados y apoyo operativo. |
| Supervisor | Aprueba o revisa documentos sensibles y controla el proceso. |
| Usuario de consulta | Visualiza stock, reportes y trazabilidad sin modificar datos. |
| Aprobador | Autoriza compras, ajustes, solicitudes o anulaciones según el flujo definido. |


# Módulos del sistema


| Módulo | Función |
| --- | --- |
| Seguridad | Usuarios, roles, autenticación y permisos. |
| Organización | Empresas, sucursales, bodegas y centros de costo. |
| Catálogo | Productos, categorías, marcas y unidades de medida. |
| Inventario | Movimientos, stock, kardex e inventario físico. |
| Operaciones | Compras, solicitudes, entregas y traslados. |
| Auditoría | Registro histórico de acciones y modificaciones. |
| Reportes | Consultas, alertas y seguimiento operativo. |


# Principio central del inventario

La fuente de verdad del inventario serán los movimientos registrados. El stock visible en pantalla puede ser calculado o almacenado como caché de rendimiento, pero nunca debe ser la única fuente de información ni modificarse sin dejar rastro.

| Decisión | Regla propuesta |
| --- | --- |
| Fuente de verdad | movimientos_inventario |
| Stock manual directo | No permitido |
| Borrado de registros críticos | No permitido, solo anulación o cambio de estado |
| Trazabilidad | Obligatoria para toda operación |
| Multiempresa | Sí, desde el diseño base |


# Reglas de negocio base


| Regla | Descripción |
| --- | --- |
| R1 | Todo movimiento debe tener usuario, fecha, producto, bodega y referencia al documento origen. |
| R2 | No se modifica el stock directamente sin registrar el movimiento correspondiente. |
| R3 | Los documentos críticos deben tener estados claros: borrador, pendiente, aprobado, rechazado, anulado o cerrado. |
| R4 | Las operaciones sensibles deben poder aprobarse o rechazarse según rol o permiso. |
| R5 | No se deben borrar documentos o movimientos críticos; se deben anular o reversar. |
| R6 | Toda operación debe quedar asociada a una empresa. |
| R7 | Los cambios importantes deben registrarse en auditoría. |


# Pendientes de decisión


| Tema | Decisión por definir |
| --- | --- |
| Stock negativo | Permitirlo, bloquearlo o permitirlo solo bajo ciertos roles. |
| Lotes y series | Incluirlos desde el inicio o dejarlo para una fase posterior. |
| Costeo | Solo cantidades, costo promedio o FIFO. |
| Aprobaciones | Qué documentos requieren aprobación y quién puede autorizar. |
| Numeración | Formato de folios por tipo de documento y por empresa. |
| Adjuntos | Si se guardarán respaldos, fotos, facturas o guías. |
| Alertas | Stock bajo, documentos pendientes o vencimientos. |


# Principio de configurabilidad

El sistema debe ser configurables por datos y no por código. Las reglas operativas, estados, tipos de movimiento, numeración, límites, permisos base y parámetros generales deben almacenarse en tablas de configuración o catálogos administrables, evitando hardcodear valores que puedan cambiar con el tiempo, como:
parámetros generales por empresa.
catálogos administrables.
estados de documentos.
tipos de movimiento.
roles y permisos.
plantillas de numeración.
reglas de aprobación.
opciones de negocio por módulo.

# Decisiones tomadas hasta ahora


| Decisión | Estado |
| --- | --- |
| Sistema de inventario basado en movimientos | Acordado |
| Estructura multiempresa | Acordada como recomendación base |
| Documentación por fases | Acordada |
| Word como documento rector del proyecto | Acordado |
| Base de datos primero, backend después | Acordado |


# Preguntas abiertas para la siguiente fase


| Pregunta | Por qué importa |
| --- | --- |
| ¿El sistema será multiempresa desde el día 1? | Si |
| ¿Habrá una o varias bodegas por empresa? | Varias. |
| ¿Se trabajará con solicitudes internas o también con ventas? | Solicitudes internas en la primera fase; ventas solo si realmente entra en el alcance. |
| ¿Se requiere trazabilidad por centro de costo? | Sí, porque te ayuda a ordenar las salidas internas y los reportes. |
| ¿Qué flujos necesitan aprobación? | Compras, ajustes, traslados sensibles y solicitudes de salida. |
| ¿Cómo se manejarán anulaciones y reversas? | Nunca borrando; solo anulando o generando reversas con auditoría. |


# Próxima fase recomendada

Con este documento aprobado o validado, el siguiente paso será el Documento 02: Base de Datos Completa. Ese segundo documento incluirá el modelo conceptual, lógico y físico, además de tablas, campos, relaciones, restricciones e índices.

# Cierre

Este documento debe funcionar como punto de partida del proyecto. Si más adelante cambian reglas o alcance, se actualiza aquí primero y luego se ajusta el resto de los documentos y el sistema.

# Clasificación de inventario y trazabilidad

El sistema debe distinguir entre productos serializados, no serializados y, cuando corresponda, productos controlados por lote. Esta clasificación forma parte del criterio funcional del sistema desde el diseño inicial.
Se consideran serializados los bienes que requieren identificación individual, como computadores, notebooks, monitores u otros equipos con número de serie o identificador único. Cada unidad debe poder rastrearse de forma individual durante todo su ciclo de vida.
Se consideran no serializados los insumos y artículos que se controlan por cantidad y unidad de medida, como papel higiénico, materiales de oficina, cajas, líquidos o consumibles. En estos casos, el control se realiza por cantidades agregadas y no por unidad individual.
Cuando un producto requiera trazabilidad por partidas o fechas de vencimiento, el sistema debe poder controlar lotes. Esta modalidad deberá permitir asociar cada movimiento a un lote específico cuando la operación lo requiera.
La clasificación de cada producto deberá definirse en su ficha maestra. El sistema deberá permitir que un producto esté asociado a un tipo de control de inventario y aplicar la lógica correspondiente en compras, salidas, traslados e inventario físico.
Los movimientos de inventario deberán respetar el tipo de control definido para cada producto. Un producto serializado no debe tratarse como cantidad genérica si su trazabilidad depende de la identificación individual; un producto no serializado no debe forzarse a usar serie si su naturaleza no lo requiere.

| Tipo | Ejemplos | Forma de control |
| --- | --- | --- |
| Serializado | Computador, notebook, monitor | Unidad individual con identificador único |
| No serializado | Papel higiénico, hojas, insumos | Cantidad y unidad de medida |
| Por lote | Medicamentos, alimentos, productos con vencimiento | Lote y fecha asociada |
