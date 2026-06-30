/**
 * Dashboard API — datos derivados de endpoints DRF existentes.
 * Cuando exista GET /inventory/dashboard/, sustituir las funciones internas
 * manteniendo el tipo `DashboardData` de mocks/dashboard.ts.
 */
import { apiGet } from '@/api/client'
import type { PaginatedResponse } from '@/api/types'
import { fetchMovements } from '@/api/movements'
import type { ApiStockActual } from '@/api/products'
import { ROUTES } from '@/config/routes'
import type {
  DashboardActivityRow,
  DashboardAlert,
  DashboardData,
  DashboardPendingDoc,
  DocumentStatus,
  MovementStatus,
} from '@/mocks/dashboard'
import type { MovementFilters } from '@/mocks/movements'
import type { MovementListStatus } from '@/mocks/status-labels'
import { formatMovementQty } from '@/mocks/status-labels'

/** Umbral operativo para alertas de stock bajo (el producto no expone mínimo en API v1). */
const LOW_STOCK_THRESHOLD = 10

const ACTIVITY_FILTERS: MovementFilters = {
  q: '',
  type: 'Todos',
  from: '',
  to: '',
}

const PENDING_ESTADO_CODES = new Set(['BORRADOR', 'PENDIENTE', 'APROBADO', 'EN_TRANSITO'])

type ApiProductoMini = {
  id: number
  sku: string
  nombre: string
}

type ApiDocumento = {
  id: number
  numero: string
  estado_codigo: string
  updated_at?: string
}

type PendingSource = {
  path: string
  tipo: string
  route: string
}

const PENDING_SOURCES: PendingSource[] = [
  { path: 'compras', tipo: 'Recepción', route: ROUTES.recepcion },
  { path: 'entregas', tipo: 'Despacho', route: ROUTES.despacho },
  { path: 'traslados', tipo: 'Traslado', route: ROUTES.traslado },
  { path: 'ajustes', tipo: 'Ajuste', route: ROUTES.ajuste },
]

function formatDashboardNumber(value: number): string {
  return Math.round(value).toLocaleString('es-CL')
}

function monthStartDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function todayDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function toIsoDateStart(date: string): string {
  return `${date}T00:00:00`
}

function toIsoDateEnd(date: string): string {
  return `${date}T23:59:59`
}

function mapMovementStatus(status: MovementListStatus): MovementStatus {
  if (status === 'en_proceso') {
    return 'proceso'
  }

  return status
}

function extractHora(dateLabel: string): string {
  const parts = dateLabel.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1] : dateLabel
}

function mapDocumentStatus(estadoCodigo: string): DocumentStatus {
  switch (estadoCodigo) {
    case 'BORRADOR':
      return 'borrador'
    case 'PENDIENTE':
      return 'pendiente'
    case 'APROBADO':
    case 'EN_TRANSITO':
      return 'proceso'
    default:
      return 'revision'
  }
}

async function fetchAllStockRows(): Promise<ApiStockActual[]> {
  const rows: ApiStockActual[] = []
  let page = 1

  while (page <= 10) {
    const response = await apiGet<PaginatedResponse<ApiStockActual>>('inventory/stock/', {
      page,
      page_size: 100,
    })
    rows.push(...response.results)
    if (!response.next) {
      break
    }
    page += 1
  }

  return rows
}

async function fetchProductNames(productIds: number[]): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(productIds)]
  if (uniqueIds.length === 0) {
    return new Map()
  }

  const entries = await Promise.all(
    uniqueIds.map(async (productId) => {
      try {
        const product = await apiGet<ApiProductoMini>(`inventory/productos/${productId}/`)
        return [productId, product.nombre] as const
      } catch {
        return [productId, `Producto ${productId}`] as const
      }
    }),
  )

  return new Map(entries)
}

export async function fetchDashboardKpis(
  stockRows: ApiStockActual[],
  alertsCount: number,
  pendingCount: number,
): Promise<DashboardData['kpis']> {
  const monthStart = monthStartDate()
  const today = todayDate()

  const [productosRes, movimientosMesRes] = await Promise.all([
    apiGet<PaginatedResponse<unknown>>('inventory/productos/', {
      activo: true,
      page_size: 1,
    }),
    apiGet<PaginatedResponse<{ producto: number }>>('inventory/movimientos/', {
      created_at_desde: toIsoDateStart(monthStart),
      created_at_hasta: toIsoDateEnd(today),
      page_size: 100,
      ordering: '-created_at',
    }),
  ])

  const stockTotal = stockRows.reduce((sum, row) => sum + Number(row.cantidad), 0)
  const skusActivos = productosRes.count
  const productosConMovimientoMes = new Set(movimientosMesRes.results.map((row) => row.producto)).size

  return [
    {
      variant: 'hero',
      kicker: 'Stock total',
      value: formatDashboardNumber(stockTotal),
      label: 'Unidades registradas en inventario',
    },
    {
      variant: 'accent',
      kicker: 'SKUs activos',
      value: formatDashboardNumber(skusActivos),
      label: `${formatDashboardNumber(productosConMovimientoMes)} con movimiento este mes`,
    },
    {
      variant: 'inset',
      kicker: 'Pendientes',
      value: formatDashboardNumber(pendingCount),
      label: 'Documentos por confirmar',
    },
    {
      variant: 'dark',
      kicker: 'Alertas',
      value: formatDashboardNumber(alertsCount),
      label: 'Stock bajo o agotado',
    },
  ]
}

export async function fetchDashboardActividad(): Promise<DashboardActivityRow[]> {
  const result = await fetchMovements({
    filters: ACTIVITY_FILTERS,
    page: 1,
    pageSize: 6,
  })

  return result.items.map((movement) => ({
    id: `mov-${movement.id.replace(/^MOV-/i, '').toLowerCase()}`,
    documento: movement.id,
    tipo: movement.type,
    sku: movement.sku,
    cantidad: formatMovementQty(movement.qty, movement.qtyDisplay),
    estado: mapMovementStatus(movement.status),
    hora: extractHora(movement.date),
  }))
}

export async function fetchDashboardAlertas(
  stockRows?: ApiStockActual[],
): Promise<DashboardAlert[]> {
  const rows = stockRows ?? (await fetchAllStockRows())
  const totalsByProduct = new Map<number, { total: number; sku: string }>()

  for (const row of rows) {
    const current = totalsByProduct.get(row.producto) ?? {
      total: 0,
      sku: row.producto_sku,
    }
    current.total += Number(row.cantidad)
    totalsByProduct.set(row.producto, current)
  }

  const alertCandidates: Array<{
    productId: number
    total: number
    sku: string
    variant: DashboardAlert['variant']
    title: string
  }> = []

  for (const [productId, info] of totalsByProduct) {
    if (info.total <= 0) {
      alertCandidates.push({
        productId,
        total: info.total,
        sku: info.sku,
        variant: 'danger',
        title: 'Agotado',
      })
    } else if (info.total < LOW_STOCK_THRESHOLD) {
      alertCandidates.push({
        productId,
        total: info.total,
        sku: info.sku,
        variant: 'warn',
        title: 'Stock bajo',
      })
    }
  }

  alertCandidates.sort((left, right) => {
    if (left.variant !== right.variant) {
      return left.variant === 'danger' ? -1 : 1
    }
    return left.total - right.total
  })

  const limited = alertCandidates.slice(0, 8)
  const names = await fetchProductNames(limited.map((item) => item.productId))

  return limited.map((item) => ({
    id: `alert-${item.productId}`,
    variant: item.variant,
    title: item.title,
    message:
      item.variant === 'danger'
        ? `${names.get(item.productId) ?? item.sku} — 0 uds`
        : `${names.get(item.productId) ?? item.sku} — ${formatDashboardNumber(item.total)} uds · umbral ${LOW_STOCK_THRESHOLD}`,
  }))
}

async function fetchPendingFromSource(source: PendingSource): Promise<DashboardPendingDoc[]> {
  const response = await apiGet<PaginatedResponse<ApiDocumento>>(`operations/${source.path}/`, {
    page_size: 25,
    ordering: '-created_at',
  })

  return response.results
    .filter((doc) => PENDING_ESTADO_CODES.has(doc.estado_codigo))
    .map((doc) => ({
      id: `${source.path}-${doc.id}`,
      code: doc.numero,
      tipo: source.tipo,
      estado: mapDocumentStatus(doc.estado_codigo),
      path: source.route,
    }))
}

export async function fetchDashboardPendientes(): Promise<DashboardPendingDoc[]> {
  const groups = await Promise.all(PENDING_SOURCES.map((source) => fetchPendingFromSource(source)))
  return groups
    .flat()
    .sort((left, right) => left.code.localeCompare(right.code))
    .slice(0, 8)
}

export async function fetchDashboard(): Promise<DashboardData> {
  const stockRows = await fetchAllStockRows()

  const [activity, alerts, pendingDocs] = await Promise.all([
    fetchDashboardActividad(),
    fetchDashboardAlertas(stockRows),
    fetchDashboardPendientes(),
  ])

  const kpis = await fetchDashboardKpis(stockRows, alerts.length, pendingDocs.length)

  return {
    kpis,
    activity,
    alerts,
    pendingDocs,
  }
}
