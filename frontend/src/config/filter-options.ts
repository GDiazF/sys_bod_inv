/** Opciones de filtros para listados (UI, sin lógica de negocio). */
export const MOVIMIENTO_TIPO_OPTIONS = [
  'Todos',
  'Entrada',
  'Salida',
  'Transferencia',
  'Ajuste',
] as const

export const PRODUCTO_CATEGORIA_OPTIONS = [
  'Todas',
  'Ferretería',
  'Eléctrico',
  'Pinturas',
  'Herrajes',
] as const

export const PRODUCTO_STOCK_OPTIONS = ['Todos', 'En stock', 'Stock bajo', 'Agotado'] as const

export type MovimientoTipoFilter = (typeof MOVIMIENTO_TIPO_OPTIONS)[number]
export type ProductoCategoriaFilter = (typeof PRODUCTO_CATEGORIA_OPTIONS)[number]
export type ProductoStockFilter = (typeof PRODUCTO_STOCK_OPTIONS)[number]

export const MOVIMIENTOS_FILTER_DEFAULTS = {
  q: '',
  type: 'Todos' as MovimientoTipoFilter,
  from: '2026-06-01',
  to: '2026-06-28',
}

export const PRODUCTOS_FILTER_DEFAULTS = {
  q: '',
  category: 'Todas' as ProductoCategoriaFilter,
  stockStatus: 'Todos' as ProductoStockFilter,
}
