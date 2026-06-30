# Layout (`src/components/layout/`)

Shell y composición de página. Estilos en `src/styles/layout.css` (clases `bx-*`).

## Preview

http://localhost:5173/dev/layout

## Componentes

| Componente | Responsabilidad |
|------------|-----------------|
| **AppShell** | Orquesta Sidebar + Topbar + MainContent + `SidebarProvider` |
| **Sidebar** | Nav principal, drawer móvil, estado activo (`NavLink`) |
| **Topbar** | Título/meta de ruta, toggle menú (`Button`), badge operativo |
| **MainContent** | Área scrollable, reset scroll al cambiar ruta, animación entrada |
| **PageHeader** | Breadcrumbs, eyebrow, título, lead, acciones |
| **Breadcrumbs** | Migas con `Link` o página activa |

## Helpers

- `config/chrome.ts` — metadatos topbar y `ROUTE_PAGE_META` por pantalla
- `config/routes.ts` — `ROUTES`, `APP_MAIN_ROUTES` (router Fase 4)
- `config/skeleton-actions.tsx` — acciones deshabilitadas de demo en headers
- `pages/AppPageSkeleton.tsx` — composición base PageHeader + Panel/EmptyState
- `lib/breadcrumbs.ts` — `pageBreadcrumbs()` para composición estándar

## Contrato scroll

- `html`, `body`, `#root`: `overflow-hidden` (globals.css)
- `MainContent`: `overflow-y-auto` único scroll de página
- Tablas/paneles: `bx-table-wrap`, `bx-panel-scroll` (components.css)

## Uso en páginas (Fase 4+)

```tsx
<PageHeader
  breadcrumbs={pageBreadcrumbs('Movimientos')}
  eyebrow="INV · Movimientos"
  title="Historial de movimientos"
  actions={<Button variant="primary" size="sm">Nuevo</Button>}
/>
```
