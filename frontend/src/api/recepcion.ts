/**
 * Recepción (UI REC-XXXX) ↔ Compra (API operations/compras/).
 * PATCH de cabecera/líneas aún no existe en DRF v1; updateRecepcion queda preparado.
 */
import { apiGet, apiPatch, apiPost } from '@/api/client'
import type { PaginatedResponse } from '@/api/types'
import { fetchBodegaCodigoMap } from '@/api/movements'
import {
  deriveLineStatus,
  type RecepcionDocument,
  type RecepcionLine,
} from '@/mocks/documents/recepcion'
import type { DocumentStatus, SelectOption } from '@/mocks/documents/types'

export type ApiCompraDetalle = {
  id: number
  producto: number
  lote: number | null
  numero_serie: string | null
  cantidad: string
  costo_unitario: string
  observacion: string | null
}

export type ApiCompra = {
  id: number
  numero: string
  proveedor: number
  bodega_destino: number
  estado_codigo: string
  fecha_compra: string
  observacion: string | null
  created_by: number
  detalles: ApiCompraDetalle[]
}

type ApiProveedor = {
  id: number
  razon_social: string
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

export type RecepcionUpdatePayload = {
  proveedorId?: number
  bodegaDestinoId?: number
  fechaCompra?: string
  observacion?: string
  lines?: Array<{
    detalleId: number
    receivedQty?: number
    location?: string
    batch?: string
  }>
}

const RECEPCION_WORKFLOW_ESTADOS = new Set(['BORRADOR', 'PENDIENTE', 'APROBADO'])

let bodegasLabelCache: Promise<Map<number, string>> | null = null

export function resetRecepcionCaches(): void {
  bodegasLabelCache = null
}

export function formatRecepcionCode(numero: string): string {
  if (numero.startsWith('COM-')) {
    return `REC-${numero.slice(4)}`
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
    bodegasLabelCache = fetchBodegaCodigoMap().then((codigoMap) => {
      const labelMap = new Map<number, string>()
      for (const [id, codigo] of codigoMap) {
        labelMap.set(id, codigo)
      }
      return labelMap
    })
  }

  return bodegasLabelCache
}

async function fetchProveedorOptions(): Promise<SelectOption[]> {
  const response = await apiGet<PaginatedResponse<ApiProveedor>>('inventory/proveedores/', {
    page_size: 200,
    activo: true,
  })

  return response.results.map((proveedor) => ({
    value: String(proveedor.id),
    label: proveedor.razon_social,
  }))
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

async function fetchLoteCodigo(_loteId: number | null): Promise<string> {
  // Sin endpoint /inventory/lotes/ en API v1; el código de lote no está en CompraDetalleSerializer.
  return ''
}

async function fetchUsuarioNombre(usuarioId: number): Promise<string> {
  try {
    const usuario = await apiGet<ApiUsuarioMini>(`security/usuarios/${usuarioId}/`)
    return usuario.nombre_completo
  } catch {
    return '—'
  }
}

export async function resolveRecepcionCompraId(explicitId?: string | number): Promise<number | null> {
  if (explicitId !== undefined && explicitId !== '') {
    const parsed = Number(explicitId)
    return Number.isNaN(parsed) ? null : parsed
  }

  const response = await apiGet<PaginatedResponse<ApiCompra>>('operations/compras/', {
    page_size: 25,
    ordering: '-created_at',
  })

  const candidate = response.results.find((compra) => RECEPCION_WORKFLOW_ESTADOS.has(compra.estado_codigo))
  return candidate?.id ?? response.results[0]?.id ?? null
}

export async function fetchRecepcion(compraId: number): Promise<RecepcionDocument> {
  const compra = await apiGet<ApiCompra>(`operations/compras/${compraId}/`)

  const [proveedorOptions, bodegaOptions, ubicacionOptions, productMap, operatorName] =
    await Promise.all([
      fetchProveedorOptions(),
      fetchBodegaOptions(),
      fetchUbicacionOptions(compra.bodega_destino),
      fetchProductMap(compra.detalles.map((detalle) => detalle.producto)),
      fetchUsuarioNombre(compra.created_by),
    ])

  const defaultLocation = ubicacionOptions[0]?.value ?? '—'

  const lines: RecepcionLine[] = await Promise.all(
    compra.detalles.map(async (detalle, index) => {
      const product = productMap.get(detalle.producto)
      const qty = Number(detalle.cantidad)
      const batch = await fetchLoteCodigo(detalle.lote)

      return {
        id: `line-${detalle.id}`,
        lineNumber: String(index + 1).padStart(3, '0'),
        sku: product?.sku ?? '—',
        description: product?.nombre ?? '—',
        expectedQty: qty,
        receivedQty: qty,
        location: defaultLocation,
        batch,
        lineStatus: deriveLineStatus(qty, qty),
        locationOptions: ubicacionOptions,
        detalleId: detalle.id,
      }
    }),
  )

  return {
    compraId: compra.id,
    header: {
      code: formatRecepcionCode(compra.numero),
      status: mapEstadoToDocumentStatus(compra.estado_codigo),
      date: compra.fecha_compra,
      supplier: String(compra.proveedor),
      purchaseOrder: compra.numero,
      warehouse: String(compra.bodega_destino),
      operator: operatorName,
      notes: compra.observacion ?? '',
      supplierOptions: proveedorOptions,
      warehouseOptions: bodegaOptions,
    },
    lines,
  }
}

/**
 * PATCH /operations/compras/{id}/ no está expuesto en DRF v1.
 * La UI conserva cambios en estado local hasta que exista el endpoint.
 */
export async function updateRecepcion(
  compraId: number,
  payload: RecepcionUpdatePayload,
): Promise<RecepcionDocument> {
  try {
    await apiPatch<ApiCompra>(`operations/compras/${compraId}/`, {
      proveedor: payload.proveedorId,
      bodega_destino: payload.bodegaDestinoId,
      fecha_compra: payload.fechaCompra,
      observacion: payload.observacion,
    })
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 405) {
      // Sin PATCH en el viewset: los cambios quedan solo en el estado local del hook.
      return fetchRecepcion(compraId)
    }
    throw error
  }

  return fetchRecepcion(compraId)
}

export async function confirmRecepcion(compraId: number): Promise<RecepcionDocument> {
  await apiPost<ApiCompra>(`operations/compras/${compraId}/confirmar/`)
  return fetchRecepcion(compraId)
}
