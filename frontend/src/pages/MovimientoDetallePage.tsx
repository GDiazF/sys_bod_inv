import { EmptyState, Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui'
import { skeletonDetailActions } from '@/config/skeleton-actions'
import { ROUTES } from '@/config/routes'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'
import { AppPageSkeleton } from '@/pages/AppPageSkeleton'

export function MovimientoDetallePage() {
  return (
    <AppPageSkeleton
      routeId="movimiento-detalle"
      breadcrumbs={pageBreadcrumbs('MOV-0042', { label: 'Movimientos', to: ROUTES.movimientos })}
      title="MOV-0042"
      lead="Recepción · Bodega central · 12 líneas · Confirmado."
      actions={skeletonDetailActions()}
    >
      <div className="grid gap-4 desktop:grid-cols-[minmax(0,1fr)_minmax(280px,32%)]">
        <Panel>
          <PanelHeader>
            <PanelTitle zone="DET">Líneas del movimiento</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <EmptyState
              title="Detalle pendiente"
              description="Tabla de líneas y totales — Fase 5+."
            />
          </PanelBody>
        </Panel>
        <Panel variant="inset">
          <PanelHeader>
            <PanelTitle zone="TLN">Timeline</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <EmptyState
              title="Timeline pendiente"
              description="Historial de estados — Fase 5+."
            />
          </PanelBody>
        </Panel>
      </div>
    </AppPageSkeleton>
  )
}
