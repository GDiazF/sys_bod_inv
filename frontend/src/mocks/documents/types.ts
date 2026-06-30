import type { BadgeProps } from '@/components/ui/Badge'

/** Estados de documento compartidos entre recepción, despacho, traslado y ajuste. */
export type DocumentStatus =
  | 'borrador'
  | 'en_proceso'
  | 'confirmado'
  | 'pendiente'
  | 'revision'

export type DocumentLineStatus = 'ok' | 'pendiente' | 'diferencia' | 'revision'

export const DOCUMENT_STATUS_BADGES: Record<
  DocumentStatus,
  { variant: NonNullable<BadgeProps['variant']>; label: string }
> = {
  borrador: { variant: 'warn', label: 'Borrador' },
  en_proceso: { variant: 'info', label: 'En proceso' },
  confirmado: { variant: 'success', label: 'Confirmado' },
  pendiente: { variant: 'warn', label: 'Pendiente' },
  revision: { variant: 'neutral', label: 'Revisión' },
}

export const DOCUMENT_LINE_STATUS_BADGES: Record<
  DocumentLineStatus,
  { variant: NonNullable<BadgeProps['variant']>; label: string }
> = {
  ok: { variant: 'success', label: 'OK' },
  pendiente: { variant: 'warn', label: 'Pendiente' },
  diferencia: { variant: 'danger', label: 'Diferencia' },
  revision: { variant: 'neutral', label: 'Revisión' },
}

export type DocumentHeaderBase = {
  code: string
  status: DocumentStatus
  date: string
  warehouse: string
  operator: string
  notes: string
}

export type SelectOption = {
  value: string
  label: string
}
