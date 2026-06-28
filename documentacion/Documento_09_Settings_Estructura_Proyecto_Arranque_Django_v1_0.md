Documento 09
Settings, Estructura del Proyecto y Arranque Django
Sistema de Bodega e Inventario

| Campo | Valor |
| --- | --- |
| Documento | Documento 09 - Setup técnico |
| Versión | 1.0 |
| Estado | Borrador técnico inicial |
| Fecha | 2026-06-26 |


# Objetivo

Definir la base técnica para iniciar el proyecto Django sin dejar decisiones clave improvisadas.

| Tema | Decisión sugerida |
| --- | --- |
| Base de datos | PostgreSQL. |
| API | Django REST Framework. |
| Autenticación | Custom user model con login por email. |
| Configuración | Variables de entorno por ambiente. |
| Archivos sensibles | Fuera del código fuente. |


# Estructura del proyecto


| Carpeta/App | Propósito |
| --- | --- |
| config | Settings, urls, wsgi, asgi y arranque del proyecto. |
| core | Empresas, sucursales, bodegas, centros de costo y parámetros. |
| security | Usuarios, roles, permisos y acceso. |
| catalogs | Catálogos maestros y estados configurables. |
| inventory | Productos, series, lotes, stock y movimientos. |
| operations | Solicitudes, entregas, traslados e historial. |
| support | Numeración, adjuntos y utilidades operativas. |


# Variables de entorno

DJANGO_SECRET_KEY
DJANGO_DEBUG
DATABASE_URL
ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
CSRF_TRUSTED_ORIGINS
TIME_ZONE
DEFAULT_FROM_EMAIL

# Arranque recomendado

Crear el proyecto y las apps.
Configurar settings base por ambiente.
Definir custom user model antes de migrar.
Aplicar modelos y migraciones.
Registrar admin, serializers y services.
Conectar API y tests.

# Buenas prácticas

No guardar credenciales en el repo.
No hardcodear valores del negocio.
Separar settings de desarrollo, staging y producción.
Dejar el arranque listo para escalar a multiempresa.