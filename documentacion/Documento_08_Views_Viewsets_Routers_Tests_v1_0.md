Documento 08
Views, Viewsets, Routers y Tests
Sistema de Bodega e Inventario

| Campo | Valor |
| --- | --- |
| Documento | Documento 08 - API y pruebas |
| Versión | 1.0 |
| Estado | Borrador técnico inicial |
| Fecha | 2026-06-26 |


# Objetivo

Definir cómo exponer la API del sistema sin mezclar lógica de negocio en las vistas y dejando los tests como garantía de comportamiento.

| Bloque | Regla |
| --- | --- |
| Views/Viewsets | Delgados, solo orquestan requests y responses. |
| Serializers | Validación de datos y representación. |
| Services | Reglas de negocio, stock, costeo y transacciones. |
| Routers | Organizados por app y versionados. |
| Tests | Cubren casos críticos e invariantes del inventario. |


# API por app


| App | Exposición sugerida |
| --- | --- |
| core | EndPoints de empresas, sucursales, bodegas, centros de costo y parámetros. |
| security | Usuarios, roles, permisos y asignaciones. |
| catalogs | Catálogos maestros y estados configurables. |
| inventory | Productos, series, lotes, stock, movimientos y ubicaciones. |
| operations | Solicitudes, entregas, traslados e historial de documentos. |
| support | Numeradores y adjuntos. |


# Tests mínimos

Creación y validación de catálogos base.
Autenticación y autorización por rol.
Entrada de inventario y actualización de stock.
Salida con stock suficiente e insuficiente.
Serie: asignación, cambio de estado y trazabilidad.
Traslado con estado en tránsito y recepción.
Reversas y anulación sin borrado físico.
Costeo promedio ponderado y FIFO.

# Orden de trabajo

1. Crear routers y endpoints base.
2. Conectar viewsets con serializers.
3. Desplazar lógica de negocio a services.
4. Escribir tests por flujo crítico.
5. Ajustar permisos y filtros por empresa.