# Sistema de Bodega e Inventario — Backend Django

## Requisitos

- Python 3.11+
- PostgreSQL 14+

## Arranque rápido

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Crear base de datos PostgreSQL `sis_inventario`, luego:

```bash
python manage.py migrate
python manage.py load_initial_data
python manage.py createsuperuser
python manage.py runserver
```

`load_initial_data` sincroniza catálogos globales, permisos v1, empresa DEMO, roles base y numeradores (idempotente: puede ejecutarse varias veces).

La fuente de verdad de seeds es `catalogs/seeds.py` y `security/seeds.py`. Los archivos JSON en `fixtures/` se mantienen como referencia.

Admin: http://127.0.0.1:8000/admin/

## Apps

| App | Responsabilidad |
|-----|-----------------|
| `core` | Empresa, sucursal, bodega, centro de costo, parámetros |
| `security` | Usuario (email), roles, permisos RBAC |
| `catalogs` | Catálogos configurables (Fase 2) |
| `support` | Numeradores, adjuntos, ubicaciones (Fase 2) |
| `inventory` | Productos, movimientos, stock (Fase 3+) |
| `operations` | Solicitudes, entregas, traslados, compras (Fase 5) |

## Settings

- Desarrollo: `config.settings.dev` (por defecto)
- Producción: `config.settings.prod`
