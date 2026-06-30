import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DataTable,
  DataView,
  ScrollableTable,
  StatCard,
  type DataTableColumn,
} from '@/components/data'
import { PageHeader } from '@/components/layout'
import {
  Alert,
  Badge,
  Button,
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from '@/components/ui'
import { dashboardHeaderActions } from '@/config/dashboard-actions'
import { DATA_UI } from '@/config/data-ui'
import { ROUTE_PAGE_META } from '@/config/chrome'
import { ROUTES, movimientoDetallePath } from '@/config/routes'
import { useDashboardData } from '@/hooks/useDashboardData'
import {
  DOCUMENT_STATUS_BADGES,
  MOVEMENT_STATUS_BADGES,
  type DashboardActivityRow,
  type DashboardPendingDoc,
} from '@/mocks/dashboard'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

export function DashboardPage() {
  const navigate = useNavigate()
  const { status, data, refetch } = useDashboardData()
  const meta = ROUTE_PAGE_META.dashboard

  const activityColumns = useMemo<DataTableColumn<DashboardActivityRow>[]>(
    () => [
      { id: 'documento', header: 'Documento', mono: true, cell: (row) => row.documento },
      { id: 'tipo', header: 'Tipo', cell: (row) => row.tipo },
      { id: 'sku', header: 'SKU', mono: true, cell: (row) => row.sku },
      { id: 'cantidad', header: 'Cantidad', mono: true, cell: (row) => row.cantidad },
      {
        id: 'estado',
        header: 'Estado',
        cell: (row) => {
          const badge = MOVEMENT_STATUS_BADGES[row.estado]
          return <Badge variant={badge.variant}>{badge.label}</Badge>
        },
      },
      { id: 'hora', header: 'Hora', mono: true, cell: (row) => row.hora },
    ],
    [],
  )

  const pendingColumns = useMemo<DataTableColumn<DashboardPendingDoc>[]>(
    () => [
      { id: 'code', header: 'Documento', mono: true, cell: (row) => row.code },
      { id: 'tipo', header: 'Tipo', cell: (row) => row.tipo },
      {
        id: 'estado',
        header: 'Estado',
        cell: (row) => {
          const badge = DOCUMENT_STATUS_BADGES[row.estado]
          return <Badge variant={badge.variant}>{badge.label}</Badge>
        },
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={pageBreadcrumbs(meta.breadcrumbLabel)}
        eyebrow={meta.eyebrow}
        title={meta.title}
        lead={`${meta.lead} Bodega principal · turno mañana.`}
        actions={dashboardHeaderActions()}
      />

      <DataView
        status={status}
        loading={{ label: DATA_UI.dashboard.loading }}
        error={{
          title: DATA_UI.dashboard.errorTitle,
          description: DATA_UI.dashboard.errorDescription,
          onRetry: refetch,
          retryLabel: DATA_UI.dataView.retry,
        }}
        empty={{
          title: DATA_UI.dashboard.emptyTitle,
          description: DATA_UI.dashboard.emptyDescription,
        }}
      >
        {data ? (
          <>
            <div className="bx-grid-stats">
              {data.kpis.map((kpi) => (
                <StatCard
                  key={kpi.kicker}
                  variant={kpi.variant}
                  kicker={kpi.kicker}
                  value={kpi.value}
                  label={kpi.label}
                />
              ))}
            </div>

            <div className="bx-dashboard-layout mt-6">
              <div className="bx-dashboard-main">
                <Panel>
                  <PanelHeader
                    actions={
                      <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.movimientos)}>
                        Ver todo
                      </Button>
                    }
                  >
                    <PanelTitle zone="ACT">Actividad reciente</PanelTitle>
                  </PanelHeader>
                  <ScrollableTable
                    flush
                    height="dashboard"
                    columns={activityColumns}
                    rows={data.activity}
                    rowKey={(row) => row.id}
                    caption={DATA_UI.dashboard.activityCaption}
                    onRowClick={(row) => navigate(movimientoDetallePath(row.documento))}
                  />
                </Panel>
              </div>

              <div className="bx-dashboard-side">
                <Panel variant="accent">
                  <PanelHeader>
                    <PanelTitle zone="ALT">Alertas de stock</PanelTitle>
                  </PanelHeader>
                  <PanelBody scroll className="bx-panel-scroll--fill">
                    <div className="bx-alert-list">
                      {data.alerts.map((alert) => (
                        <Alert key={alert.id} variant={alert.variant} title={alert.title}>
                          {alert.message}
                        </Alert>
                      ))}
                    </div>
                  </PanelBody>
                </Panel>

                <Panel>
                  <PanelHeader>
                    <PanelTitle zone="DOC">Documentos pendientes</PanelTitle>
                  </PanelHeader>
                  <PanelBody scroll className="bx-panel-scroll--fill !p-0">
                    <DataTable
                      columns={pendingColumns}
                      rows={data.pendingDocs}
                      rowKey={(row) => row.id}
                      caption={DATA_UI.dashboard.pendingDocsCaption}
                      onRowClick={(row) => navigate(row.path)}
                    />
                  </PanelBody>
                </Panel>
              </div>
            </div>
          </>
        ) : null}
      </DataView>
    </div>
  )
}
