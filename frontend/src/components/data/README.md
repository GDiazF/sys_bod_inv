# Componentes de datos (`src/components/data/`)



Capa de composición para listados, dashboard y documentos. Estilos en `src/styles/data.css` (clases `bx-*`).



## Preview



http://localhost:5173/dev/data



Dashboard funcional (mock): http://localhost:5173/dashboard



## Componentes



| Componente | Responsabilidad |

|------------|-----------------|

| **StatCard** | KPI con variantes hero, accent, inset, dark |

| **FilterBar** | Barra de filtros con `FilterBar.Field` |

| **DataTable** | Tabla genérica tipada, filas clicables |

| **ScrollableTable** | `DataTable` + contrato scroll (`bx-table-wrap`) |

| **Pagination** | Paginación con info de rango |

| **DataView** | Orquesta LoadingState / ErrorState / EmptyState |



## Mocks y hooks



- `mocks/dashboard.ts` — datos demo del dashboard
- `mocks/movements.ts` — catálogo y query de movimientos
- `mocks/products.ts` — catálogo y query de productos
- `hooks/useDashboardData.ts` — carga simulada dashboard
- `hooks/usePaginatedMockList.ts` — listados paginados (Fase 6)
- `config/data-ui.ts` — textos de UI
- `config/filter-options.ts` — opciones de filtros

Listados funcionales: `/movimientos`, `/productos`



## Uso (Fase 6+)



```tsx

<DataView status={status} error={{ onRetry: refetch }}>

  <ScrollableTable columns={columns} rows={rows} rowKey={(r) => r.id} height="tall" />

  <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />

</DataView>

```



## Contrato scroll



- Tablas largas: `ScrollableTable` con `height="default" | "tall" | "dashboard"`

- Paneles laterales: `PanelBody scroll` + `bx-panel-scroll--fill`

- Dentro de panel sin borde: `flush` en ScrollableTable

