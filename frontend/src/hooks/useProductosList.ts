import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '@/api/products'
import { isNetworkOrConfigError } from '@/api/client'
import type { DataViewStatus } from '@/components/data/DataView'
import { USE_API_MOCKS } from '@/config/env'
import { PRODUCTOS_FILTER_DEFAULTS } from '@/config/filter-options'
import type { PaginatedResult } from '@/api/types'
import {
  queryProducts,
  type ProductFilters,
  type ProductRow,
} from '@/mocks/products'

const MOCK_DELAY_MS = 550

export type UseProductosListResult = {
  status: DataViewStatus
  result: PaginatedResult<ProductRow> | null
  page: number
  setPage: (page: number) => void
  pageSize: number
  draftFilters: ProductFilters
  setDraftFilters: (filters: ProductFilters) => void
  updateDraftFilter: <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => void
  applyFilters: () => void
  clearFilters: () => void
  refetch: () => void
  isUsingMockFallback: boolean
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function loadProductos(
  filters: ProductFilters,
  page: number,
  pageSize: number,
): Promise<{ data: PaginatedResult<ProductRow>; usedMockFallback: boolean }> {
  if (USE_API_MOCKS) {
    await delay(MOCK_DELAY_MS)
    return {
      data: queryProducts(filters, page, pageSize),
      usedMockFallback: true,
    }
  }

  try {
    const data = await fetchProducts(filters, page, pageSize)
    return { data, usedMockFallback: false }
  } catch (error) {
    if (isNetworkOrConfigError(error)) {
      await delay(MOCK_DELAY_MS)
      return {
        data: queryProducts(filters, page, pageSize),
        usedMockFallback: true,
      }
    }
    throw error
  }
}

function toDataViewStatus(
  isLoading: boolean,
  isError: boolean,
  result: PaginatedResult<ProductRow> | null,
): DataViewStatus {
  if (isLoading) {
    return 'loading'
  }

  if (isError) {
    return 'error'
  }

  if (!result || result.total === 0) {
    return 'empty'
  }

  return 'success'
}

export function useProductosList(pageSize = 6): UseProductosListResult {
  const [draftFilters, setDraftFilters] = useState(PRODUCTOS_FILTER_DEFAULTS)
  const [appliedFilters, setAppliedFilters] = useState(PRODUCTOS_FILTER_DEFAULTS)
  const [page, setPage] = useState(1)

  const queryKey = useMemo(
    () => ['productos', appliedFilters, page, pageSize, USE_API_MOCKS] as const,
    [appliedFilters, page, pageSize],
  )

  const query = useQuery({
    queryKey,
    queryFn: () => loadProductos(appliedFilters, page, pageSize),
    placeholderData: (previous) => previous,
  })

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters)
    setPage(1)
  }, [draftFilters])

  const clearFilters = useCallback(() => {
    setDraftFilters(PRODUCTOS_FILTER_DEFAULTS)
    setAppliedFilters(PRODUCTOS_FILTER_DEFAULTS)
    setPage(1)
  }, [])

  const updateDraftFilter = useCallback(
    <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
      setDraftFilters((current) => ({ ...current, [key]: value }))
    },
    [],
  )

  const refetch = useCallback(() => {
    void query.refetch()
  }, [query])

  const result = query.data?.data ?? null
  const status = toDataViewStatus(query.isLoading, query.isError, result)

  return {
    status,
    result,
    page,
    setPage,
    pageSize,
    draftFilters,
    setDraftFilters,
    updateDraftFilter,
    applyFilters,
    clearFilters,
    refetch,
    isUsingMockFallback: query.data?.usedMockFallback ?? USE_API_MOCKS,
  }
}
