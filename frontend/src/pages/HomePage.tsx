import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { ROUTES } from '@/config/routes'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

const DEMO_ROWS = Array.from({ length: 24 }, (_, index) => ({
  id: `ROW-${String(index + 1).padStart(3, '0')}`,
  label: `Registro demo ${index + 1}`,
}))

export function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={pageBreadcrumbs('Scaffold')}
        eyebrow="SYS · Scaffold"
        title="Base frontend lista"
        lead={
          <>
            Fases 0–4: tokens, primitivos, layout y rutas esqueleto. El shell mantiene{' '}
            <code className="font-mono text-xs">overflow-hidden</code> en viewport; tablas y paneles usan scroll
            interno.
          </>
        }
      />

      <div className="grid gap-4 desktop:grid-cols-[minmax(0,1fr)_minmax(280px,28%)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border-strong bg-surface-raised shadow-panel">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <strong className="font-mono text-[11px] uppercase tracking-widest text-steel">
              Demo · tabla con scroll interno
            </strong>
            <span className="font-mono text-[10px] text-muted">bx-table-wrap</span>
          </div>
          <div className="bx-table-wrap bx-table-wrap--tall min-h-0 flex-1 border-0 shadow-none">
            <div className="bx-table-scroll">
              <table className="bx-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ROWS.map((row) => (
                    <tr key={row.id}>
                      <td className="mono">{row.id}</td>
                      <td>{row.label}</td>
                      <td>
                        <span className="inline-flex rounded-sm border border-border bg-surface-inset px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                          Demo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border-strong bg-surface-raised shadow-panel">
          <div className="shrink-0 border-b border-border px-5 py-4">
            <strong className="font-mono text-[11px] uppercase tracking-widest text-steel">
              Demo · panel scroll
            </strong>
          </div>
          <div className="bx-panel-scroll flex-1 p-5">
            <ul className="space-y-3 text-sm text-muted">
              {DEMO_ROWS.slice(0, 16).map((row) => (
                <li key={row.id} className="border-b border-border pb-3 last:border-0">
                  <span className="font-mono text-xs text-fg">{row.id}</span>
                  <div>{row.label}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <p className="text-sm text-muted">
        Validación:{' '}
        <Link to={ROUTES.devLayout} className="font-medium text-accent underline-offset-2 hover:underline">
          /dev/layout
        </Link>
        {' · '}
        <Link to={ROUTES.devTokens} className="font-medium text-accent underline-offset-2 hover:underline">
          /dev/tokens
        </Link>
        {' · '}
        <Link to={ROUTES.devComponents} className="font-medium text-accent underline-offset-2 hover:underline">
          /dev/components
        </Link>
        {' · '}
        <Link to={ROUTES.devRoutes} className="font-medium text-accent underline-offset-2 hover:underline">
          /dev/routes
        </Link>
        {' · '}
        <Link to={ROUTES.devData} className="font-medium text-accent underline-offset-2 hover:underline">
          /dev/data
        </Link>
        . Dashboard funcional con mocks; listados en /movimientos y /productos (Fase 6).
      </p>
    </div>
  )
}
