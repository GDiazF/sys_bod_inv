import { cva, type VariantProps } from 'class-variance-authority'
import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const badgeVariants = cva('bx-badge', {
  variants: {
    variant: {
      success: 'bx-badge--success',
      warn: 'bx-badge--warn',
      danger: 'bx-badge--danger',
      neutral: 'bx-badge--neutral',
      info: 'bx-badge--info',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
})

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}

export { badgeVariants }
