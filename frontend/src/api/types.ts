/** Respuesta paginada estándar de DRF (PageNumberPagination). */
export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
