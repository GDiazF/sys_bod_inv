/**
 * Despacho (UI DES-XXXX) ↔ Entrega (API operations/entregas/).
 * Confirmar despacho = POST .../ejecutar/ (no existe confirmar/ en DRF v1).
 * PATCH de cabecera/líneas aún no existe; updateDespacho queda preparado.
 */
import { apiGet, apiPatch, apiPost } from '@/api/client'
import type { PaginatedResponse } from '@/api/types'
import { fetchBodegaCodigoMap } from '@/api/movements'
import {
  deriveDespachoLineStatus,
  type DespachoDocument,
  type DespachoLine,
} from '@/mocks/documents/despacho'
import type { DocumentStatus, SelectOption } from '@/mocks/documents/types'

export type ApiEntregaDetalle = {
  id: number
  producto: number
  cantidad_entregada: string
  serie: number | null
  lote: number | null
  observacion: string | null
}

export type ApiEntrega = {
  id: number
  numero: string
  solicitud: number | null
  bodega: number
  centro_costo: number
  estado_codigo: string
  fecha_entrega: string
  recibido_por: string | null
  observacion: string | null
  es_ad_hoc: boolean
  created_by: number
  detalles: ApiEntregaDetalle[]
}

type ApiSolicitudDetalle = {
  producto: number
  cantidad_solicitada: string
  cantidad_aprobada: string | null
}

type ApiSolicitud = {
  id: number
  numero: string
  detalles: ApiSolicitudDetalle[]
}

type ApiCentroCosto = {
  id: number
  codigo: string
  nombre: string
}

type ApiProductoMini = {
  id: number
  sku: string
  nombre: string
}

type ApiUsuarioMini = {
  id: number
  nombre_completo: string
}

type ApiUbicacion = {
  id: number
  codigo: string
  bodega: number
}

export type DespachoUpdatePayload = {
  bodegaId?: number
  centroCostoId?: number
  fechaEntrega?: string
  recibidoPor?: string
  observacion?: string
  lines?: Array<{
    detalleId: number
    dispatchQty?: number
    location?: string
  }>
}

const DESPACHO_WORKFLOW_ESTADOS = new Set(['BORRADOR', 'PENDIENTE', 'APROBADO'])

const DEFAULT_CARRIER_OPTIONS: SelectOption[] = [
  { value: 'retiro-bodega', label: 'Retiro en bodega' },
  { value: 'logistica-interna', label: 'Logística interna' },
]

let bodegasLabelCache: Promise<Map<number, string>> | null = null

export function resetDespachoCaches(): void {
  bodegasLabelCache = null
}

export function formatDespachoCode(numero: string): string {
  if (numero.startsWith('ENT-')) {
    return `DES-${numero.slice(4)}`
  }

  return numero
}

function mapEstadoToDocumentStatus(estadoCodigo: string): DocumentStatus {
  switch (estadoCodigo) {
    case 'BORRADOR':
      return 'borrador'
    case 'PENDIENTE':
      return 'pendiente'
    case 'APROBADO':
      return 'en_proceso'
    case 'CERRADO':
      return 'confirmado'
    case 'RECHAZADO':
      return 'revision'
    default:
      return 'borrador'
  }
}

async function fetchBodegaLabelMap(): Promise<Map<number, string>> {
  if (!bodegasLabelCache) {
    bodegasLabelCache = fetchBodegaCodigoMap().then((codigoMap) => new Map(codigoMap))
  }

  return bodegasLabelCache
}

async function fetchBodegaOptions(): Promise<SelectOption[]> {
  const response = await apiGet<PaginatedResponse<{ id: number; codigo: string; nombre: string }>>(
    'core/bodegas/',
    { page_size: 200 },
  )

  return response.results.map((bodega) => ({
    value: String(bodega.id),
    label: `${bodega.codigo} · ${bodega.nombre}`,
  }))
}

async function fetchUbicacionOptions(bodegaId: number): Promise<SelectOption[]> {
  const response = await apiGet<PaginatedResponse<ApiUbicacion>>('support/ubicaciones/', {
    bodega: bodegaId,
    page_size: 100,
  })

  if (response.results.length === 0) {
    const bodegas = await fetchBodegaLabelMap()
    const codigo = bodegas.get(bodegaId) ?? '—'
    return [{ value: codigo, label: codigo }]
  }

  return response.results.map((ubicacion) => ({
    value: ubicacion.codigo,
    label: ubicacion.codigo,
  }))
}

async function fetchProductMap(productIds: number[]): Promise<Map<number, ApiProductoMini>> {
  const uniqueIds = [...new Set(productIds)]
  const entries = await Promise.all(
    uniqueIds.map(async (productId) => {
      const product = await apiGet<ApiProductoMini>(`inventory/productos/${productId}/`)
      return [productId, product] as const
    }),
  )

  return new Map(entries)
}

async function fetchUsuarioNombre(usuarioId: number): Promise<string> {
  try {
    const usuario = await apiGet<ApiUsuarioMini>(`security/usuarios/${usuarioId}/`)
    return usuario.nombre_completo
  } catch {
    return '—'
  }
}

async function fetchCentroCostoLabel(centroCostoId: number): Promise<string> {
  try {
    const centro = await apiGet<ApiCentroCosto>(`core/centros-costo/${centroCostoId}/`)
    return centro.nombre || centro.codigo
  } catch {
    return '—'
  }
}

async function fetchSolicitudCommittedByProduct(
  solicitudId: number,
): Promise<Map<number, number>> {
  try {
    const solicitud = await apiGet<ApiSolicitud>(`operations/solicitudes/${solicitudId}/`)
    const map = new Map<number, number>()
    for (const detalle of solicitud.detalles) {
      const qty = detalle.cantidad_aprobada ?? detalle.cantidad_solicitada
      map.set(detalle.producto, Number(qty))
    }
    return map
  } catch {
    return new Map()
  }
}

async function fetchSolicitudNumero(solicitudId: number): Promise<string | null> {
  try {
    const solicitud = await apiGet<ApiSolicitud>(`operations/solicitudes/${solicitudId}/`)
    return solicitud.numero
  } catch {
    return null
  }
}

export async function resolveDespachoEntregaId(
  explicitId?: string | number,
): Promise<number | null> {
  if (explicitId !== undefined && explicitId !== '') {
    const parsed = Number(explicitId)
    return Number.isNaN(parsed) ? null : parsed
  }

  const response = await apiGet<PaginatedResponse<ApiEntrega>>('operations/entregas/', {
    page_size: 25,
    ordering: '-created_at',
  })

  const candidate = response.results.find((entrega) =>
    DESPACHO_WORKFLOW_ESTADOS.has(entrega.estado_codigo),
  )
  return candidate?.id ?? response.results[0]?.id ?? null
}

export async function fetchDespacho(entregaId: number): Promise<DespachoDocument> {
  const entrega = await apiGet<ApiEntrega>(`operations/entregas/${entregaId}/`)

  const [
    bodegaOptions,
    ubicacionOptions,
    productMap,
    operatorName,
    clientLabel,
    orderRef,
    committedByProduct,
  ] = await Promise.all([
    fetchBodegaOptions(),
    fetchUbicacionOptions(entrega.bodega),
    fetchProductMap(entrega.detalles.map((detalle) => detalle.producto)),
    fetchUsuarioNombre(entrega.created_by),
    fetchCentroCostoLabel(entrega.centro_costo),
    entrega.solicitud
      ? fetchSolicitudNumero(entrega.solicitud)
      : Promise.resolve(entrega.numero),
    entrega.solicitud
      ? fetchSolicitudCommittedByProduct(entrega.solicitud)
      : Promise.resolve(new Map<number, number>()),
  ])

  const defaultLocation = ubicacionOptions[0]?.value ?? '—'
  const carrierValue = entrega.recibido_por?.trim() || DEFAULT_CARRIER_OPTIONS[0].value
  const carrierOptions =
    entrega.recibido_por &&
    !DEFAULT_CARRIER_OPTIONS.some((option) => option.value === entrega.recibido_por)
      ? [
          { value: entrega.recibido_por, label: entrega.recibido_por },
          ...DEFAULT_CARRIER_OPTIONS,
        ]
      : DEFAULT_CARRIER_OPTIONS

  const lines: DespachoLine[] = entrega.detalles.map((detalle, index) => {
    const product = productMap.get(detalle.producto)
    const dispatchQty = Number(detalle.cantidad_entregada)
    const committedQty = committedByProduct.get(detalle.producto) ?? dispatchQty

    return {
      id: `des-line-${detalle.id}`,
      lineNumber: String(index + 1).padStart(3, '0'),
      sku: product?.sku ?? '—',
      description: product?.nombre ?? '—',
      committedQty,
      dispatchQty,
      location: defaultLocation,
      lineStatus: deriveDespachoLineStatus(committedQty, dispatchQty),
      locationOptions: ubicacionOptions,
      detalleId: detalle.id,
    }
  })

  return {
    entregaId: entrega.id,
    header: {
      code: formatDespachoCode(entrega.numero),
      status: mapEstadoToDocumentStatus(entrega.estado_codigo),
      date: entrega.fecha_entrega,
      client: clientLabel,
      orderRef: orderRef ?? entrega.numero,
      warehouse: String(entrega.bodega),
      carrier: carrierValue,
      operator: operatorName,
      notes: entrega.observacion ?? '',
      warehouseOptions: bodegaOptions,
      carrierOptions,
    },
    lines,
  }
}

/**
 * PATCH /operations/entregas/{id}/ no está expuesto en DRF v1.
 */
export async function updateDespacho(
  entregaId: number,
  payload: DespachoUpdatePayload,
): Promise<DespachoDocument> {
  try {
    await apiPatch<ApiEntrega>(`operations/entregas/${entregaId}/`, {
      bodega: payload.bodegaId,
      centro_costo: payload.centroCostoId,
      fecha_entrega: payload.fechaEntrega,
      recibido_por: payload.recibidoPor,
      observacion: payload.observacion,
    })
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 405) {
      return fetchDespacho(entregaId)
    }
    throw error
  }

  return fetchDespacho(entregaId)
}

/** Confirmar despacho en backend = ejecutar entrega aprobada. */
export async function confirmDespacho(entregaId: number): Promise<DespachoDocument> {
  await apiPost<ApiEntrega>(`operations/entregas/${entregaId}/ejecutar/`)
  return fetchDespacho(entregaId)
}
