import type { ProductoCategoriaFilter, ProductoStockFilter } from '@/config/filter-options'
import type { ProductStockStatus } from '@/mocks/status-labels'

export type ProductRow = {
  sku: string
  name: string
  sub: string
  category: Exclude<ProductoCategoriaFilter, 'Todas'>
  stock: number
  min: number
  location: string
  status: ProductStockStatus
  lastMove: string
}

const BASE_PRODUCTS: ProductRow[] = [
  {
    sku: 'SKU-004821',
    name: 'Tornillo hex M8×25',
    sub: 'Ferretería · unidad',
    category: 'Ferretería',
    stock: 1240,
    min: 200,
    location: 'A-03-02',
    status: 'en_stock',
    lastMove: '28/06',
  },
  {
    sku: 'SKU-004830',
    name: 'Tuerca autobloc. M8',
    sub: 'Ferretería · unidad',
    category: 'Ferretería',
    stock: 45,
    min: 100,
    location: 'A-04-01',
    status: 'stock_bajo',
    lastMove: '28/06',
  },
  {
    sku: 'SKU-005101',
    name: 'Bisagra industrial 80mm',
    sub: 'Herrajes · unidad',
    category: 'Herrajes',
    stock: 0,
    min: 50,
    location: 'B-12-01',
    status: 'agotado',
    lastMove: '27/06',
  },
  {
    sku: 'SKU-006001',
    name: 'Cable UTP Cat6 305m',
    sub: 'Eléctrico · rollo',
    category: 'Eléctrico',
    stock: 12,
    min: 5,
    location: 'C-01-01',
    status: 'en_stock',
    lastMove: '28/06',
  },
  {
    sku: 'SKU-006002',
    name: 'Canaleta 40×25mm',
    sub: 'Eléctrico · metro',
    category: 'Eléctrico',
    stock: 480,
    min: 100,
    location: 'C-01-02',
    status: 'en_stock',
    lastMove: '28/06',
  },
  {
    sku: 'SKU-007001',
    name: 'Pintura epoxi gris 4L',
    sub: 'Pinturas · galón',
    category: 'Pinturas',
    stock: 34,
    min: 20,
    location: 'D-05-01',
    status: 'stock_bajo',
    lastMove: '26/06',
  },
]

const PRODUCT_CATEGORIES = ['Ferretería', 'Eléctrico', 'Pinturas', 'Herrajes'] as const
const PRODUCT_STATUSES: ProductStockStatus[] = ['en_stock', 'stock_bajo', 'agotado']

function buildProductCatalog(): ProductRow[] {
  const rows: ProductRow[] = [...BASE_PRODUCTS]

  for (let index = 1; index <= 42; index += 1) {
    const base = BASE_PRODUCTS[index % BASE_PRODUCTS.length]
    const sku = `SKU-${String(4800 + index)}`

    if (rows.some((row) => row.sku === sku)) {
      continue
    }

    const category = PRODUCT_CATEGORIES[index % PRODUCT_CATEGORIES.length]
    rows.push({
      ...base,
      sku,
      name: `${base.name} · serie ${index}`,
      sub: `${category} · unidad`,
      category,
      stock: (index * 17) % 500,
      min: 20 + (index % 80),
      location: `Z-${String(index % 9)}-${String(index % 12).padStart(2, '0')}`,
      status: PRODUCT_STATUSES[index % PRODUCT_STATUSES.length],
      lastMove: `${String(26 + (index % 3)).padStart(2, '0')}/06`,
    })
  }

  return rows
}

export const MOCK_PRODUCTS = buildProductCatalog()

export type ProductFilters = {
  q: string
  category: ProductoCategoriaFilter
  stockStatus: ProductoStockFilter
}

export type PaginatedRows<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

function matchesStockFilter(status: ProductStockStatus, stockStatus: ProductoStockFilter): boolean {
  if (stockStatus === 'Todos') {
    return true
  }
  if (stockStatus === 'En stock') {
    return status === 'en_stock'
  }
  if (stockStatus === 'Stock bajo') {
    return status === 'stock_bajo'
  }
  return status === 'agotado'
}

export function queryProducts(
  filters: ProductFilters,
  page: number,
  pageSize: number,
): PaginatedRows<ProductRow> {
  const q = filters.q.trim().toLowerCase()
  const filtered = MOCK_PRODUCTS.filter((product) => {
    if (filters.category !== 'Todas' && product.category !== filters.category) {
      return false
    }

    if (!matchesStockFilter(product.status, filters.stockStatus)) {
      return false
    }

    if (q) {
      const haystack = [product.sku, product.name, product.category].join(' ').toLowerCase()
      if (!haystack.includes(q)) {
        return false
      }
    }

    return true
  })

  const total = filtered.length
  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return { items, total, page, pageSize }
}

/** Total de referencia del diseño original (1.247 productos). */
export const PRODUCTOS_TOTAL_REF = 1247
