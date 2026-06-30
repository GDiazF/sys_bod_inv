import { apiGet } from '@/api/client'
import type { PaginatedResponse, PaginatedResult } from '@/api/types'
import type { MovimientoTipoFilter } from '@/config/filter-options'
import type { MovementFilters, MovementRow } from '@/mocks/movements'
import type { MovementListStatus } from '@/mocks/status-labels'

export type ApiTipoMovimiento = {
  id: number
  codigo: string
  nombre: string
  naturaleza: 'ENTRADA' | 'SALIDA' | 'NEUTRO'
}

export type ApiMovimiento = {
  id: number
  tipo_movimiento: number
  tipo_movimiento_codigo: string
  producto: number
  producto_sku: string
  cantidad: string
  bodega_origen: number | null
  bodega_destino: number | null
  referencia_tipo: string | null
  referencia_id: string | null
  anulado: boolean
  created_at: string
}

export type ApiBodega = {
  id: number
  codigo: string
  nombre: string
}

export type ApiProductoMini = {
  id: number
  sku: string
  nombre: string
}

export type TiposMovimientoMaps = {
  byId: Map<number, ApiTipoMovimiento>
  byUiType: Map<Exclude<MovimientoTipoFilter, 'Todos'>, number[]>
}

type FetchMovementsParams = {
  filters: MovementFilters
  page: number
  pageSize: number
}

const REFERENCIA_DOC_PREFIX: Record<string, string> = {
  COMPRA: 'COM',
  ENTREGA: 'ENT',
  TRASLADO: 'TRA',
  AJUSTE: 'AJU',
  SOLICITUD: 'SOL',
}

let tiposMovimientoCache: Promise<TiposMovimientoMaps> | null = null
let bodegasCache: Promise<Map<number, string>> | null = null

export function resetMovementsCaches(): void {
  tiposMovimientoCache = null
  bodegasCache = null
}

function mapCodigoToUiType(codigo: string): MovementRow['type'] {
  if (codigo.startsWith('TRASLADO')) {
    return 'Transferencia'
  }

  if (codigo.startsWith('AJUSTE')) {
    return 'Ajuste'
  }

  if (codigo === 'ENTRADA_COMPRA' || codigo === 'TRASLADO_ENTRADA') {
    return 'Entrada'
  }

  if (codigo === 'SALIDA_ENTREGA' || codigo === 'TRASLADO_SALIDA') {
    return 'Salida'
  }

  if (codigo === 'REVERSA') {
    return 'Ajuste'
  }

  return 'Entrada'
}

function mapUiTypeToCodigos(type: MovimientoTipoFilter): string[] | null {
  switch (type) {
    case 'Todos':
      return null
    case 'Entrada':
      return ['ENTRADA_COMPRA', 'TRASLADO_ENTRADA', 'AJUSTE_POSITIVO']
    case 'Salida':
      return ['SALIDA_ENTREGA', 'TRASLADO_SALIDA', 'AJUSTE_NEGATIVO']
    case 'Transferencia':
      return ['TRASLADO_SALIDA', 'TRASLADO_ENTRADA']
    case 'Ajuste':
      return ['AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO']
    default:
      return null
  }
}

export async function fetchTiposMovimientoMaps(): Promise<TiposMovimientoMaps> {
  if (!tiposMovimientoCache) {
    tiposMovimientoCache = apiGet<PaginatedResponse<ApiTipoMovimiento>>('catalogs/tipos-movimiento/', {
      page_size: 100,
    }).then((response) => {
      const byId = new Map<number, ApiTipoMovimiento>()
      const byCodigo = new Map<string, ApiTipoMovimiento>()

      for (const tipo of response.results) {
        byId.set(tipo.id, tipo)
        byCodigo.set(tipo.codigo, tipo)
      }

      const byUiType = new Map<Exclude<MovimientoTipoFilter, 'Todos'>, number[]>()
      for (const uiType of ['Entrada', 'Salida', 'Transferencia', 'Ajuste'] as const) {
        const codigos = mapUiTypeToCodigos(uiType) ?? []
        const ids = codigos
          .map((codigo) => byCodigo.get(codigo)?.id)
          .filter((id): id is number => id !== undefined)
        byUiType.set(uiType, ids)
      }

      return { byId, byUiType }
    })
  }

  return tiposMovimientoCache
}

export async function fetchBodegaCodigoMap(): Promise<Map<number, string>> {
  if (!bodegasCache) {
    bodegasCache = apiGet<PaginatedResponse<ApiBodega>>('core/bodegas/', { page_size: 200 }).then(
      (response) => new Map(response.results.map((bodega) => [bodega.id, bodega.codigo])),
    )
  }

  return bodegasCache
}

async function fetchProductoNombreMap(productIds: number[]): Promise<Map<number, string>> {
  if (productIds.length === 0) {
    return new Map()
  }

  const uniqueIds = [...new Set(productIds)]
  const entries = await Promise.all(
    uniqueIds.map(async (productId) => {
      try {
        const product = await apiGet<ApiProductoMini>(`inventory/productos/${productId}/`)
        return [productId, product.nombre] as const
      } catch {
        return [productId, '—'] as const
      }
    }),
  )

  return new Map(entries)
}

function toIsoDateStart(date: string): string | undefined {
  if (!date) {
    return undefined
  }

  return `${date}T00:00:00`
}

function toIsoDateEnd(date: string): string | undefined {
  if (!date) {
    return undefined
  }

  return `${date}T23:59:59`
}

function formatMovementDate(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    return '—'
  }

  const day = String(parsed.getDate()).padStart(2, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const hours = String(parsed.getHours()).padStart(2, '0')
  const minutes = String(parsed.getMinutes()).padStart(2, '0')
  return `${day}/${month} ${hours}:${minutes}`
}

function formatDocumento(referenciaTipo: string | null, referenciaId: string | null): string {
  if (!referenciaTipo || !referenciaId) {
    return '—'
  }

  const prefix = REFERENCIA_DOC_PREFIX[referenciaTipo] ?? referenciaTipo.slice(0, 3)
  return `${prefix}-${referenciaId.padStart(4, '0')}`
}

function formatLocation(
  bodegaOrigen: number | null,
  bodegaDestino: number | null,
  bodegas: Map<number, string>,
  tipoCodigo: string,
): string {
  const origen = bodegaOrigen !== null ? (bodegas.get(bodegaOrigen) ?? '—') : null
  const destino = bodegaDestino !== null ? (bodegas.get(bodegaDestino) ?? '—') : null

  if (tipoCodigo.startsWith('TRASLADO') && origen && destino) {
    return `${origen} → ${destino}`
  }

  return origen ?? destino ?? '—'
}

function deriveMovementStatus(
  anulado: boolean,
  tipoCodigo: string,
): MovementListStatus {
  if (anulado) {
    return 'pendiente'
  }

  if (tipoCodigo === 'TRASLADO_SALIDA') {
    return 'en_proceso'
  }

  return 'confirmado'
}

function deriveQuantity(
  cantidad: string,
  naturaleza: ApiTipoMovimiento['naturaleza'] | undefined,
  tipoCodigo: string,
): Pick<MovementRow, 'qty' | 'qtyDisplay'> {
  const absolute = Math.abs(Number(cantidad))

  if (tipoCodigo.startsWith('TRASLADO')) {
    return {
      qty: absolute,
      qtyDisplay: `±${absolute}`,
    }
  }

  if (naturaleza === 'SALIDA') {
    return { qty: absolute * -1 }
  }

  return { qty: absolute }
}

export function mapApiMovimientoToRow(
  movement: ApiMovimiento,
  tipos: TiposMovimientoMaps,
  bodegas: Map<number, string>,
  productNames: Map<number, string>,
): MovementRow {
  const tipo = tipos.byId.get(movement.tipo_movimiento)
  const tipoCodigo = movement.tipo_movimiento_codigo
  const quantity = deriveQuantity(movement.cantidad, tipo?.naturaleza, tipoCodigo)

  return {
    id: `MOV-${String(movement.id).padStart(4, '0')}`,
    type: mapCodigoToUiType(tipoCodigo),
    doc: formatDocumento(movement.referencia_tipo, movement.referencia_id),
    sku: movement.producto_sku,
    product: productNames.get(movement.producto) ?? movement.producto_sku,
    ...quantity,
    location: formatLocation(
      movement.bodega_origen,
      movement.bodega_destino,
      bodegas,
      tipoCodigo,
    ),
    status: deriveMovementStatus(movement.anulado, tipoCodigo),
    date: formatMovementDate(movement.created_at),
  }
}

function buildBaseQueryParams(filters: MovementFilters): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {}

  const search = filters.q.trim()
  if (search) {
    params.search = search
  }

  const desde = toIsoDateStart(filters.from)
  if (desde) {
    params.created_at_desde = desde
  }

  const hasta = toIsoDateEnd(filters.to)
  if (hasta) {
    params.created_at_hasta = hasta
  }

  return params
}

async function fetchSingleTipoPage(
  baseParams: Record<string, string | number | boolean>,
  tipoMovimientoId: number,
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<ApiMovimiento>> {
  return apiGet<PaginatedResponse<ApiMovimiento>>('inventory/movimientos/', {
    ...baseParams,
    tipo_movimiento: tipoMovimientoId,
    page,
    page_size: pageSize,
    ordering: '-created_at',
  })
}

async function fetchMergedByTipos(
  baseParams: Record<string, string | number | boolean>,
  tipoIds: number[],
  page: number,
  pageSize: number,
): Promise<{ items: ApiMovimiento[]; total: number }> {
  const fetchSize = Math.min(page * pageSize, 100)

  const responses = await Promise.all(
    tipoIds.map((tipoId) =>
      fetchSingleTipoPage(baseParams, tipoId, 1, fetchSize),
    ),
  )

  const total = responses.reduce((sum, response) => sum + response.count, 0)
  const merged = responses
    .flatMap((response) => response.results)
    .sort((left, right) => right.created_at.localeCompare(left.created_at))

  const start = (page - 1) * pageSize
  const items = merged.slice(start, start + pageSize)

  return { items, total }
}

export async function fetchMovements({
  filters,
  page,
  pageSize,
}: FetchMovementsParams): Promise<PaginatedResult<MovementRow>> {
  const [tipos, bodegas] = await Promise.all([
    fetchTiposMovimientoMaps(),
    fetchBodegaCodigoMap(),
  ])

  const baseParams = buildBaseQueryParams(filters)
  let apiItems: ApiMovimiento[] = []
  let total = 0

  if (filters.type === 'Todos') {
    const response = await apiGet<PaginatedResponse<ApiMovimiento>>('inventory/movimientos/', {
      ...baseParams,
      page,
      page_size: pageSize,
      ordering: '-created_at',
    })
    apiItems = response.results
    total = response.count
  } else if (filters.type === 'Transferencia') {
    const response = await apiGet<PaginatedResponse<ApiMovimiento>>('inventory/movimientos/', {
      ...baseParams,
      referencia_tipo: 'TRASLADO',
      page,
      page_size: pageSize,
      ordering: '-created_at',
    })
    apiItems = response.results
    total = response.count
  } else if (filters.type === 'Ajuste') {
    const response = await apiGet<PaginatedResponse<ApiMovimiento>>('inventory/movimientos/', {
      ...baseParams,
      referencia_tipo: 'AJUSTE',
      page,
      page_size: pageSize,
      ordering: '-created_at',
    })
    apiItems = response.results
    total = response.count
  } else {
    const tipoIds = tipos.byUiType.get(filters.type) ?? []
    if (tipoIds.length === 1) {
      const response = await fetchSingleTipoPage(baseParams, tipoIds[0], page, pageSize)
      apiItems = response.results
      total = response.count
    } else if (tipoIds.length > 1) {
      const merged = await fetchMergedByTipos(baseParams, tipoIds, page, pageSize)
      apiItems = merged.items
      total = merged.total
    }
  }

  const productNames = await fetchProductoNombreMap(apiItems.map((row) => row.producto))
  const items = apiItems.map((movement) =>
    mapApiMovimientoToRow(movement, tipos, bodegas, productNames),
  )

  return {
    items,
    total,
    page,
    pageSize,
  }
}
