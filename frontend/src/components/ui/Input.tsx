import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type InputHTMLAttributes } from 'react'
import type { FieldState } from '@/components/ui/types'
import { cn } from '@/lib/cn'

const inputVariants = cva('bx-input', {
  variants: {
    state: {
      default: '',
      error: 'bx-input--error',
      success: 'bx-input--success',
    },
  },
  defaultVariants: {
    state: 'default',
  },
})

export type InputProps = InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants> & {
    fieldState?: FieldState
  }

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, fieldState = 'default', state, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const resolvedState = state ?? fieldState

    return (
      <input
        ref={ref}
        className={cn(inputVariants({ state: resolvedState }), className)}
        aria-invalid={ariaInvalid ?? (resolvedState === 'error' ? true : undefined)}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { inputVariants }
