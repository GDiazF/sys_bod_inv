import { cva, type VariantProps } from 'class-variance-authority'
import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

const alertVariants = cva('bx-alert', {
  variants: {
    variant: {
      success: 'bx-alert--success',
      warn: 'bx-alert--warn',
      danger: 'bx-alert--danger',
      info: 'bx-alert--info',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
})

function AlertIcon({ variant }: { variant: NonNullable<AlertProps['variant']> }) {
  if (variant === 'success') {
    return (
      <svg className="bx-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    )
  }
  if (variant === 'warn') {
    return (
      <svg className="bx-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    )
  }
  if (variant === 'danger') {
    return (
      <svg className="bx-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    )
  }
  return (
    <svg className="bx-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

export type AlertProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    title?: string
    children?: ReactNode
  }

export function Alert({ className, variant = 'info', title, children, role = 'status', ...props }: AlertProps) {
  const resolvedVariant = variant ?? 'info'
  return (
    <div className={cn(alertVariants({ variant: resolvedVariant }), className)} role={role} {...props}>
      <AlertIcon variant={resolvedVariant} />
      <div>
        {title ? <div className="bx-alert__title">{title}</div> : null}
        {children}
      </div>
    </div>
  )
}

export { alertVariants }
