# Capa API — Fases API 1–7 (`/productos`, `/movimientos`, `/movimientos/:id`, `/dashboard`)

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar:

| Variable | Descripción |
|----------|-------------|
| `VITE_API_BASE_URL` | Base de la API (default `/api/v1`, proxy Vite → Django en dev) |
| `VITE_USE_API_MOCKS` | `true` = mocks locales; `false` = API real |
| `VITE_API_ACCESS_TOKEN` | JWT Bearer para desarrollo |

## Modo mocks (sin backend)

```env
VITE_USE_API_MOCKS=true
```

`/productos`, `/movimientos`, `/movimientos/:id`, `/dashboard`, `/recepcion`, `/despacho` y `/traslado` usan sus mocks en `mocks/` con el mismo delay que antes.

## Modo API real

1. Levantar Django: `python manage.py runserver`
2. Obtener token:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"bodeguero-a@example.com\",\"password\":\"pass12345\"}"
```

3. Configurar `.env`:

```env
VITE_USE_API_MOCKS=false
VITE_API_ACCESS_TOKEN=<access token del paso anterior>
```

4. Reiniciar Vite: `npm run dev`

## Fallback automático

Con `VITE_USE_API_MOCKS=false`, si la API no responde, los hooks de listados, detalle, dashboard, recepción, despacho y traslado vuelven silenciosamente a mocks.

Errores HTTP (401, 403, 500) **no** activan fallback: se muestra el estado de error con botón Reintentar. Un **404** en detalle de movimiento muestra estado vacío con opción de volver al listado (sin fallback a mock).

## Archivos

- `client.ts` — fetch + auth header + errores tipados
- `products.ts` — `fetchProducts()`, adaptador DRF → `ProductRow`
- `movements.ts` — `fetchMovements()`, adaptador DRF → `MovementRow`
- `movement-detail.ts` — `fetchMovementDetail(id)`, adaptador DRF → `MovementDetail`
- `dashboard.ts` — `fetchDashboard()` y fetchers parciales
- `recepcion.ts` — `fetchRecepcion()`, `confirmRecepcion()`, `updateRecepcion()` (PATCH pendiente)
- `despacho.ts` — `fetchDespacho()`, `confirmDespacho()` → `ejecutar/`, `updateDespacho()` (PATCH pendiente)
- `traslado.ts` — `fetchTraslado()`, `confirmTraslado()` → `despachar/` / `recibir/`, `updateTraslado()` (PATCH pendiente)
- `hooks/useProductosList.ts`, `hooks/useMovimientosList.ts`, `hooks/useMovementDetail.ts`
- `hooks/useDashboardData.ts`, `hooks/useRecepcionDocument.ts`, `hooks/useDespachoDocument.ts`, `hooks/useTrasladoDocument.ts`

## Parámetros enviados al backend — productos

| Filtro UI | Query param |
|-----------|-------------|
| Buscar | `search` |
| Categoría | `categoria` (id resuelto desde `/catalogs/categorias/`) |
| Estado stock | `stock` (`en_stock`, `stock_bajo`, `agotado`) |
| Paginación | `page`, `page_size=6` |

Stock y ubicación se enriquecen desde `/inventory/stock/` por producto de la página actual.

## Parámetros enviados al backend — movimientos

| Filtro UI | Query param |
|-----------|-------------|
| Buscar | `search` |
| Desde / Hasta | `created_at_desde`, `created_at_hasta` (ISO datetime) |
| Tipo = Transferencia | `referencia_tipo=TRASLADO` |
| Tipo = Ajuste | `referencia_tipo=AJUSTE` |
| Tipo = Entrada / Salida | `tipo_movimiento` (uno o merge de varios tipos vía catálogo) |
| Paginación | `page`, `page_size=7`, `ordering=-created_at` |

El adaptador enriquece filas con nombres de producto (`/inventory/productos/{id}/`) y códigos de bodega (`/core/bodegas/`). Estados y badges usan los mismos mapas que `mocks/status-labels.ts`.

## Detalle de movimiento — `/movimientos/:id`

| Recurso | Endpoint |
|---------|----------|
| Cabecera + línea principal | `GET /inventory/movimientos/{id}/` |
| Nombre producto | `GET /inventory/productos/{id}/` |
| Códigos bodega | `GET /core/bodegas/` (caché) |
| Tipos movimiento | `GET /catalogs/tipos-movimiento/` (caché) |

El backend registra **un producto por movimiento**; la tabla de líneas refleja esa única fila. El **timeline** se deriva de campos del movimiento (`anulado`, estado derivado); no hay endpoint de historial aún.

Ruta UI: `/movimientos/{id}` (id numérico o `MOV-0042`). Helper: `movimientoDetallePath()` en `config/routes.ts`.

## Dashboard — `/dashboard` (Fase API 4)

No hay endpoint `/inventory/dashboard/` aún. `fetchDashboard()` agrega datos desde:

| Panel / KPI | Fuente API |
|-------------|------------|
| Stock total | `GET /inventory/stock/` (suma de cantidades) |
| SKUs activos | `GET /inventory/productos/?activo=true` (`count`) |
| Movimiento este mes (subtítulo KPI) | `GET /inventory/movimientos/` (mes actual, productos únicos) |
| Actividad reciente | `fetchMovements()` — últimos 6 movimientos |
| Alertas stock | `/inventory/stock/` agregado por producto (agotado / umbral bajo) |
| Documentos pendientes | `GET /operations/{compras,entregas,traslados,ajustes}/` filtrados por estado no final |
| KPI pendientes / alertas | Conteos derivados de los paneles anteriores |

Los KPIs y paneles reflejan la misma data base que productos y movimientos. Cuando exista un endpoint de resumen dedicado, solo cambia `api/dashboard.ts`.

## Recepción — `/recepcion` (Fase API 5)

UI **REC-XXXX** ↔ backend **Compra** (`operations/compras/`).

| Acción | Endpoint / comportamiento |
|--------|---------------------------|
| Cargar documento | `GET /operations/compras/{id}/` o listado + primera compra abierta |
| Query param | `/recepcion?id=42` |
| Confirmar | `POST /operations/compras/{id}/confirmar/` (estado APROBADO) |
| Guardar borrador | Estado local (PATCH no disponible en v1) |
| Código UI | `COM-0001` → display `REC-0001` |

Auxiliares: `/inventory/proveedores/`, `/core/bodegas/`, `/inventory/productos/{id}/`, `/support/ubicaciones/?bodega=`.

## Despacho — `/despacho` (Fase API 6)

UI **DES-XXXX** ↔ backend **Entrega** (`operations/entregas/`).

| Acción | Endpoint / comportamiento |
|--------|---------------------------|
| Cargar documento | `GET /operations/entregas/{id}/` o listado + primera entrega abierta |
| Query param | `/despacho?id=42` |
| Confirmar | `POST /operations/entregas/{id}/ejecutar/` (estado APROBADO) |
| Guardar borrador | Estado local (PATCH no disponible en v1) |
| Código UI | `ENT-0001` → display `DES-0001` |

Auxiliares: `/core/bodegas/`, `/core/centros-costo/{id}/`, `/operations/solicitudes/{id}/`, `/inventory/productos/{id}/`, `/support/ubicaciones/?bodega=`.

## Traslado — `/traslado` (Fase API 7)

UI **TRA-XXXX** ↔ backend **Traslado** (`operations/traslados/`).

| Acción | Endpoint / comportamiento |
|--------|---------------------------|
| Cargar documento | `GET /operations/traslados/{id}/` o listado + primer traslado abierto |
| Query param | `/traslado?id=42` |
| Confirmar (APROBADO) | `POST /operations/traslados/{id}/despachar/` |
| Confirmar (EN_TRANSITO) | `POST /operations/traslados/{id}/recibir/` |
| Guardar borrador | Estado local (PATCH no disponible en v1) |
| Código UI | `TRA-0001` (mismo prefijo que backend) |

Auxiliares: `/core/bodegas/`, `/inventory/productos/{id}/`, `/support/ubicaciones/?bodega=` (origen y destino).
