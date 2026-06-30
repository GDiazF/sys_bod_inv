/**
 * Traslado (UI TRA-XXXX) ↔ Traslado (API operations/traslados/).
 * Confirmar en UI: APROBADO → POST .../despachar/; EN_TRANSITO → POST .../recibir/.
 * PATCH de cabecera/líneas aún no existe; updateTraslado queda preparado.
 */
import { apiGet, apiPatch, apiPost } from '@/api/client'
import type { PaginatedResponse } from '@/api/types'
import { fetchBodegaCodigoMap } from '@/api/movements'
import {
  deriveTrasladoLineStatus,
  type TrasladoDocument,
  type TrasladoLine,
} from '@/mocks/documents/traslado'
import type { DocumentStatus, SelectOption } from '@/mocks/documents/types'

export type ApiTrasladoDetalle = {
  id: number
  producto: number
  cantidad_trasladada: string
  serie: number | null
  lote: number | null
  observacion: string | null
}

export type ApiTraslado = {
  id: number
  numero: string
  bodega_origen: number
  bodega_destino: number
  bodega_transito: number | null
  estado_codigo: string
  fecha_salida: string | null
  fecha_recepcion: string | null
  motivo: string | null
  created_by: number
  detalles: ApiTrasladoDetalle[]
  created_at: string
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

export type TrasladoUpdatePayload = {
  bodegaOrigenId?: number
  bodegaDestinoId?: number
  fechaSalida?: string
  motivo?: string
  lines?: Array<{
    detalleId: number
    transferQty?: number
    originLocation?: string
    destLocation?: string
  }>
}

const TRASLADO_WORKFLOW_ESTADOS = new Set(['BORRADOR', 'PENDIENTE', 'APROBADO', 'EN_TRANSITO'])

const DEFAULT_REASON_OPTIONS: SelectOption[] = [
  { value: 'reubicacion', label: 'Reubicación por espacio' },
  { value: 'consolidacion', label: 'Consolidación' },
  { value: 'optimizacion', label: 'Optimización de picking' },
]

let bodegasLabelCache: Promise<Map<number, string>> | null = null

export function resetTrasladoCaches(): void {
  bodegasLabelCache = null
}

function mapEstadoToDocumentStatus(estadoCodigo: string): DocumentStatus {
  switch (estadoCodigo) {
    case 'BORRADOR':
      return 'borrador'
    case 'PENDIENTE':
      return 'pendiente'
    case 'APROBADO':
    case 'EN_TRANSITO':
      return 'en_proceso'
    case 'CERRADO':
      return 'confirmado'
    case 'RECHAZADO':
    case 'ANULADO':
      return 'revision'
    default:
      return 'borrador'
  }
}

function resolveDocumentDate(traslado: ApiTraslado): string {
  if (traslado.fecha_salida) {
    return traslado.fecha_salida
  }
  if (traslado.fecha_recepcion) {
    return traslado.fecha_recepcion
  }
  return traslado.created_at.slice(0, 10)
}

function buildReasonOptions(motivo: string | null): SelectOption[] {
  const trimmed = motivo?.trim()
  if (!trimmed) {
    return [...DEFAULT_REASON_OPTIONS]
  }

  const exists = DEFAULT_REASON_OPTIONS.some(
    (option) => option.value === trimmed || option.label === trimmed,
  )
  if (exists) {
    return [...DEFAULT_REASON_OPTIONS]
  }

  return [{ value: trimmed, label: trimmed }, ...DEFAULT_REASON_OPTIONS]
}

function resolveReasonValue(motivo: string | null, options: SelectOption[]): string {
  const trimmed = motivo?.trim()
  if (!trimmed) {
    return options[0]?.value ?? DEFAULT_REASON_OPTIONS[0].value
  }

  const match = options.find((option) => option.value === trimmed || option.label === trimmed)
  return match?.value ?? trimmed
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
    if (!bodegasLabelCache) {
      bodegasLabelCache = fetchBodegaCodigoMap().then((codigoMap) => new Map(codigoMap))
    }
    const bodegas = await bodegasLabelCache
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

export async function resolveTrasladoId(explicitId?: string | number): Promise<number | null> {
  if (explicitId !== undefined && explicitId !== '') {
    const parsed = Number(explicitId)
    return Number.isNaN(parsed) ? null : parsed
  }

  const response = await apiGet<PaginatedResponse<ApiTraslado>>('operations/traslados/', {
    page_size: 25,
    ordering: '-created_at',
  })

  const candidate = response.results.find((traslado) =>
    TRASLADO_WORKFLOW_ESTADOS.has(traslado.estado_codigo),
  )
  return candidate?.id ?? response.results[0]?.id ?? null
}

export async function fetchTraslado(trasladoId: number): Promise<TrasladoDocument> {
  const traslado = await apiGet<ApiTraslado>(`operations/traslados/${trasladoId}/`)

  const reasonOptions = buildReasonOptions(traslado.motivo)

  const [bodegaOptions, originUbicaciones, destUbicaciones, productMap, operatorName] =
    await Promise.all([
      fetchBodegaOptions(),
      fetchUbicacionOptions(traslado.bodega_origen),
      fetchUbicacionOptions(traslado.bodega_destino),
      fetchProductMap(traslado.detalles.map((detalle) => detalle.producto)),
      fetchUsuarioNombre(traslado.created_by),
    ])

  const defaultOriginLocation = originUbicaciones[0]?.value ?? '—'
  const defaultDestLocation = destUbicaciones[0]?.value ?? '—'

  const lines: TrasladoLine[] = traslado.detalles.map((detalle, index) => {
    const product = productMap.get(detalle.producto)
    const qty = Number(detalle.cantidad_trasladada)

    return {
      id: `tra-line-${detalle.id}`,
      lineNumber: String(index + 1).padStart(3, '0'),
      sku: product?.sku ?? '—',
      description: product?.nombre ?? '—',
      plannedQty: qty,
      transferQty: qty,
      originLocation: defaultOriginLocation,
      destLocation: defaultDestLocation,
      lineStatus: deriveTrasladoLineStatus(qty, qty),
      originLocationOptions: originUbicaciones,
      destLocationOptions: destUbicaciones,
      detalleId: detalle.id,
    }
  })

  return {
    trasladoId: traslado.id,
    estadoCodigo: traslado.estado_codigo,
    header: {
      code: traslado.numero,
      status: mapEstadoToDocumentStatus(traslado.estado_codigo),
      date: resolveDocumentDate(traslado),
      warehouseOrigin: String(traslado.bodega_origen),
      warehouseDest: String(traslado.bodega_destino),
      reason: resolveReasonValue(traslado.motivo, reasonOptions),
      operator: operatorName,
      notes: traslado.motivo ?? '',
      warehouseOriginOptions: bodegaOptions,
      warehouseDestOptions: bodegaOptions,
      reasonOptions,
    },
    lines,
  }
}

/**
 * PATCH /operations/traslados/{id}/ no está expuesto en DRF v1.
 */
export async function updateTraslado(
  trasladoId: number,
  payload: TrasladoUpdatePayload,
): Promise<TrasladoDocument> {
  try {
    await apiPatch<ApiTraslado>(`operations/traslados/${trasladoId}/`, {
      bodega_origen: payload.bodegaOrigenId,
      bodega_destino: payload.bodegaDestinoId,
      fecha_salida: payload.fechaSalida,
      motivo: payload.motivo,
    })
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 405) {
      return fetchTraslado(trasladoId)
    }
    throw error
  }

  return fetchTraslado(trasladoId)
}

/**
 * Confirmar traslado en UI: despachar si APROBADO, recibir si EN_TRANSITO.
 */
export async function confirmTraslado(
  trasladoId: number,
  estadoCodigo?: string,
): Promise<TrasladoDocument> {
  const estado = estadoCodigo ?? (await apiGet<ApiTraslado>(`operations/traslados/${trasladoId}/`)).estado_codigo

  if (estado === 'APROBADO') {
    await apiPost<ApiTraslado>(`operations/traslados/${trasladoId}/despachar/`)
  } else if (estado === 'EN_TRANSITO') {
    await apiPost<ApiTraslado>(`operations/traslados/${trasladoId}/recibir/`)
  } else {
    throw new Error(
      'El traslado debe estar aprobado (despachar) o en tránsito (recibir) para confirmar.',
    )
  }

  return fetchTraslado(trasladoId)
}
