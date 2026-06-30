import { useMemo } from 'react'
import {
  DataView,
  FilterBar,
  Pagination,
  ScrollableTable,
  type DataTableColumn,
} from '@/components/data'
import { PageHeader } from '@/components/layout'
import { Badge, Button, Input, Panel, Select } from '@/components/ui'
import { DATA_UI } from '@/config/data-ui'
import { ROUTE_PAGE_META } from '@/config/chrome'
import {
  PRODUCTO_CATEGORIA_OPTIONS,
  PRODUCTO_STOCK_OPTIONS,
} from '@/config/filter-options'
import { productosHeaderActions } from '@/config/list-actions'
import { useProductosList } from '@/hooks/useProductosList'
import { type ProductRow } from '@/mocks/products'
import {
  formatStockNumber,
  PRODUCT_STOCK_STATUS_BADGES,
} from '@/mocks/status-labels'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

export function ProductosPage() {
  const meta = ROUTE_PAGE_META.productos

  const list = useProductosList(6)

  const columns = useMemo<DataTableColumn<ProductRow>[]>(
    () => [
      { id: 'sku', header: 'SKU', mono: true, cell: (row) => row.sku },
      {
        id: 'name',
        header: 'Producto',
        cell: (row) => (
          <div className="flex flex-col gap-0.5">
            <span>{row.name}</span>
            <span className="font-mono text-[11px] text-muted">{row.sub}</span>
          </div>
        ),
      },
      { id: 'category', header: 'Categoría', cell: (row) => row.category },
      {
        id: 'stock',
        header: 'Stock',
        mono: true,
        cell: (row) => formatStockNumber(row.stock),
      },
      { id: 'min', header: 'Mín.', mono: true, cell: (row) => formatStockNumber(row.min) },
      { id: 'location', header: 'Ubicación', mono: true, cell: (row) => row.location },
      {
        id: 'status',
        header: 'Estado',
        cell: (row) => {
          const badge = PRODUCT_STOCK_STATUS_BADGES[row.status]
          return <Badge variant={badge.variant}>{badge.label}</Badge>
        },
      },
      { id: 'lastMove', header: 'Últ. mov.', mono: true, cell: (row) => row.lastMove },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={pageBreadcrumbs(meta.breadcrumbLabel)}
        eyebrow={meta.eyebrow}
        title={meta.title}
        lead={meta.lead}
        actions={productosHeaderActions()}
      />

      <FilterBar
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={list.clearFilters}>
              {DATA_UI.filterBar.clear}
            </Button>
            <Button variant="secondary" size="sm" onClick={list.applyFilters}>
              {DATA_UI.filterBar.apply}
            </Button>
          </>
        }
      >
        <FilterBar.Field label="Buscar" className="min-w-[180px] flex-[2]">
          <Input
            type="search"
            value={list.draftFilters.q}
            placeholder={DATA_UI.productos.searchPlaceholder}
            aria-label="Buscar productos"
            onChange={(event) => list.updateDraftFilter('q', event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                list.applyFilters()
              }
            }}
          />
        </FilterBar.Field>
        <FilterBar.Field label="Categoría">
          <Select
            value={list.draftFilters.category}
            aria-label="Filtrar por categoría"
            onChange={(event) =>
              list.updateDraftFilter('category', event.target.value as typeof list.draftFilters.category)
            }
          >
            {PRODUCTO_CATEGORIA_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FilterBar.Field>
        <FilterBar.Field label="Estado stock">
          <Select
            value={list.draftFilters.stockStatus}
            aria-label="Filtrar por estado de stock"
            onChange={(event) =>
              list.updateDraftFilter(
                'stockStatus',
                event.target.value as typeof list.draftFilters.stockStatus,
              )
            }
          >
            {PRODUCTO_STOCK_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FilterBar.Field>
      </FilterBar>

      <DataView
        status={list.status}
        loading={{ label: DATA_UI.productos.loading }}
        error={{
          title: DATA_UI.productos.errorTitle,
          description: DATA_UI.productos.errorDescription,
          onRetry: list.refetch,
          retryLabel: DATA_UI.dataView.retry,
        }}
        empty={{
          title: DATA_UI.productos.emptyTitle,
          description: DATA_UI.productos.emptyDescription,
          actionLabel: DATA_UI.filterBar.clear,
          onAction: list.clearFilters,
        }}
      >
        {list.result ? (
          <Panel className="overflow-hidden">
            <ScrollableTable
              flush
              height="tall"
              columns={columns}
              rows={list.result.items}
              rowKey={(row) => row.sku}
              caption={DATA_UI.productos.caption}
            />
            <Pagination
              page={list.page}
              pageSize={list.pageSize}
              total={list.result.total}
              itemLabel={DATA_UI.productos.paginationLabel}
              onPageChange={list.setPage}
            />
          </Panel>
        ) : null}
      </DataView>
    </div>
  )
}
