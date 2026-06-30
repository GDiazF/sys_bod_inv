# BodegaX Frontend

React + TypeScript + Tailwind (Vite). Migración desde `../Proyecto/`.

## Requisitos

- Node.js 20+
- Backend Django en `http://127.0.0.1:8000` (proxy dev en `/api/v1`)

## Arranque

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abrir http://localhost:5173

## Rutas del scaffold (Fase 0–5)

| Ruta | Propósito |
|------|-----------|
| `/` | Home: demo scroll interno (tabla + panel) |
| `/dashboard` | Dashboard funcional inicial (mock, Fase 5) |
| `/movimientos` | Listado funcional con filtros y paginación (mock, Fase 6) |
| `/movimiento-detalle` | Esqueleto detalle (demo MOV-0042) |
| `/productos` | Catálogo con filtros y paginación (API real o mocks, Fase API 1) |
| `/recepcion` | Recepción REC-0089 funcional (mock, Fase 7) |
| `/despacho` | Despacho DES-0034 funcional (mock, Fase 8) |
| `/traslado` | Traslado TRA-0012 funcional (mock, Fase 9) |
| `/ajuste` | Ajuste AJU-0005 funcional (mock, Fase 10) |
| `/dev/tokens` | Validación visual de design tokens |
| `/dev/components` | Catálogo de primitivos UI (Fase 2) |
| `/dev/layout` | Preview del shell modular (Fase 3) |
| `/dev/routes` | Índice de rutas esqueleto (Fase 4) |
| `/dev/data` | Catálogo componentes de datos (Fase 5) |

## Estructura

```
src/
  app/           # router, providers
  components/
    layout/      # AppShell, Sidebar, Topbar, MainContent, PageHeader, Breadcrumbs
    ui/          # primitivos (Button, Panel, …)
    data/        # StatCard, FilterBar, DataTable, Pagination, DataView (Fase 5)
  config/        # routes, navigation, chrome, data-ui, env
  hooks/         # useSidebar, useDashboardData, useProductosList, usePaginatedMockList
  api/           # client, products (DRF + TanStack Query, Fase API 1)
  lib/           # cn(), breadcrumbs
  mocks/         # dashboard, movements, products mock data
  pages/         # Home, dev previews, páginas esqueleto + Dashboard
  styles/        # tokens.css, globals.css, components.css, layout.css, data.css, primitives.css
```

Layout: `src/components/layout/README.md` · Datos: `src/components/data/README.md` · API productos: `src/api/README.md`.

## Tokens

Colores y espaciado viven en `src/styles/tokens.css`. Tailwind (`tailwind.config.ts`) referencia variables CSS — no usar valores sueltos en componentes.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build producción
- `npm run preview` — preview del build
