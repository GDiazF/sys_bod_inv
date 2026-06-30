import { MOCK_MOVEMENTS, type MovementRow } from '@/mocks/movements'
import type { MovementListStatus } from '@/mocks/status-labels'
import { MOVEMENT_LIST_STATUS_BADGES } from '@/mocks/status-labels'
import { formatMovementDisplayId, parseMovementRouteId } from '@/lib/movement-id'

export type MovementDetailLine = {
  lineNumber: number
  sku: string
  product: string
  qty: number
  qtyDisplay?: string
  location: string
  unitCost?: string
  totalCost?: string
}

export type MovementDetailTimelineEvent = {
  id: string
  label: string
  timestamp: string
  description?: string
}

export type MovementDetailSummary = {
  totalLines: number
  totalQty: number
  totalQtyDisplay?: string
}

export type MovementDetail = {
  id: string
  numericId: number
  type: MovementRow['type']
  doc: string
  status: MovementListStatus
  location: string
  date: string
  lead: string
  observacion: string | null
  lines: MovementDetailLine[]
  timeline: MovementDetailTimelineEvent[]
  summary: MovementDetailSummary
}

function formatMovementLead(detail: Pick<MovementDetail, 'type' | 'location' | 'summary' | 'status'>): string {
  const statusLabel = MOVEMENT_LIST_STATUS_BADGES[detail.status].label
  const linesLabel = detail.summary.totalLines === 1 ? '1 línea' : `${detail.summary.totalLines} líneas`
  return `${detail.type} · ${detail.location} · ${linesLabel} · ${statusLabel}.`
}

function buildMockTimeline(row: MovementRow): MovementDetailTimelineEvent[] {
  const events: MovementDetailTimelineEvent[] = [
    {
      id: 'registered',
      label: 'Movimiento registrado',
      timestamp: row.date,
      description: `Documento ${row.doc}`,
    },
  ]

  if (row.status === 'en_proceso') {
    events.push({
      id: 'in-progress',
      label: 'En tránsito',
      timestamp: row.date,
      description: 'Pendiente de confirmación en bodega destino.',
    })
  } else if (row.status === 'pendiente') {
    events.push({
      id: 'pending',
      label: 'Pendiente de confirmación',
      timestamp: row.date,
      description: 'Requiere validación operativa.',
    })
  } else {
    events.push({
      id: 'confirmed',
      label: 'Confirmado en inventario',
      timestamp: row.date,
      description: 'Stock actualizado.',
    })
  }

  return events
}

function buildDetailFromRow(row: MovementRow, numericId: number): MovementDetail {
  const lines: MovementDetailLine[] = [
    {
      lineNumber: 1,
      sku: row.sku,
      product: row.product,
      qty: row.qty,
      qtyDisplay: row.qtyDisplay,
      location: row.location,
      unitCost: '—',
      totalCost: '—',
    },
  ]

  const summary: MovementDetailSummary = {
    totalLines: lines.length,
    totalQty: row.qty,
    totalQtyDisplay: row.qtyDisplay,
  }

  const detail: MovementDetail = {
    id: row.id,
    numericId,
    type: row.type,
    doc: row.doc,
    status: row.status,
    location: row.location,
    date: row.date,
    observacion: null,
    lines,
    timeline: buildMockTimeline(row),
    summary,
    lead: '',
  }

  detail.lead = formatMovementLead(detail)
  return detail
}

export function getMovementDetail(id: string | number): MovementDetail | null {
  const numericId = typeof id === 'number' ? id : parseMovementRouteId(id)
  if (numericId === null) {
    return null
  }

  const displayId = formatMovementDisplayId(numericId)
  const row = MOCK_MOVEMENTS.find((movement) => movement.id === displayId)
  if (!row) {
    return null
  }

  return buildDetailFromRow(row, numericId)
}

export function buildMovementDetailFromRow(row: MovementRow, numericId: number): MovementDetail {
  return buildDetailFromRow(row, numericId)
}
