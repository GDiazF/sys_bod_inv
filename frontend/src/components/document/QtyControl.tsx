import { useCallback } from 'react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'

export type QtyControlProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function QtyControl({
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
  className,
  'aria-label': ariaLabel = 'Cantidad',
}: QtyControlProps) {
  const clamp = useCallback(
    (next: number) => {
      let result = Math.max(min, next)
      if (max !== undefined) {
        result = Math.min(max, result)
      }
      return result
    },
    [min, max],
  )

  return (
    <div className={cn('bx-qty-control', className)}>
      <button
        type="button"
        className="bx-qty-btn"
        disabled={disabled || value <= min}
        aria-label="Disminuir cantidad"
        onClick={() => onChange(clamp(value - 1))}
      >
        −
      </button>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={ariaLabel}
        className="!w-[72px] text-center"
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10)
          onChange(Number.isNaN(parsed) ? min : clamp(parsed))
        }}
      />
      <button
        type="button"
        className="bx-qty-btn"
        disabled={disabled || (max !== undefined && value >= max)}
        aria-label="Aumentar cantidad"
        onClick={() => onChange(clamp(value + 1))}
      >
        +
      </button>
    </div>
  )
}
