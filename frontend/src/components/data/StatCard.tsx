import { cva, type VariantProps } from 'class-variance-authority'
import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const statCardVariants = cva('bx-stat', {
  variants: {
    variant: {
      default: '',
      hero: 'bx-stat--hero',
      accent: 'bx-stat--accent',
      inset: 'bx-stat--inset',
      dark: 'bx-stat--dark',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export type StatCardProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof statCardVariants> & {
    kicker: string
    value: string
    label: string
  }

export function StatCard({ className, variant, kicker, value, label, ...props }: StatCardProps) {
  return (
    <div className={cn(statCardVariants({ variant }), className)} {...props}>
      <div className="bx-stat__kicker">{kicker}</div>
      <div className="bx-stat__value">{value}</div>
      <div className="bx-stat__label">{label}</div>
    </div>
  )
}

export { statCardVariants }
