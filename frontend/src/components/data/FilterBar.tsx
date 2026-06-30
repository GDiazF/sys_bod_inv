import { type HTMLAttributes, type ReactNode } from 'react'
import { Label } from '@/components/ui/Label'
import { cn } from '@/lib/cn'

export type FilterBarProps = HTMLAttributes<HTMLDivElement> & {
  actions?: ReactNode
}

export function FilterBar({ className, children, actions, ...props }: FilterBarProps) {
  return (
    <div className={cn('bx-filter-bar', className)} role="search" {...props}>
      {children}
      {actions ? <div className="bx-filter-bar__actions">{actions}</div> : null}
    </div>
  )
}

export type FilterFieldProps = {
  label: string
  children: ReactNode
  className?: string
}

function FilterField({ label, children, className }: FilterFieldProps) {
  return (
    <div className={cn('bx-filter-bar__field', className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

FilterBar.Field = FilterField
