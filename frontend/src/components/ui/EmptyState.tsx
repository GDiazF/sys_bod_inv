import { type HTMLAttributes, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export function EmptyState({
  className,
  title = 'Sin resultados',
  description = 'No hay registros que coincidan con los filtros aplicados.',
  actionLabel,
  onAction,
  icon,
  role = 'status',
  ...props
}: EmptyStateProps) {
  return (
    <div className={cn('bx-empty-state', className)} role={role} {...props}>
      <div className="bx-empty-state__icon" aria-hidden>
        {icon ?? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          </svg>
        )}
      </div>
      <div className="bx-empty-state__title">{title}</div>
      <div className="bx-empty-state__desc">{description}</div>
      {actionLabel ? (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
