import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const buttonVariants = cva('bx-btn', {
  variants: {
    variant: {
      primary: 'bx-btn--primary',
      secondary: 'bx-btn--secondary',
      ghost: 'bx-btn--ghost',
      danger: 'bx-btn--danger',
    },
    size: {
      default: '',
      sm: 'bx-btn--sm',
    },
    loading: {
      true: 'bx-btn--loading',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default',
    loading: false,
  },
})

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
  }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        type="button"
        className={cn(buttonVariants({ variant, size, loading }), className)}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { buttonVariants }
