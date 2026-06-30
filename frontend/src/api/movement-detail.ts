import { apiGet } from '@/api/client'
import {
  fetchBodegaCodigoMap,
  fetchTiposMovimientoMaps,
  mapApiMovimientoToRow,
  type ApiMovimiento,
  type ApiProductoMini,
} from '@/api/movements'
import { formatMovementDisplayId } from '@/lib/movement-id'
import {
  buildMovementDetailFromRow,
  type MovementDetail,
  type MovementDetailTimelineEvent,
} from '@/mocks/movement-detail'
import { MOVEMENT_LIST_STATUS_BADGES } from '@/mocks/status-labels'

export type ApiMovimientoDetail = ApiMovimiento & {
  costo_unitario: string
  costo_total: string
  observacion: string | null
  fecha_movimiento: string
}

function formatCost(value: string): string {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return '—'
  }

  return parsed.toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function formatMovementLead(detail: MovementDetail): string {
  const statusLabel = MOVEMENT_LIST_STATUS_BADGES[detail.status].label
  const linesLabel = detail.summary.totalLines === 1 ? '1 línea' : `${detail.summary.totalLines} líneas`
  return `${detail.type} · ${detail.location} · ${linesLabel} · ${statusLabel}.`
}

function buildTimelineFromApi(
  movement: ApiMovimientoDetail,
  rowDate: string,
  doc: string,
  status: MovementDetail['status'],
): MovementDetailTimelineEvent[] {
  const events: MovementDetailTimelineEvent[] = [
    {
      id: 'registered',
      label: 'Movimiento registrado',
      timestamp: rowDate,
      description: `Documento ${doc}`,
    },
  ]

  if (movement.anulado || status === 'pendiente') {
    events.push({
      id: 'pending',
      label: movement.anulado ? 'Movimiento anulado' : 'Pendiente de confirmación',
      timestamp: rowDate,
      description: movement.observacion ?? 'Estado operativo pendiente.',
    })
  } else if (status === 'en_proceso') {
    events.push({
      id: 'in-progress',
      label: 'En tránsito',
      timestamp: rowDate,
      description: 'Pendiente de confirmación en bodega destino.',
    })
  } else {
    events.push({
      id: 'confirmed',
      label: 'Confirmado en inventario',
      timestamp: rowDate,
      description: 'Stock actualizado.',
    })
  }

  return events
}

export async function fetchMovementDetail(numericId: number): Promise<MovementDetail | null> {
  const movement = await apiGet<ApiMovimientoDetail>(`inventory/movimientos/${numericId}/`)

  const [tipos, bodegas, product] = await Promise.all([
    fetchTiposMovimientoMaps(),
    fetchBodegaCodigoMap(),
    apiGet<ApiProductoMini>(`inventory/productos/${movement.producto}/`).catch(() => ({
      id: movement.producto,
      sku: movement.producto_sku,
      nombre: movement.producto_sku,
    })),
  ])

  const productNames = new Map([[movement.producto, product.nombre]])
  const row = mapApiMovimientoToRow(movement, tipos, bodegas, productNames)
  const base = buildMovementDetailFromRow(row, numericId)

  const lines = [
    {
      lineNumber: 1,
      sku: row.sku,
      product: row.product,
      qty: row.qty,
      qtyDisplay: row.qtyDisplay,
      location: row.location,
      unitCost: formatCost(movement.costo_unitario),
      totalCost: formatCost(movement.costo_total),
    },
  ]

  const detail: MovementDetail = {
    ...base,
    id: formatMovementDisplayId(numericId),
    numericId,
    observacion: movement.observacion,
    lines,
    timeline: buildTimelineFromApi(movement, row.date, row.doc, row.status),
    summary: {
      totalLines: lines.length,
      totalQty: row.qty,
      totalQtyDisplay: row.qtyDisplay,
    },
    lead: '',
  }

  detail.lead = formatMovementLead(detail)
  return detail
}
