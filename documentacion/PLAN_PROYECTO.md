# Plan del proyecto — Sistema de Bodega e Inventario

Documento maestro de avance (backend) y hoja de ruta (frontend + cierres pendientes).  
Basado en documentos técnicos 01–10 y desarrollo por fases acordado.

**Última actualización:** junio 2026  
**Estado backend:** Fases 0–7 + endurecimiento API — **completado**  
**Estado frontend:** scaffold inicial (`frontend/`), **sin implementar**  
**Tests:** 58 passed, 1 skipped (concurrencia numerador requiere PostgreSQL)

---

## 1. Visión y alcance v1

Sistema **multiempresa** de bodega e inventario donde los **movimientos de inventario son la fuente de verdad** y el stock es cache derivado.

### Stack acordado

| Capa | Tecnología |
|------|------------|
| Backend | Django 5.x, DRF, PostgreSQL |
| Auth API | JWT (`rest_framework_simplejwt`) |
| Documentación API | drf-spectacular (OpenAPI 3 + Swagger UI) |
| Filtros listados | django-filter |
| Frontend (planificado) | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, Axios |
| Tests | pytest, pytest-django |

### Incluido en v1

- Multiempresa con aislamiento estricto por `empresa_id`
- RBAC: 31 permisos, 5 roles demo
- Catálogos, productos (serializado / no serializado / por lote)
- Movimientos + stock cache + costeo **PROMEDIO_PONDERADO**
- Documentos: Solicitud, Entrega, Traslado, Compra, AjusteInventario
- API REST completa + Admin Django
- Seeds idempotentes (`load_initial_data`)

### Excluido de v1 (postergado)

- Ventas
- FIFO operativo (modelos preparados, servicio bloqueado)
- Recepción parcial de compras
- Adjuntos en UI (API existe, sin upload real en front)
- Frontend funcional (solo scaffold)
- FK directa de `MovimientoInventario` → documentos operations (usa `referencia_tipo` / `referencia_id`)

---

## 2. Decisiones técnicas cerradas

### Stock negativo

- **Default:** bloqueado.
- **Permitido solo si:** `ParametroEmpresa.stock_negativo_permitido` **Y** `Producto.permite_stock_negativo`, o `permitir_stock_negativo=True` en `MovimientoInput`.
- **Serializados:** nunca pueden quedar en stock negativo.

### Series y lotes por tipo de control

| Tipo | Serie | Lote | Cantidad |
|------|-------|------|----------|
| `SERIALIZADO` | Obligatoria, única | No | Siempre 1 |
| `NO_SERIALIZADO` | No | No | Libre |
| `POR_LOTE` | No | Obligatorio | Libre |

### Ubicación de modelos por app

| App | Contenido |
|-----|-----------|
| `core` | Empresa, Sucursal, Bodega, CentroCosto, ParametroEmpresa |
| `security` | Usuario, Rol, Permiso, UsuarioRol, RolPermiso |
| `catalogs` | Categoría, Marca, UnidadMedida, tipos/estados globales |
| `inventory` | Producto, Serie, Lote, Proveedor, MovimientoInventario, StockActual, capas FIFO |
| `operations` | Solicitud, Entrega, Traslado, Compra, AjusteInventario + detalles + historial |
| `support` | UbicacionBodega, Custodio, Numerador, Adjunto |

### Patrones de arquitectura

- **Lógica de negocio en `services/`**, no en views.
- **Views delgadas:** validación HTTP, permisos, delegación a services.
- **Movimientos como verdad;** `StockActual` es cache con locks (`select_for_update`).
- **Seeds idempotentes:** `catalogs/seeds.py`, `security/seeds.py`, `*/sync.py`, comando `load_initial_data`.

---

## 3. Backend completado — registro por fases

### Fase 0 — Infraestructura ✅

- Proyecto Django, `config/settings/{base,dev,prod}.py`
- `requirements.txt`, `.env.example`, `.gitignore`, `README.md`
- pytest (`pytest.ini`, `conftest.py`, `USE_SQLITE=1` en dev/tests)
- `AUTH_USER_MODEL = security.Usuario`

### Fase 1 — core + security ✅

- Modelos: Empresa, Sucursal, Bodega, CentroCosto, ParametroEmpresa
- Modelos: Usuario (email), Rol, Permiso, UsuarioRol, RolPermiso
- Admin + migraciones `core/0001`, `security/0001`

### Fase 2 — catalogs ✅

- 8 modelos de catálogo (globales + por empresa)
- `ParametroEmpresa.metodo_costeo` → FK a `catalogs.MetodoCosteo` (`core/0002`)
- 31 permisos RBAC + sync idempotente
- Tests: `catalogs/tests/test_catalogos.py`

### Fase 3 — support ✅

- UbicacionBodega, Custodio, Numerador, Adjunto
- `NumeradorService` con `select_for_update` (concurrencia)
- Migración `support/0001`

### Fase 4 — inventory (modelos) ✅

- Producto, Serie, Lote, Proveedor, MovimientoInventario, StockActual, capas FIFO
- Constraints parciales stock con/sin lote
- `referencia_tipo` / `referencia_id` en movimientos (sin FK a operations)
- Tests constraints: `inventory/tests/test_models.py`

### Fase 5 — inventory (services) ✅

Servicios en `inventory/services/`:

- `stock_service` — lock, validación stock negativo
- `serie_service` — estados, tránsito, recepción traslado
- `lote_service`, `valorizacion_service` (solo PROMEDIO_PONDERADO)
- `movimiento_inventario_service` — registrar / anular / entrada serializada

Tests: `inventory/tests/test_movimiento_service.py` (14 tests)

### Fase 6 — operations ✅

**Modelos:** Solicitud, Entrega, Traslado, Compra, AjusteInventario + detalles + EstadoHistorialDocumento

**Services:**

| Service | Flujo principal |
|---------|-----------------|
| `solicitud_service` | crear → enviar → aprobar / rechazar / anular / cerrar |
| `entrega_service` | desde solicitud / ad-hoc → ejecutar → `SALIDA_ENTREGA` |
| `traslado_service` | enviar → aprobar → despachar → recibir (`TRASLADO_*`, series EN_TRANSITO) |
| `compra_service` | enviar → aprobar → confirmar → `ENTRADA_COMPRA` |
| `ajuste_service` | conteo vs stock → aprobar → ejecutar (`AJUSTE_*`) |
| `documento_estado_service` | matriz de transiciones por tipo documento |

Migración: `operations/0001_initial`  
Tests E2E servicios: `operations/tests/test_flujos.py` (6 flujos + 1 API)

### Fase 7 — API REST + RBAC ✅

**Infraestructura API:**

- `security/services/permiso_service.py`
- `security/api/permissions.py` → `RBACPermission`
- `core/api/mixins.py` → `EmpresaScopedMixin`, `RBACViewMixin`, `StandardListMixin`
- JWT: `POST /api/v1/auth/token/`, `POST /api/v1/auth/token/refresh/`
- OpenAPI: `/api/schema/`, Swagger: `/api/docs/`
- Handler errores negocio → HTTP 400

**Módulos API:**

| Prefijo | Contenido |
|---------|-----------|
| `/api/v1/core/` | empresa, sucursales, bodegas, centros-costo, parametros |
| `/api/v1/catalogs/` | categorías, marcas, unidades + catálogos globales (lectura) |
| `/api/v1/inventory/` | productos, proveedores, stock, movimientos |
| `/api/v1/operations/` | solicitudes, entregas, traslados, compras, ajustes + acciones |
| `/api/v1/support/` | ubicaciones, custodios, numeradores, adjuntos |
| `/api/v1/security/` | me, usuarios, roles, permisos |

Tests API: `api_tests/` (aislamiento, permisos, flujos, schema)

### Endurecimiento API (post-Fase 7) ✅

- **`EmpresaScopedPrimaryKeyRelatedField`** — rechaza FKs de otra empresa (400)
- **`EmpresaScopedModelSerializer`** — querysets FK acotados en CRUD maestros
- **Paginación:** `?page=`, `?page_size=` (máx. 100)
- **Filtros django-filter** por recurso (`?activo=`, `?bodega=`, `?estado_codigo=`, etc.)
- **Búsqueda:** `?search=`
- **Orden:** `?ordering=` / `?ordering=-campo`
- Validación schema: `python manage.py spectacular --validate`

---

## 4. RBAC — roles y permisos (referencia)

### Roles demo (`load_initial_data`)

| Rol | Perfil |
|-----|--------|
| `ADMIN` | Todos los permisos |
| `BODEGUERO` | Operación diaria: productos, stock, crear/ejecutar documentos operativos |
| `SUPERVISOR` | Bodeguero + aprobaciones, ajustes, anular, override stock negativo |
| `APROBADOR` | Solo aprobar solicitudes, entregas ad-hoc, traslados, compras, ajustes |
| `CONSULTA` | Solo lectura stock/productos/movimientos |

### Permisos clave por módulo

- **core:** `core.empresa.ver`, `core.bodega.ver/editar`, `core.parametro.editar`
- **catalogs:** `catalogs.ver`, `catalogs.editar`
- **inventory:** `inventory.producto.ver/editar`, `inventory.stock.ver`, `inventory.movimiento.ver`, `inventory.proveedor.editar`, `inventory.aprobar_ajuste`, `inventory.override_stock_negativo`
- **operations:** `operations.solicitud.crear/aprobar`, `operations.entrega.crear/aprobar`, `operations.traslado.*`, `operations.compra.*`, `operations.documento.anular`
- **support:** `support.adjunto.subir`, `support.numerador.editar`
- **security:** `security.usuario.ver/editar`, `security.rol.editar`

Fuente: `security/seeds.py` + `core/management/commands/load_initial_data.py`

---

## 5. API — convenciones para el frontend

### Autenticación

```http
POST /api/v1/auth/token/
Content-Type: application/json

{"email": "usuario@empresa.cl", "password": "..."}
```

Respuesta: `{ "access": "...", "refresh": "..." }`  
Header en requests: `Authorization: Bearer <access>`

### Listados estándar

```http
GET /api/v1/inventory/productos/?page=1&page_size=25&search=SKU&activo=true&ordering=sku
```

Respuesta paginada:

```json
{
  "count": 120,
  "next": "...",
  "previous": null,
  "results": [ ... ]
}
```

### Permisos del usuario logueado

```http
GET /api/v1/security/me/
```

Respuesta incluye array `permisos` con códigos RBAC → usar para mostrar/ocultar acciones en UI.

### Documentos operations — patrón de acciones

| Documento | Crear | Detalle | Workflow |
|-----------|-------|---------|----------|
| Solicitud | `POST /solicitudes/` | `POST /solicitudes/{id}/detalles/` | enviar → aprobar |
| Entrega | `POST /entregas/desde-solicitud/` o `/ad-hoc/` | `POST /entregas/{id}/detalles/` | ejecutar |
| Traslado | `POST /traslados/` | `POST /traslados/{id}/detalles/` | enviar → aprobar → despachar → recibir |
| Compra | `POST /compras/` | `POST /compras/{id}/detalles/` | enviar → aprobar → confirmar |
| Ajuste | `POST /ajustes/` | `POST /ajustes/{id}/detalles/` | enviar → aprobar → ejecutar |

### Errores de negocio

HTTP **400** con `{ "detail": "mensaje" }` (services de operations/inventory/support).

### Documentación interactiva

- Swagger UI: `http://localhost:8000/api/docs/`
- Schema YAML: `http://localhost:8000/api/schema/`

---

## 6. Flujos de negocio (referencia UI)

```mermaid
flowchart LR
  subgraph Salidas
    S[Solicitud] -->|aprobar| E[Entrega]
    E -->|ejecutar| M1[SALIDA_ENTREGA]
  end

  subgraph Traslados
    T[Traslado] -->|despachar| M2[TRASLADO_SALIDA]
    M2 -->|recibir| M3[TRASLADO_ENTRADA]
  end

  subgraph Entradas
    C[Compra] -->|confirmar| M4[ENTRADA_COMPRA]
  end

  subgraph Ajustes
    A[Ajuste] -->|ejecutar| M5[AJUSTE_POS/NEG]
  end

  M1 & M2 & M3 & M4 & M5 --> ST[StockActual cache]
```

---

## 7. Estado actual del frontend

Existe carpeta `frontend/` con:

- Vite + React 19 + TypeScript + Tailwind 4
- Dependencias: `axios`, `react-router-dom`
- `App.tsx` con rutas planificadas (login, dashboard, productos, stock, solicitudes, compras)
- **Faltan** los módulos referenciados (`auth/`, `components/`, `pages/`) — el scaffold **no compila** aún

**No se ha iniciado la implementación funcional del frontend.**

---

## 8. Plan frontend — Fases propuestas

### Fase F0 — Base y autenticación

**Objetivo:** app navegable con login JWT y layout principal.

| Tarea | Detalle |
|-------|---------|
| Estructura carpetas | `src/api/`, `src/auth/`, `src/components/`, `src/pages/`, `src/hooks/`, `src/types/` |
| Cliente HTTP | Axios instance con interceptors (Bearer, refresh token, 401 → login) |
| AuthContext | login, logout, usuario, permisos desde `/security/me/` |
| PrivateRoute | redirección a `/login` |
| AppLayout | sidebar + header + outlet, menú según permisos |
| LoginPage | form email/password → token |
| Variables entorno | `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1` |
| Proxy Vite (dev) | opcional para evitar CORS en desarrollo |

**Entregable:** login funcional, shell con navegación condicionada por RBAC.

---

### Fase F1 — Componentes compartidos y listados

**Objetivo:** patrones reutilizables para todas las pantallas CRUD.

| Componente | Uso |
|------------|-----|
| `DataTable` | tabla paginada con sorting remoto |
| `SearchBar` | debounce → `?search=` |
| `FilterPanel` | filtros por campos del FilterSet |
| `Pagination` | page / page_size |
| `StatusBadge` | estados documento (BORRADOR, APROBADO, etc.) |
| `ConfirmDialog` | acciones destructivas / workflow |
| `FormField`, `SelectAsync` | formularios maestros |
| `PermissionGate` | `can('operations.solicitud.crear')` |
| `Toast / Alert` | errores API y éxito |

**Entregable:** librería UI interna documentada en código.

---

### Fase F2 — Maestros (core + catalogs + inventory)

Pantallas CRUD con permisos:

| Pantalla | API | Permiso mínimo |
|----------|-----|----------------|
| Bodegas | `/core/bodegas/` | ver / editar |
| Centros de costo | `/core/centros-costo/` | ver / editar |
| Categorías / Marcas / UM | `/catalogs/*` | catalogs.ver / editar |
| Productos | `/inventory/productos/` | producto.ver / editar |
| Proveedores | `/inventory/proveedores/` | proveedor.editar |

Formularios producto: selector tipo control, validaciones según SERIALIZADO / LOTE.

**Entregable:** ABM maestros completo.

---

### Fase F3 — Consultas de inventario

| Pantalla | API | Notas |
|----------|-----|-------|
| Stock actual | `/inventory/stock/` | filtros bodega, producto, lote |
| Kardex / movimientos | `/inventory/movimientos/` | filtros fecha, tipo, referencia |
| Dashboard | agregaciones client-side o endpoint futuro | KPIs: SKUs, bodegas, docs pendientes |

**Entregable:** visibilidad operativa para bodeguero y consulta.

---

### Fase F4 — Solicitudes y entregas

| Pantalla | Flujo UI |
|----------|----------|
| Lista solicitudes | filtros estado, centro costo, fechas |
| Detalle / form solicitud | cabecera + grilla detalle + enviar |
| Bandeja aprobación | acciones aprobar/rechazar (rol APROBADOR) |
| Entregas | crear desde solicitud aprobada → ejecutar |
| Entrega ad-hoc | crear → detalle → enviar → aprobar → ejecutar |

Validar permisos por botón (`crear` vs `aprobar` vs `ejecutar`).

**Entregable:** ciclo completo solicitud → entrega.

---

### Fase F5 — Traslados

| Paso | Acción API |
|------|------------|
| Crear traslado | origen, destino, detalle |
| Workflow | enviar → aprobar → despachar → recibir |
| Series | UI selector serie disponible en bodega origen |
| Estados serie | feedback EN_TRANSITO / DISPONIBLE |

**Entregable:** traslado entre bodegas con soporte serializado.

---

### Fase F6 — Compras

| Paso | Acción API |
|------|------------|
| Crear OC | proveedor, bodega destino, líneas |
| Workflow | enviar → aprobar → confirmar |
| Serializados | captura `numero_serie` por línea |
| Por lote | selector lote o alta lote |

**Entregable:** recepción de compra con entrada automática a inventario.

---

### Fase F7 — Ajustes de inventario

| Paso | Acción API |
|------|------------|
| Crear ajuste | bodega + conteo físico |
| Detalle | `cantidad_contada` vs sistema (muestra diferencia) |
| Workflow | enviar → aprobar → ejecutar (rol SUPERVISOR/APROBADOR) |

**Entregable:** ajuste positivo/negativo operativo.

---

### Fase F8 — Administración y soporte

| Pantalla | API | Rol típico |
|----------|-----|------------|
| Usuarios | `/security/usuarios/` | ADMIN |
| Roles (lectura) | `/security/roles/` | ADMIN |
| Parámetros empresa | `/core/parametros/` | ADMIN |
| Numeradores | `/support/numeradores/` | ADMIN |
| Ubicaciones bodega | `/support/ubicaciones/` | SUPERVISOR |

**Entregable:** administración básica sin depender del Django admin.

---

### Fase F9 — Calidad frontend

| Tarea | Herramienta sugerida |
|-------|---------------------|
| Tests unitarios componentes | Vitest + Testing Library |
| Tests E2E flujos críticos | Playwright |
| Lint / format | oxlint (ya en package.json) + Prettier opcional |
| Tipos API | generar desde OpenAPI (`openapi-typescript`) |
| CI | lint + build + tests en PR |

**Entregable:** pipeline front confiable.

---

## 9. Backend — cierres opcionales (pre/post front)

No bloquean el inicio del frontend, pero conviene priorizar según necesidad:

| Ítem | Prioridad | Descripción |
|------|-----------|-------------|
| Usuario demo con JWT | Alta | Extender `load_initial_data` con usuario `demo@empresa.cl` + rol BODEGUERO |
| Endpoint dashboard KPIs | Media | `/api/v1/inventory/dashboard/` — stock bajo, docs pendientes |
| Rate limiting auth | Media | throttle en `/auth/token/` |
| Audit log centralizado | Baja | tabla + servicio para acciones sensibles |
| FIFO operativo | Post-v1 | activar `valorizacion_service` FIFO |
| FK Movimiento → documento | Baja | migración FK opcional desde `referencia_*` |
| Ventas | Post-v1 | nueva app `sales` |
| Upload adjuntos real | Media | `multipart` + storage (local/S3) |
| Despliegue prod | Alta (go-live) | Docker, gunicorn, nginx, env prod, backups PG |

---

## 10. Comandos útiles

### Backend

```bash
# Desarrollo sin PostgreSQL
set USE_SQLITE=1
python manage.py migrate
python manage.py load_initial_data
python manage.py runserver

# Tests
python -m pytest -q

# Validar schema OpenAPI
python manage.py spectacular --validate
```

### Frontend (cuando se implemente)

```bash
cd frontend
npm install
npm run dev
```

---

## 11. Estructura del repositorio (actual)

```
Sis_inventario_doc/
├── config/                 # settings, urls, exceptions
├── core/                   # modelos empresa + api/
├── security/               # usuarios, RBAC + api/
├── catalogs/               # catálogos + api/
├── inventory/              # inventario + services + api/
├── operations/             # documentos + services + api/
├── support/                # numeradores, adjuntos + api/
├── api_tests/              # tests integración API
├── documentacion/          # docs negocio + este plan
├── frontend/               # scaffold React (pendiente)
├── manage.py
├── requirements.txt
└── schema.yaml             # export OpenAPI (opcional)
```

---

## 12. Criterios de “listo para producción” (checklist global)

### Backend ✅ (v1)

- [x] Modelos y migraciones
- [x] Services con tests unitarios/E2E
- [x] API REST con RBAC
- [x] Aislamiento multiempresa
- [x] Paginación, filtros, búsqueda
- [x] OpenAPI validado
- [ ] Usuario demo documentado en README
- [ ] Despliegue prod configurado

### Frontend ⬜ (pendiente)

- [ ] Auth JWT + refresh
- [ ] Layout + RBAC en UI
- [ ] Maestros CRUD
- [ ] Stock y movimientos
- [ ] 5 flujos documentales
- [ ] Admin básico
- [ ] Tests E2E
- [ ] Build producción

---

## 13. Orden recomendado de ejecución

1. **Backend opcional mínimo:** usuario demo JWT + actualizar README  
2. **Frontend F0–F1:** auth + componentes base  
3. **Frontend F2–F3:** maestros + stock (valor inmediato para operación)  
4. **Frontend F4–F7:** documentos en orden de frecuencia (solicitud/entrega → compra → traslado → ajuste)  
5. **Frontend F8–F9:** admin + calidad  
6. **Go-live:** despliegue, capacitación, monitoreo  

---

## 14. Referencias

- Documentos negocio/técnicos: `documentacion/Documento_01` … `Documento_10`
- Permisos v1: `security/seeds.py`
- Seeds demo: `python manage.py load_initial_data`
- Swagger local: `http://127.0.0.1:8000/api/docs/`

---

*Este documento debe actualizarse al cerrar cada fase frontend o al agregar endpoints backend nuevos.*
