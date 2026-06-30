import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
  MOVIMIENTO_TIPO_OPTIONS,
} from '@/config/filter-options'
import { movimientosHeaderActions } from '@/config/list-actions'
import { ROUTES, movimientoDetallePath } from '@/config/routes'
import { useMovimientosList } from '@/hooks/useMovimientosList'
import { type MovementRow } from '@/mocks/movements'
import {
  formatMovementQty,
  MOVEMENT_LIST_STATUS_BADGES,
} from '@/mocks/status-labels'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

export function MovimientosPage() {
  const navigate = useNavigate()
  const meta = ROUTE_PAGE_META.movimientos

  const list = useMovimientosList(7)

  const columns = useMemo<DataTableColumn<MovementRow>[]>(
    () => [
      { id: 'id', header: 'Movimiento', mono: true, cell: (row) => row.id },
      { id: 'type', header: 'Tipo', cell: (row) => row.type },
      { id: 'doc', header: 'Documento', mono: true, cell: (row) => row.doc },
      { id: 'sku', header: 'SKU', mono: true, cell: (row) => row.sku },
      { id: 'product', header: 'Producto', cell: (row) => row.product },
      {
        id: 'qty',
        header: 'Cantidad',
        mono: true,
        cell: (row) => formatMovementQty(row.qty, row.qtyDisplay),
      },
      { id: 'location', header: 'Ubicación', mono: true, cell: (row) => row.location },
      {
        id: 'status',
        header: 'Estado',
        cell: (row) => {
          const badge = MOVEMENT_LIST_STATUS_BADGES[row.status]
          return <Badge variant={badge.variant}>{badge.label}</Badge>
        },
      },
      { id: 'date', header: 'Fecha', mono: true, cell: (row) => row.date },
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
        actions={movimientosHeaderActions()}
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
            placeholder={DATA_UI.movimientos.searchPlaceholder}
            aria-label="Buscar movimientos"
            onChange={(event) => list.updateDraftFilter('q', event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                list.applyFilters()
              }
            }}
          />
        </FilterBar.Field>
        <FilterBar.Field label="Tipo">
          <Select
            value={list.draftFilters.type}
            aria-label="Filtrar por tipo"
            onChange={(event) =>
              list.updateDraftFilter('type', event.target.value as typeof list.draftFilters.type)
            }
          >
            {MOVIMIENTO_TIPO_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FilterBar.Field>
        <FilterBar.Field label="Desde">
          <Input
            type="date"
            value={list.draftFilters.from}
            aria-label="Fecha desde"
            onChange={(event) => list.updateDraftFilter('from', event.target.value)}
          />
        </FilterBar.Field>
        <FilterBar.Field label="Hasta">
          <Input
            type="date"
            value={list.draftFilters.to}
            aria-label="Fecha hasta"
            onChange={(event) => list.updateDraftFilter('to', event.target.value)}
          />
        </FilterBar.Field>
      </FilterBar>

      <DataView
        status={list.status}
        loading={{ label: DATA_UI.movimientos.loading }}
        error={{
          title: DATA_UI.movimientos.errorTitle,
          description: DATA_UI.movimientos.errorDescription,
          onRetry: list.refetch,
          retryLabel: DATA_UI.dataView.retry,
        }}
        empty={{
          title: DATA_UI.movimientos.emptyTitle,
          description: DATA_UI.movimientos.emptyDescription,
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
              rowKey={(row) => row.id}
              caption={DATA_UI.movimientos.caption}
              onRowClick={(row) => navigate(movimientoDetallePath(row.id))}
            />
            <Pagination
              page={list.page}
              pageSize={list.pageSize}
              total={list.result.total}
              itemLabel={DATA_UI.movimientos.paginationLabel}
              onPageChange={list.setPage}
            />
          </Panel>
        ) : null}
      </DataView>
    </div>
  )
}
