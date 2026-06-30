import { type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Label,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
  Select,
  Textarea,
} from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

function DevSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bx-dev-section">
      <h2 className="bx-dev-section__title">{title}</h2>
      {children}
    </section>
  )
}

export function ComponentsCatalogPage() {
  const [loadingDemo, setLoadingDemo] = useState(false)

  function handleLoadingDemo() {
    setLoadingDemo(true)
    window.setTimeout(() => setLoadingDemo(false), 1500)
  }

  return (
    <div className="flex flex-col gap-10 pb-8">
      <PageHeader
        breadcrumbs={pageBreadcrumbs('Componentes UI')}
        eyebrow="DS · Fase 2"
        title="Catálogo de componentes UI"
        lead={
          <>
            Primitivos reutilizables del sistema BodegaX. Estilos en{' '}
            <code className="font-mono text-xs">src/styles/primitives.css</code>; variantes vía{' '}
            <code className="font-mono text-xs">class-variance-authority</code>.
          </>
        }
      />

      <DevSection title="Button — variantes">
        <div className="bx-component-row">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="primary" loading={loadingDemo} onClick={handleLoadingDemo}>
            {loadingDemo ? 'Cargando' : 'Loading demo'}
          </Button>
        </div>
      </DevSection>

      <DevSection title="Badge — variantes">
        <div className="bx-component-row">
          <Badge variant="success">Confirmado</Badge>
          <Badge variant="warn">Borrador</Badge>
          <Badge variant="danger">Anulado</Badge>
          <Badge variant="neutral">Revisión</Badge>
          <Badge variant="info">En proceso</Badge>
        </div>
      </DevSection>

      <DevSection title="Label + Input + Select + Textarea">
        <div className="grid max-w-2xl gap-5 tablet:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="demo-input" hint="Texto de ayuda opcional">
              Campo default
            </Label>
            <Input id="demo-input" placeholder="Buscar SKU, documento…" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="demo-input-success" required>
              Campo success
            </Label>
            <Input id="demo-input-success" fieldState="success" defaultValue="OC-2026-1847" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="demo-input-error" required error="El proveedor es obligatorio">
              Campo error
            </Label>
            <Input id="demo-input-error" fieldState="error" aria-describedby="demo-input-error-msg" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="demo-select">Select</Label>
            <Select id="demo-select" defaultValue="b1">
              <option value="b1">Bodega principal</option>
              <option value="b2">Bodega secundaria</option>
            </Select>
          </div>
          <div className="col-span-full flex flex-col gap-1">
            <Label htmlFor="demo-textarea">Textarea</Label>
            <Textarea id="demo-textarea" placeholder="Notas del operador, referencia de guía…" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="demo-disabled">Disabled</Label>
            <Input id="demo-disabled" disabled defaultValue="Solo lectura" />
          </div>
        </div>
      </DevSection>

      <DevSection title="Alert — variantes">
        <div className="flex max-w-3xl flex-col gap-3">
          <Alert variant="success" title="Recepción confirmada">
            Stock actualizado correctamente en bodega principal.
          </Alert>
          <Alert variant="warn" title="Ajuste requiere aprobación">
            Los ajustes negativos superiores a 5 unidades requieren autorización de supervisor.
          </Alert>
          <Alert variant="danger" title="No se pudo anular">
            El documento tiene movimientos bloqueados por cierre de periodo.
          </Alert>
          <Alert variant="info" title="Traslado en tránsito">
            Pendiente de recepción en bodega destino.
          </Alert>
        </div>
      </DevSection>

      <DevSection title="Panel — variantes">
        <div className="grid gap-4 desktop:grid-cols-2">
          <Panel>
            <PanelHeader actions={<Badge variant="success">OK</Badge>}>
              <PanelTitle zone="ACT">Actividad reciente</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <p className="text-sm text-muted">Panel default con marcas industriales en esquinas.</p>
            </PanelBody>
          </Panel>
          <Panel variant="accent">
            <PanelHeader>
              <PanelTitle zone="ALT">Alertas de stock</PanelTitle>
            </PanelHeader>
            <PanelBody scroll>
              <ul className="space-y-2 text-sm text-muted">
                {Array.from({ length: 12 }, (_, i) => (
                  <li key={i} className="border-b border-border pb-2 last:border-0">
                    Item de alerta #{i + 1}
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>
          <Panel variant="inset">
            <PanelHeader>
              <PanelTitle>Panel inset</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <p className="text-sm text-muted">Superficie hundida para bloques secundarios.</p>
            </PanelBody>
          </Panel>
        </div>
      </DevSection>

      <DevSection title="LoadingState · EmptyState · ErrorState">
        <div className="grid gap-4 tablet:grid-cols-3">
          <Panel>
            <PanelBody>
              <LoadingState label="Cargando movimientos…" />
            </PanelBody>
          </Panel>
          <Panel>
            <PanelBody>
              <EmptyState
                title="Sin resultados"
                description="No hay registros que coincidan con los filtros."
                actionLabel="Limpiar filtros"
                onAction={() => undefined}
              />
            </PanelBody>
          </Panel>
          <Panel>
            <PanelBody>
              <ErrorState onRetry={() => undefined} />
            </PanelBody>
          </Panel>
        </div>
      </DevSection>

      <DevSection title="Tabla con scroll interno (contrato shell)">
        <Panel>
          <PanelHeader>
            <PanelTitle zone="DAT">Preview DataTable shell</PanelTitle>
          </PanelHeader>
          <div className="bx-table-wrap bx-table-wrap--tall border-0 shadow-none">
            <div className="bx-table-scroll">
              <table className="bx-table">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>SKU</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 20 }, (_, i) => (
                    <tr key={i}>
                      <td className="mono">MOV-{String(i + 1).padStart(4, '0')}</td>
                      <td className="mono">SKU-00{i + 1}</td>
                      <td>
                        <Badge variant={i % 3 === 0 ? 'warn' : 'success'}>
                          {i % 3 === 0 ? 'Pendiente' : 'Confirmado'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      </DevSection>

      <aside className="rounded-lg border border-border bg-surface-inset p-5 text-sm text-muted">
        <strong className="mb-2 block font-display text-fg">Variantes exportadas</strong>
        <ul className="grid gap-1 font-mono text-xs tablet:grid-cols-2">
          <li>Button: primary | secondary | ghost | danger | sm | loading | disabled</li>
          <li>Badge: success | warn | danger | neutral | info</li>
          <li>Input/Select/Textarea: default | error | success | disabled</li>
          <li>Alert: success | warn | danger | info</li>
          <li>Panel: default | inset | accent | scroll body | zone title</li>
        </ul>
        <p className="mt-4">
          <Link to={ROUTES.devTokens} className="font-medium text-accent underline-offset-2 hover:underline">
            Design tokens
          </Link>
          {' · '}
          <Link to={ROUTES.home} className="font-medium text-accent underline-offset-2 hover:underline">
            Scaffold home
          </Link>
        </p>
      </aside>
    </div>
  )
}
