import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui'
import { ROUTE_PAGE_META } from '@/config/chrome'
import { APP_MAIN_ROUTES } from '@/config/routes'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

export function RoutesPreviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={pageBreadcrumbs('Rutas')}
        eyebrow="DEV · Fase 4"
        title="Páginas esqueleto"
        lead="Todas las rutas principales registradas en el router. Sin lógica de negocio ni API."
      />

      <Panel>
        <PanelHeader>
          <PanelTitle zone="RT">Rutas principales</PanelTitle>
        </PanelHeader>
        <PanelBody>
          <ul className="divide-y divide-border">
            {APP_MAIN_ROUTES.map((route) => {
              const meta = ROUTE_PAGE_META[route.id]
              return (
                <li key={route.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link
                      to={route.path}
                      className="font-medium text-accent underline-offset-2 hover:underline"
                    >
                      {route.path}
                    </Link>
                    <div className="mt-0.5 text-sm text-muted">
                      {meta.title}
                      <span className="mx-2 text-border">·</span>
                      <span className="font-mono text-xs">{route.id}</span>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-steel-mid">
                    {meta.eyebrow}
                  </span>
                </li>
              )
            })}
          </ul>
        </PanelBody>
      </Panel>
    </div>
  )
}
