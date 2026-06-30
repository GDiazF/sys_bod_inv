import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { ROUTES } from '@/config/routes'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

type SwatchProps = {
  name: string
  className: string
  token: string
}

function Swatch({ name, className, token }: SwatchProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-14 rounded-md border border-border-strong ${className}`} />
      <div className="font-mono text-[10px] font-semibold uppercase tracking-wide text-steel">{name}</div>
      <div className="font-mono text-[10px] text-muted">{token}</div>
    </div>
  )
}

const COLOR_SWATCHES: SwatchProps[] = [
  { name: 'bg', className: 'bg-bg', token: '--bg' },
  { name: 'surface', className: 'bg-surface', token: '--surface' },
  { name: 'surface-raised', className: 'bg-surface-raised', token: '--surface-raised' },
  { name: 'surface-inset', className: 'bg-surface-inset', token: '--surface-inset' },
  { name: 'accent', className: 'bg-accent', token: '--accent' },
  { name: 'accent-muted', className: 'bg-accent-muted', token: '--accent-muted' },
  { name: 'steel', className: 'bg-steel', token: '--steel' },
  { name: 'steel-light', className: 'bg-steel-light', token: '--steel-light' },
  { name: 'success', className: 'bg-success', token: '--success' },
  { name: 'warn', className: 'bg-warn', token: '--warn' },
  { name: 'danger', className: 'bg-danger', token: '--danger' },
  { name: 'info', className: 'bg-info', token: '--info' },
  { name: 'sidebar-bg', className: 'bg-sidebar-bg', token: '--sidebar-bg' },
  { name: 'teal-bg', className: 'bg-teal-bg', token: '--teal-bg' },
]

const SPACING_SAMPLES = ['1', '2', '3', '4', '5', '6', '8', '10'] as const

export function DesignTokensPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        breadcrumbs={pageBreadcrumbs('Design tokens')}
        eyebrow="DS · Fase 1"
        title="Design tokens"
        lead={
          <>
            Paleta y espaciado importados de{' '}
            <code className="font-mono text-xs">Proyecto/css/bodega-system.css</code>. Tailwind referencia
            variables CSS; no hay valores sueltos en componentes.
          </>
        }
      />

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">Colores semánticos</h2>
        <div className="grid grid-cols-2 gap-4 tablet:grid-cols-4 desktop:grid-cols-7">
          {COLOR_SWATCHES.map((swatch) => (
            <Swatch key={swatch.token} {...swatch} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">Tipografía</h2>
        <div className="grid gap-4 tablet:grid-cols-3">
          <div className="rounded-lg border border-border-strong bg-surface-raised p-5 shadow-panel">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">Display</div>
            <p className="font-display text-2xl font-bold tracking-tight">Plus Jakarta Sans</p>
          </div>
          <div className="rounded-lg border border-border-strong bg-surface-raised p-5 shadow-panel">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">Body</div>
            <p className="font-body text-base">IBM Plex Sans — cuerpo operativo 14px</p>
          </div>
          <div className="rounded-lg border border-border-strong bg-surface-raised p-5 shadow-panel">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">Mono</div>
            <p className="font-mono text-base">IBM Plex Mono · SKU-004821</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">Espaciado (--space-*)</h2>
        <div className="flex flex-wrap items-end gap-4">
          {SPACING_SAMPLES.map((space) => (
            <div key={space} className="flex flex-col items-center gap-2">
              <div className={`bg-accent w-${space} h-${space}`} />
              <span className="font-mono text-[10px] text-muted">space-{space}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">Layout tokens</h2>
        <dl className="grid gap-3 font-mono text-xs tablet:grid-cols-2">
          <div className="rounded-md border border-border bg-surface-inset px-4 py-3">
            <dt className="text-muted">--sidebar-w</dt>
            <dd className="mt-1 text-fg">Ancho sidebar (responsive)</dd>
          </div>
          <div className="rounded-md border border-border bg-surface-inset px-4 py-3">
            <dt className="text-muted">--header-h</dt>
            <dd className="mt-1 text-fg">Altura topbar</dd>
          </div>
          <div className="rounded-md border border-border bg-surface-inset px-4 py-3">
            <dt className="text-muted">--content-gutter</dt>
            <dd className="mt-1 text-fg">Padding horizontal contenido</dd>
          </div>
          <div className="rounded-md border border-border bg-surface-inset px-4 py-3">
            <dt className="text-muted">--table-max-h</dt>
            <dd className="mt-1 text-fg">Scroll interno tablas</dd>
          </div>
        </dl>
      </section>

      <p className="text-sm text-muted">
        <Link to={ROUTES.devComponents} className="font-medium text-accent underline-offset-2 hover:underline">
          Componentes UI
        </Link>
        {' · '}
        <Link to={ROUTES.home} className="font-medium text-accent underline-offset-2 hover:underline">
          Scaffold home
        </Link>
      </p>
    </div>
  )
}
