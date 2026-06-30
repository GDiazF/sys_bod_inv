import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type TextareaHTMLAttributes } from 'react'
import type { FieldState } from '@/components/ui/types'
import { cn } from '@/lib/cn'

const textareaVariants = cva('bx-textarea', {
  variants: {
    state: {
      default: '',
      error: 'bx-textarea--error',
      success: '',
    },
  },
  defaultVariants: {
    state: 'default',
  },
})

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  VariantProps<typeof textareaVariants> & {
    fieldState?: FieldState
  }

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, fieldState = 'default', state, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const resolvedState = state ?? fieldState

    return (
      <textarea
        ref={ref}
        className={cn(textareaVariants({ state: resolvedState }), className)}
        aria-invalid={ariaInvalid ?? (resolvedState === 'error' ? true : undefined)}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'

export { textareaVariants }
