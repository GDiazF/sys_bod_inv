import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type LoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  label?: string
}

export function LoadingState({
  className,
  label = 'Cargando…',
  role = 'status',
  'aria-live': ariaLive = 'polite',
  ...props
}: LoadingStateProps) {
  return (
    <div className={cn('bx-loading-state', className)} role={role} aria-live={ariaLive} {...props}>
      <div className="bx-spinner" aria-hidden />
      <div className="bx-loading-state__label">{label}</div>
    </div>
  )
}

export function Spinner({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bx-spinner', className)} role="status" aria-label="Cargando" {...props} />
}
