# Capa API — Fase API 1 (`/productos`)

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

`/productos` usa `mocks/products.ts` con el mismo delay y filtros que antes.

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

Con `VITE_USE_API_MOCKS=false`, si la API no responde (red, servidor caído, CORS/proxy), el hook `useProductosList` vuelve silenciosamente a los mocks para no bloquear el desarrollo de UI.

Errores HTTP (401, 403, 500) **no** activan fallback: se muestra el estado de error con botón Reintentar.

## Archivos

- `client.ts` — fetch + auth header + errores tipados
- `products.ts` — `fetchProducts()`, adaptador DRF → `ProductRow`
- `hooks/useProductosList.ts` — TanStack Query + filtros/paginación

## Parámetros enviados al backend

| Filtro UI | Query param |
|-----------|-------------|
| Buscar | `search` |
| Categoría | `categoria` (id resuelto desde `/catalogs/categorias/`) |
| Estado stock | `stock` (`en_stock`, `stock_bajo`, `agotado`) |
| Paginación | `page`, `page_size=6` |

Stock y ubicación se enriquecen desde `/inventory/stock/` por producto de la página actual.
