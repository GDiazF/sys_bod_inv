import { cva, type VariantProps } from 'class-variance-authority'
import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

const panelVariants = cva('bx-panel', {
  variants: {
    variant: {
      default: '',
      inset: 'bx-panel--inset',
      accent: 'bx-panel--accent',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export type PanelProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof panelVariants>

export function Panel({ className, variant, children, ...props }: PanelProps) {
  return (
    <div className={cn(panelVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}

export type PanelHeaderProps = HTMLAttributes<HTMLDivElement> & {
  actions?: ReactNode
}

export function PanelHeader({ className, children, actions, ...props }: PanelHeaderProps) {
  return (
    <div className={cn('bx-panel__header', className)} {...props}>
      {typeof children === 'string' ? (
        <strong className="bx-panel__title">{children}</strong>
      ) : (
        children
      )}
      {actions}
    </div>
  )
}

export type PanelTitleProps = HTMLAttributes<HTMLElement> & {
  zone?: string
}

export function PanelTitle({ className, zone, children, ...props }: PanelTitleProps) {
  return (
    <strong className={cn('bx-panel__title', className)} data-zone={zone} {...props}>
      {children}
    </strong>
  )
}

export type PanelBodyProps = HTMLAttributes<HTMLDivElement> & {
  scroll?: boolean
}

export function PanelBody({ className, scroll = false, ...props }: PanelBodyProps) {
  return (
    <div
      className={cn('bx-panel__body', scroll && 'bx-panel__body--scroll', className)}
      {...props}
    />
  )
}

export { panelVariants }
