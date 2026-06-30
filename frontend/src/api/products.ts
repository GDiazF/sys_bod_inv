import { apiGet } from '@/api/client'
import type { PaginatedResponse, PaginatedResult } from '@/api/types'
import type { ProductoCategoriaFilter, ProductoStockFilter } from '@/config/filter-options'
import type { ProductFilters, ProductRow } from '@/mocks/products'
import type { ProductStockStatus } from '@/mocks/status-labels'

export type ApiProducto = {
  id: number
  sku: string
  nombre: string
  descripcion: string | null
  categoria: number | null
  unidad_medida: number
  tipo_control_codigo: string
  activo: boolean
  updated_at: string
}

export type ApiStockActual = {
  id: number
  producto: number
  producto_sku: string
  bodega_codigo: string
  cantidad: string
  updated_at: string
}

export type ApiCategoria = {
  id: number
  nombre: string
  codigo: string
}

export type FetchProductsApiParams = {
  search?: string
  categoria?: number
  stock?: string
  page: number
  page_size: number
}

export type CategoriaMaps = {
  byName: Map<string, number>
  byId: Map<number, string>
}

type StockAggregate = {
  stock: number
  location: string
  updatedAt: string | null
}

const STOCK_FILTER_TO_PARAM: Partial<Record<ProductoStockFilter, string>> = {
  'En stock': 'en_stock',
  'Stock bajo': 'stock_bajo',
  Agotado: 'agotado',
}

const DEFAULT_MIN_STOCK = 0

let categoriasCache: Promise<CategoriaMaps> | null = null

export function resetCategoriasCache(): void {
  categoriasCache = null
}

export async function fetchCategoriaMaps(): Promise<CategoriaMaps> {
  if (!categoriasCache) {
    categoriasCache = apiGet<PaginatedResponse<ApiCategoria>>('catalogs/categorias/', {
      page_size: 100,
    }).then((response) => {
      const byName = new Map<string, number>()
      const byId = new Map<number, string>()

      for (const categoria of response.results) {
        byName.set(categoria.nombre.toLowerCase(), categoria.id)
        byId.set(categoria.id, categoria.nombre)
      }

      return { byName, byId }
    })
  }

  return categoriasCache
}

export function resolveCategoriaId(
  category: ProductoCategoriaFilter,
  maps: CategoriaMaps,
): number | undefined {
  if (category === 'Todas') {
    return undefined
  }

  return maps.byName.get(category.toLowerCase())
}

export function buildProductsQueryParams(
  filters: ProductFilters,
  page: number,
  pageSize: number,
  categoriaId?: number,
): FetchProductsApiParams {
  const params: FetchProductsApiParams = {
    page,
    page_size: pageSize,
  }

  const search = filters.q.trim()
  if (search) {
    params.search = search
  }

  if (categoriaId !== undefined) {
    params.categoria = categoriaId
  }

  const stockParam = STOCK_FILTER_TO_PARAM[filters.stockStatus]
  if (stockParam) {
    params.stock = stockParam
  }

  return params
}

function formatShortDate(iso: string | null): string {
  if (!iso) {
    return '—'
  }

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

export function deriveStockStatus(stock: number, min = DEFAULT_MIN_STOCK): ProductStockStatus {
  if (stock <= 0) {
    return 'agotado'
  }

  if (stock < min) {
    return 'stock_bajo'
  }

  return 'en_stock'
}

async function fetchStockForProducts(productIds: number[]): Promise<Map<number, StockAggregate>> {
  if (productIds.length === 0) {
    return new Map()
  }

  const entries: Array<[number, StockAggregate]> = await Promise.all(
    productIds.map(async (productId) => {
      try {
        const response = await apiGet<PaginatedResponse<ApiStockActual>>('inventory/stock/', {
          product: productId,
          page_size: 100,
        })

        const stock = response.results.reduce((sum, row) => sum + Number(row.cantidad), 0)
        const primary = [...response.results].sort(
          (left, right) => Number(right.cantidad) - Number(left.cantidad),
        )[0]

        return [
          productId,
          {
            stock,
            location: primary?.bodega_codigo ?? '—',
            updatedAt: primary?.updated_at ?? null,
          },
        ] as [number, StockAggregate]
      } catch {
        return [
          productId,
          {
            stock: 0,
            location: '—',
            updatedAt: null,
          },
        ] as [number, StockAggregate]
      }
    }),
  )

  return new Map(entries)
}

export function mapApiProductToRow(
  product: ApiProducto,
  stockInfo: StockAggregate,
  categoriaNombre: string | null,
): ProductRow {
  const categoryLabel = categoriaNombre ?? 'Sin categoría'
  const stock = stockInfo.stock
  const min = DEFAULT_MIN_STOCK

  return {
    sku: product.sku,
    name: product.nombre,
    sub: `${categoryLabel} · ${product.tipo_control_codigo.toLowerCase()}`,
    category: categoryLabel as ProductRow['category'],
    stock,
    min,
    location: stockInfo.location,
    status: deriveStockStatus(stock, min),
    lastMove: formatShortDate(stockInfo.updatedAt ?? product.updated_at),
  }
}

export async function fetchProducts(
  filters: ProductFilters,
  page: number,
  pageSize: number,
): Promise<PaginatedResult<ProductRow>> {
  const categoriaMaps = await fetchCategoriaMaps()
  const categoriaId = resolveCategoriaId(filters.category, categoriaMaps)
  const params = buildProductsQueryParams(filters, page, pageSize, categoriaId)

  const response = await apiGet<PaginatedResponse<ApiProducto>>('inventory/productos/', params)
  const productIds = response.results.map((product) => product.id)
  const stockByProduct = await fetchStockForProducts(productIds)

  const items = response.results.map((product) => {
    const categoriaNombre =
      product.categoria !== null ? (categoriaMaps.byId.get(product.categoria) ?? null) : null
    const stockInfo = stockByProduct.get(product.id) ?? {
      stock: 0,
      location: '—',
      updatedAt: null,
    }

    return mapApiProductToRow(product, stockInfo, categoriaNombre)
  })

  return {
    items,
    total: response.count,
    page,
    pageSize,
  }
}
