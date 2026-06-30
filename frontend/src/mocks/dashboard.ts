import type { StatCardProps } from '@/components/data/StatCard'
import type { BadgeProps } from '@/components/ui/Badge'
import { ROUTES } from '@/config/routes'

export type MovementStatus = 'confirmado' | 'pendiente' | 'proceso'
export type DocumentStatus = 'borrador' | 'proceso' | 'pendiente' | 'revision'

export type DashboardActivityRow = {
  id: string
  documento: string
  tipo: string
  sku: string
  cantidad: string
  estado: MovementStatus
  hora: string
}

export type DashboardAlert = {
  id: string
  variant: 'warn' | 'danger'
  title: string
  message: string
}

export type DashboardPendingDoc = {
  id: string
  code: string
  tipo: string
  estado: DocumentStatus
  path: string
}

export type DashboardData = {
  kpis: Pick<StatCardProps, 'variant' | 'kicker' | 'value' | 'label'>[]
  activity: DashboardActivityRow[]
  alerts: DashboardAlert[]
  pendingDocs: DashboardPendingDoc[]
}

export const MOVEMENT_STATUS_BADGES: Record<
  MovementStatus,
  { variant: NonNullable<BadgeProps['variant']>; label: string }
> = {
  confirmado: { variant: 'success', label: 'Confirmado' },
  pendiente: { variant: 'warn', label: 'Pendiente' },
  proceso: { variant: 'info', label: 'En proceso' },
}

export const DOCUMENT_STATUS_BADGES: Record<
  DocumentStatus,
  { variant: NonNullable<BadgeProps['variant']>; label: string }
> = {
  borrador: { variant: 'warn', label: 'Borrador' },
  proceso: { variant: 'info', label: 'En proceso' },
  pendiente: { variant: 'warn', label: 'Pendiente' },
  revision: { variant: 'neutral', label: 'Revisión' },
}

export const MOCK_DASHBOARD_DATA: DashboardData = {
  kpis: [
    {
      variant: 'hero',
      kicker: 'Stock total',
      value: '24.680',
      label: 'Unidades en bodega principal',
    },
    {
      variant: 'accent',
      kicker: 'SKUs activos',
      value: '1.247',
      label: '842 con movimiento este mes',
    },
    {
      variant: 'inset',
      kicker: 'Pendientes',
      value: '18',
      label: 'Documentos por confirmar',
    },
    {
      variant: 'dark',
      kicker: 'Alertas',
      value: '7',
      label: 'Stock bajo o agotado',
    },
  ],
  activity: [
    {
      id: 'mov-0047',
      documento: 'MOV-0047',
      tipo: 'Entrada',
      sku: 'SKU-004821',
      cantidad: '+120',
      estado: 'confirmado',
      hora: '09:42',
    },
    {
      id: 'mov-0046',
      documento: 'MOV-0046',
      tipo: 'Salida',
      sku: 'SKU-006002',
      cantidad: '−80',
      estado: 'confirmado',
      hora: '09:18',
    },
    {
      id: 'mov-0045',
      documento: 'MOV-0045',
      tipo: 'Ajuste',
      sku: 'SKU-005110',
      cantidad: '−2',
      estado: 'pendiente',
      hora: '08:55',
    },
    {
      id: 'mov-0044',
      documento: 'MOV-0044',
      tipo: 'Entrada',
      sku: 'SKU-006001',
      cantidad: '+48',
      estado: 'confirmado',
      hora: '08:30',
    },
    {
      id: 'mov-0043',
      documento: 'MOV-0043',
      tipo: 'Transferencia',
      sku: 'SKU-005101',
      cantidad: '±15',
      estado: 'proceso',
      hora: '08:12',
    },
    {
      id: 'mov-0042',
      documento: 'MOV-0042',
      tipo: 'Salida',
      sku: 'SKU-004830',
      cantidad: '−30',
      estado: 'confirmado',
      hora: '07:48',
    },
  ],
  alerts: [
    {
      id: 'alert-1',
      variant: 'warn',
      title: 'Stock bajo',
      message: 'Tuerca autobloc. M8 — 45 uds · mín. 100',
    },
    {
      id: 'alert-2',
      variant: 'danger',
      title: 'Agotado',
      message: 'Bisagra industrial 80mm — 0 uds',
    },
    {
      id: 'alert-3',
      variant: 'warn',
      title: 'Stock bajo',
      message: 'Manilla acero inox — 78 uds · mín. 150',
    },
    {
      id: 'alert-4',
      variant: 'danger',
      title: 'Agotado',
      message: 'Toma schuko empotrable — 0 uds',
    },
  ],
  pendingDocs: [
    {
      id: 'rec-0089',
      code: 'REC-0089',
      tipo: 'Recepción',
      estado: 'borrador',
      path: ROUTES.recepcion,
    },
    {
      id: 'des-0034',
      code: 'DES-0034',
      tipo: 'Despacho',
      estado: 'proceso',
      path: ROUTES.despacho,
    },
    {
      id: 'tra-0012',
      code: 'TRA-0012',
      tipo: 'Traslado',
      estado: 'pendiente',
      path: ROUTES.traslado,
    },
    {
      id: 'aju-0005',
      code: 'AJU-0005',
      tipo: 'Ajuste',
      estado: 'revision',
      path: ROUTES.ajuste,
    },
  ],
}

/** Demo rows para catálogo /dev/data */
export const MOCK_LIST_ROWS = Array.from({ length: 12 }, (_, index) => ({
  id: `ROW-${String(index + 1).padStart(3, '0')}`,
  sku: `SKU-${String(4800 + index)}`,
  producto: `Producto demo ${index + 1}`,
  stock: String(100 - index * 3),
}))
