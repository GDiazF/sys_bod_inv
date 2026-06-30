import { useNavigate } from 'react-router-dom'
import { Button, Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui'
import { PageHeader } from '@/components/layout'
import { ROUTES } from '@/config/routes'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

export function LayoutPreviewPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        breadcrumbs={pageBreadcrumbs('Layout base')}
        eyebrow="LAY · Fase 3"
        title="Shell y layout de página"
        lead="AppShell modularizado: Sidebar, Topbar, MainContent, PageHeader y Breadcrumbs. Contrato overflow-hidden + scroll interno preservado."
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.dashboard)}>
            Ir a dashboard
          </Button>
        }
      />

      <section className="grid gap-4 desktop:grid-cols-2">
        <Panel>
          <PanelHeader>
            <PanelTitle zone="SHL">AppShell</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <strong className="text-fg">Sidebar</strong> — fija desktop, drawer móvil, nav activo
              </li>
              <li>
                <strong className="text-fg">Topbar</strong> — título/meta por ruta, toggle menú
              </li>
              <li>
                <strong className="text-fg">MainContent</strong> — scroll vertical, reset al navegar
              </li>
            </ul>
          </PanelBody>
        </Panel>
        <Panel variant="inset">
          <PanelHeader>
            <PanelTitle zone="PGH">PageHeader</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <ul className="space-y-2 text-sm text-muted">
              <li>Breadcrumbs → eyebrow → título → lead → acciones</li>
              <li>Responsive: acciones full-width en móvil</li>
              <li>Animación entrada: bx-page-enter (respeta reduced-motion)</li>
            </ul>
          </PanelBody>
        </Panel>
      </section>

      <section>
        <h2 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-steel-mid">
          Ejemplo documento (sin migrar)
        </h2>
        <PageHeader
          breadcrumbs={pageBreadcrumbs('REC-0089', { label: 'Recepción', to: ROUTES.recepcion })}
          eyebrow="DOC · Recepción"
          title="REC-0089"
          actions={
            <>
              <Button variant="ghost" size="sm">
                Anular
              </Button>
              <Button variant="secondary" size="sm">
                Guardar
              </Button>
              <Button variant="primary" size="sm">
                Confirmar recepción
              </Button>
            </>
          }
        />
      </section>

      <section>
        <h2 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-steel-mid">
          Ejemplo listado (sin migrar)
        </h2>
        <PageHeader
          breadcrumbs={pageBreadcrumbs('Movimientos')}
          eyebrow="INV · Movimientos"
          title="Historial de movimientos"
          actions={
            <>
              <Button variant="secondary" size="sm">
                Exportar
              </Button>
              <Button variant="primary" size="sm">
                Nuevo documento
              </Button>
            </>
          }
        />
      </section>

      <Panel>
        <PanelHeader>
          <PanelTitle zone="BRK">Breakpoints a revisar</PanelTitle>
        </PanelHeader>
        <PanelBody>
          <p className="text-sm text-muted">
            Desktop ≥1280px · Tablet ≤1024px · Móvil ≤768px. Verificar sidebar drawer, topbar status oculto en
            móvil, y acciones del page header en wrap.
          </p>
        </PanelBody>
      </Panel>
    </div>
  )
}
