import type { BadgeProps } from '@/components/ui/Badge'

export type MovementListStatus = 'confirmado' | 'pendiente' | 'en_proceso'
export type ProductStockStatus = 'en_stock' | 'stock_bajo' | 'agotado'

export const MOVEMENT_LIST_STATUS_BADGES: Record<
  MovementListStatus,
  { variant: NonNullable<BadgeProps['variant']>; label: string }
> = {
  confirmado: { variant: 'success', label: 'Confirmado' },
  pendiente: { variant: 'warn', label: 'Pendiente' },
  en_proceso: { variant: 'info', label: 'En proceso' },
}

export const PRODUCT_STOCK_STATUS_BADGES: Record<
  ProductStockStatus,
  { variant: NonNullable<BadgeProps['variant']>; label: string }
> = {
  en_stock: { variant: 'success', label: 'En stock' },
  stock_bajo: { variant: 'warn', label: 'Stock bajo' },
  agotado: { variant: 'danger', label: 'Agotado' },
}

export function formatMovementQty(qty: number, qtyDisplay?: string): string {
  if (qtyDisplay) {
    return qtyDisplay
  }
  return `${qty > 0 ? '+' : ''}${qty}`
}

export function formatStockNumber(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
