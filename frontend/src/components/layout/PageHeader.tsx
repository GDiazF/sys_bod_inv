import { type ReactNode } from 'react'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/Breadcrumbs'
import { cn } from '@/lib/cn'

export type PageHeaderProps = {
  eyebrow?: string
  title: string
  lead?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('bx-page-header', className)}>
      <div className="bx-page-header__main">
        {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumbs items={breadcrumbs} /> : null}
        {eyebrow ? <div className="bx-page-eyebrow">{eyebrow}</div> : null}
        <h1 className="bx-page-title">{title}</h1>
        {lead ? <p className="bx-page-lead">{lead}</p> : null}
      </div>
      {actions ? <div className="bx-page-header__actions">{actions}</div> : null}
    </header>
  )
}
