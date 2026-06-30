import { useMemo, useState } from 'react'
import {
  DataTable,
  DataView,
  FilterBar,
  Pagination,
  ScrollableTable,
  StatCard,
  type DataTableColumn,
} from '@/components/data'
import { PageHeader } from '@/components/layout'
import { Badge, Button, Input, Panel, PanelBody, PanelHeader, PanelTitle, Select } from '@/components/ui'
import { DATA_UI } from '@/config/data-ui'
import { MOCK_DASHBOARD_DATA, MOCK_LIST_ROWS } from '@/mocks/dashboard'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

type DemoRow = (typeof MOCK_LIST_ROWS)[number]

function DevSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bx-dev-section">
      <h2 className="bx-dev-section__title">{title}</h2>
      {children}
    </section>
  )
}

export function DataComponentsPage() {
  const [page, setPage] = useState(1)
  const [demoStatus, setDemoStatus] = useState<'success' | 'loading' | 'error' | 'empty'>('success')
  const pageSize = 5
  const total = MOCK_LIST_ROWS.length

  const columns = useMemo<DataTableColumn<DemoRow>[]>(
    () => [
      { id: 'id', header: 'ID', mono: true, cell: (row) => row.id },
      { id: 'sku', header: 'SKU', mono: true, cell: (row) => row.sku },
      { id: 'producto', header: 'Producto', cell: (row) => row.producto },
      { id: 'stock', header: 'Stock', mono: true, cell: (row) => row.stock },
      {
        id: 'estado',
        header: 'Estado',
        cell: () => <Badge variant="neutral">Demo</Badge>,
      },
    ],
    [],
  )

  const pagedRows = MOCK_LIST_ROWS.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="flex flex-col gap-10 pb-8">
      <PageHeader
        breadcrumbs={pageBreadcrumbs('Componentes de datos')}
        eyebrow="DS · Fase 5"
        title="Capa de datos"
        lead="StatCard, FilterBar, DataTable, ScrollableTable, Pagination y DataView. Estilos en src/styles/data.css."
      />

      <DevSection title="StatCard — variantes">
        <div className="bx-grid-stats">
          {MOCK_DASHBOARD_DATA.kpis.map((kpi) => (
            <StatCard
              key={kpi.kicker}
              variant={kpi.variant}
              kicker={kpi.kicker}
              value={kpi.value}
              label={kpi.label}
            />
          ))}
        </div>
      </DevSection>

      <DevSection title="FilterBar">
        <FilterBar
          actions={
            <>
              <Button variant="ghost" size="sm">
                {DATA_UI.filterBar.clear}
              </Button>
              <Button variant="secondary" size="sm">
                {DATA_UI.filterBar.apply}
              </Button>
            </>
          }
        >
          <FilterBar.Field label="Buscar">
            <Input placeholder={DATA_UI.filterBar.searchPlaceholder} />
          </FilterBar.Field>
          <FilterBar.Field label="Tipo">
            <Select defaultValue="">
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </Select>
          </FilterBar.Field>
          <FilterBar.Field label="Estado">
            <Select defaultValue="">
              <option value="">Todos</option>
              <option value="confirmado">Confirmado</option>
              <option value="pendiente">Pendiente</option>
            </Select>
          </FilterBar.Field>
        </FilterBar>
      </DevSection>

      <DevSection title="DataView — estados">
        <div className="mb-4 flex flex-wrap gap-2">
          {(['success', 'loading', 'error', 'empty'] as const).map((state) => (
            <Button
              key={state}
              variant={demoStatus === state ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setDemoStatus(state)}
            >
              {state}
            </Button>
          ))}
        </div>
        <Panel>
          <PanelBody>
            <DataView
              status={demoStatus}
              loading={{ label: DATA_UI.dataView.loading }}
              error={{
                title: DATA_UI.dataView.errorTitle,
                description: DATA_UI.dataView.errorDescription,
                onRetry: () => setDemoStatus('success'),
                retryLabel: DATA_UI.dataView.retry,
              }}
              empty={{
                title: DATA_UI.dataView.emptyTitle,
                description: DATA_UI.dataView.emptyDescription,
              }}
            >
              <p className="text-sm text-muted">Contenido cargado correctamente (mock).</p>
            </DataView>
          </PanelBody>
        </Panel>
      </DevSection>

      <DevSection title="ScrollableTable + Pagination">
        <Panel>
          <PanelHeader>
            <PanelTitle zone="TBL">Listado demo</PanelTitle>
          </PanelHeader>
          <ScrollableTable
            flush
            height="tall"
            columns={columns}
            rows={pagedRows}
            rowKey={(row) => row.id}
            caption="Tabla paginada de demostración"
          />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            itemLabel="productos"
          />
        </Panel>
      </DevSection>

      <DevSection title="DataTable — compacta (sin scroll wrap)">
        <Panel>
          <PanelBody className="!p-0">
            <DataTable
              columns={columns.slice(0, 4)}
              rows={MOCK_LIST_ROWS.slice(0, 4)}
              rowKey={(row) => row.id}
              caption="Tabla compacta"
            />
          </PanelBody>
        </Panel>
      </DevSection>
    </div>
  )
}
