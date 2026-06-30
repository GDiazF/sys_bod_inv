import { type HTMLAttributes } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export type ErrorStateProps = HTMLAttributes<HTMLDivElement> & {
  title?: string
  description?: string
  retryLabel?: string
  onRetry?: () => void
}

export function ErrorState({
  className,
  title = 'Error al cargar datos',
  description = 'No se pudo obtener la información. Intente de nuevo.',
  retryLabel = 'Reintentar',
  onRetry,
  role = 'alert',
  ...props
}: ErrorStateProps) {
  return (
    <div className={cn('bx-error-state', className)} role={role} {...props}>
      <div className="bx-error-state__icon" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <div className="bx-error-state__title">{title}</div>
      <div className="bx-error-state__desc">{description}</div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
