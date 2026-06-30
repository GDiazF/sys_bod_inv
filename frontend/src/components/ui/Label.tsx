import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const labelVariants = cva('bx-label', {
  variants: {
    required: {
      true: 'bx-label--required',
      false: '',
    },
  },
  defaultVariants: {
    required: false,
  },
})

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> &
  VariantProps<typeof labelVariants> & {
    hint?: string
    error?: string
  }

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, hint, error, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <label ref={ref} className={cn(labelVariants({ required }), className)} {...props}>
          {children}
        </label>
        {hint && !error ? <span className="bx-field-hint">{hint}</span> : null}
        {error ? <span className="bx-field-error" role="alert">{error}</span> : null}
      </div>
    )
  },
)

Label.displayName = 'Label'

export { labelVariants }
