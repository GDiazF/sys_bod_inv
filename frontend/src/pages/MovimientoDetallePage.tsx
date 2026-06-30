import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataView, ScrollableTable, type DataTableColumn } from '@/components/data'
import { DocMetaItem, DocMetaRow, DocSummary, DocSummaryItem } from '@/components/document'
import { PageHeader } from '@/components/layout'
import {
  Badge,
  Button,
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from '@/components/ui'
import { ROUTE_PAGE_META } from '@/config/chrome'
import { DATA_UI } from '@/config/data-ui'
import { ROUTES, movimientoDetallePath } from '@/config/routes'
import { useMovementDetail } from '@/hooks/useMovementDetail'
import type { MovementDetailLine } from '@/mocks/movement-detail'
import {
  formatMovementQty,
  MOVEMENT_LIST_STATUS_BADGES,
} from '@/mocks/status-labels'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

export function MovimientoDetallePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const meta = ROUTE_PAGE_META['movimiento-detalle']
  const { status, detail, refetch, isNotFound } = useMovementDetail(id)

  const columns = useMemo<DataTableColumn<MovementDetailLine>[]>(
    () => [
      { id: 'line', header: 'Línea', mono: true, cell: (row) => row.lineNumber },
      { id: 'sku', header: 'SKU', mono: true, cell: (row) => row.sku },
      { id: 'product', header: 'Producto', cell: (row) => row.product },
      {
        id: 'qty',
        header: 'Cantidad',
        mono: true,
        cell: (row) => formatMovementQty(row.qty, row.qtyDisplay),
      },
      { id: 'location', header: 'Ubicación', mono: true, cell: (row) => row.location },
      { id: 'unitCost', header: 'Costo unit.', mono: true, cell: (row) => row.unitCost ?? '—' },
      { id: 'totalCost', header: 'Costo total', mono: true, cell: (row) => row.totalCost ?? '—' },
    ],
    [],
  )

  const headerBadge = detail
    ? MOVEMENT_LIST_STATUS_BADGES[detail.status]
    : MOVEMENT_LIST_STATUS_BADGES.confirmado

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={pageBreadcrumbs(detail?.id ?? meta.breadcrumbLabel, {
          label: 'Movimientos',
          to: ROUTES.movimientos,
        })}
        eyebrow={meta.eyebrow}
        title={detail?.id ?? meta.title}
        lead={detail?.lead ?? meta.lead}
        actions={
          <>
            <Badge variant={headerBadge.variant}>{headerBadge.label}</Badge>
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.movimientos)}>
              Volver
            </Button>
            <Button variant="secondary" size="sm" disabled>
              Imprimir
            </Button>
          </>
        }
      />

      <DataView
        status={status}
        loading={{ label: DATA_UI.movimientoDetalle.loading }}
        error={{
          title: DATA_UI.movimientoDetalle.errorTitle,
          description: DATA_UI.movimientoDetalle.errorDescription,
          onRetry: refetch,
          retryLabel: DATA_UI.dataView.retry,
        }}
        empty={{
          title: isNotFound
            ? DATA_UI.movimientoDetalle.notFoundTitle
            : DATA_UI.movimientoDetalle.emptyTitle,
          description: isNotFound
            ? DATA_UI.movimientoDetalle.notFoundDescription
            : DATA_UI.movimientoDetalle.emptyDescription,
          actionLabel: DATA_UI.movimientoDetalle.backToList,
          onAction: () => navigate(ROUTES.movimientos),
        }}
      >
        {detail ? (
          <>
            <DocSummary>
              <DocSummaryItem label="Tipo" value={detail.type} />
              <DocSummaryItem label="Documento" value={detail.doc} />
              <DocSummaryItem label="Fecha" value={detail.date} />
              <DocSummaryItem label="Ubicación" value={detail.location} />
            </DocSummary>

            {detail.observacion ? (
              <DocMetaRow>
                <DocMetaItem label="Observación" value={detail.observacion} />
              </DocMetaRow>
            ) : null}

            <div className="grid gap-4 desktop:grid-cols-[minmax(0,1fr)_minmax(280px,32%)]">
              <Panel>
                <PanelHeader>
                  <PanelTitle zone="DET">Líneas del movimiento</PanelTitle>
                </PanelHeader>
                <PanelBody className="!p-0">
                  <ScrollableTable
                    flush
                    height="tall"
                    columns={columns}
                    rows={detail.lines}
                    rowKey={(row) => String(row.lineNumber)}
                    caption={DATA_UI.movimientoDetalle.linesCaption}
                  />
                </PanelBody>
              </Panel>

              <Panel variant="inset">
                <PanelHeader>
                  <PanelTitle zone="TLN">Timeline</PanelTitle>
                </PanelHeader>
                <PanelBody>
                  <ol className="flex flex-col gap-4">
                    {detail.timeline.map((event, index) => (
                      <li key={event.id} className="flex gap-3">
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--color-accent)]"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">
                            {event.label}
                          </p>
                          <p className="font-mono text-xs text-[var(--color-text-muted)]">
                            {event.timestamp}
                          </p>
                          {event.description ? (
                            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                              {event.description}
                            </p>
                          ) : null}
                        </div>
                        {index < detail.timeline.length - 1 ? (
                          <span className="sr-only">Siguiente evento</span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </PanelBody>
              </Panel>
            </div>
          </>
        ) : null}
      </DataView>
    </div>
  )
}
