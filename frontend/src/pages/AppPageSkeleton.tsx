import { type ReactNode } from 'react'
import { PageHeader } from '@/components/layout'
import type { BreadcrumbItem } from '@/components/layout/Breadcrumbs'
import { EmptyState, Panel, PanelBody } from '@/components/ui'
import { ROUTE_PAGE_META } from '@/config/chrome'
import type { AppRouteId } from '@/config/routes'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

export type AppPageSkeletonProps = {
  routeId: AppRouteId
  breadcrumbs?: BreadcrumbItem[]
  eyebrow?: string
  title?: string
  lead?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

export function AppPageSkeleton({
  routeId,
  breadcrumbs,
  eyebrow,
  title,
  lead,
  actions,
  children,
}: AppPageSkeletonProps) {
  const meta = ROUTE_PAGE_META[routeId]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={breadcrumbs ?? pageBreadcrumbs(meta.breadcrumbLabel)}
        eyebrow={eyebrow ?? meta.eyebrow}
        title={title ?? meta.title}
        lead={lead ?? meta.lead}
        actions={actions}
      />
      {children ?? (
        <Panel>
          <PanelBody>
            <EmptyState
              title="Pantalla en preparación"
              description={`Esqueleto Fase 4 · migración pendiente desde Proyecto/index.html#${routeId}.`}
            />
          </PanelBody>
        </Panel>
      )}
    </div>
  )
}
