import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type SelectHTMLAttributes } from 'react'
import type { FieldState } from '@/components/ui/types'
import { cn } from '@/lib/cn'

const selectVariants = cva('bx-select', {
  variants: {
    state: {
      default: '',
      error: 'bx-select--error',
      success: 'bx-select--success',
    },
  },
  defaultVariants: {
    state: 'default',
  },
})

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> &
  VariantProps<typeof selectVariants> & {
    fieldState?: FieldState
  }

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, fieldState = 'default', state, children, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const resolvedState = state ?? fieldState

    return (
      <select
        ref={ref}
        className={cn(selectVariants({ state: resolvedState }), className)}
        aria-invalid={ariaInvalid ?? (resolvedState === 'error' ? true : undefined)}
        {...props}
      >
        {children}
      </select>
    )
  },
)

Select.displayName = 'Select'

export { selectVariants }
