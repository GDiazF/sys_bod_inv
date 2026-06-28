Documento 04
Estructura Técnica Django
Sistema de Bodega e Inventario

| Campo | Valor |
| --- | --- |
| Documento | Documento 04 - Estructura Técnica Django |
| Versión | 1.1 Corregida |
| Estado | Aprobado para implementación técnica |
| Fecha | 2026-06-26 |


# Objetivo

Definir cómo se organiza el proyecto Django por apps, qué modelos viven en cada una y en qué orden conviene construir la solución.

| App | Propósito |
| --- | --- |
| core | Datos base de organización y configuración general. |
| security | Autenticación, autorización y control de acceso. |
| catalogs | Catálogos maestros y estados configurables. |
| inventory | Productos, stock y trazabilidad operacional. |
| operations | Solicitudes, entregas, traslados y su historial. |
| support | Numeración, adjuntos y apoyo operativo. |


# Orden sugerido


| Paso | Qué hacer |
| --- | --- |
| 1 | Crear apps Django según el dominio. |
| 2 | Definir modelos y relaciones por app. |
| 3 | Configurar admin y permisos básicos. |
| 4 | Crear migraciones o mapear a DB existente. |
| 5 | Implementar servicios de inventario. |
| 6 | Construir API REST. |


# Recomendaciones técnicas

Mantener el SQL y los modelos sincronizados antes de avanzar a lógica de negocio.
No comenzar por vistas o API hasta tener firmes las transacciones de inventario.
Centralizar reglas de costeo y reversa en servicios.
Usar catálogos configurables en lugar de valores hardcodeados.
Separar claramente datos derivados de la fuente histórica de verdad.