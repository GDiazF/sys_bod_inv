import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMovements } from '@/api/movements'
import { isNetworkOrConfigError } from '@/api/client'
import type { DataViewStatus } from '@/components/data/DataView'
import { USE_API_MOCKS } from '@/config/env'
import { MOVIMIENTOS_FILTER_DEFAULTS } from '@/config/filter-options'
import type { PaginatedResult } from '@/api/types'
import {
  queryMovements,
  type MovementFilters,
  type MovementRow,
} from '@/mocks/movements'

const MOCK_DELAY_MS = 550

export type UseMovimientosListResult = {
  status: DataViewStatus
  result: PaginatedResult<MovementRow> | null
  page: number
  setPage: (page: number) => void
  pageSize: number
  draftFilters: MovementFilters
  setDraftFilters: (filters: MovementFilters) => void
  updateDraftFilter: <K extends keyof MovementFilters>(key: K, value: MovementFilters[K]) => void
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

async function loadMovimientos(
  filters: MovementFilters,
  page: number,
  pageSize: number,
): Promise<{ data: PaginatedResult<MovementRow>; usedMockFallback: boolean }> {
  if (USE_API_MOCKS) {
    await delay(MOCK_DELAY_MS)
    return {
      data: queryMovements(filters, page, pageSize),
      usedMockFallback: true,
    }
  }

  try {
    const data = await fetchMovements({ filters, page, pageSize })
    return { data, usedMockFallback: false }
  } catch (error) {
    if (isNetworkOrConfigError(error)) {
      await delay(MOCK_DELAY_MS)
      return {
        data: queryMovements(filters, page, pageSize),
        usedMockFallback: true,
      }
    }
    throw error
  }
}

function toDataViewStatus(
  isLoading: boolean,
  isError: boolean,
  result: PaginatedResult<MovementRow> | null,
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

export function useMovimientosList(pageSize = 7): UseMovimientosListResult {
  const [draftFilters, setDraftFilters] = useState(MOVIMIENTOS_FILTER_DEFAULTS)
  const [appliedFilters, setAppliedFilters] = useState(MOVIMIENTOS_FILTER_DEFAULTS)
  const [page, setPage] = useState(1)

  const queryKey = useMemo(
    () => ['movimientos', appliedFilters, page, pageSize, USE_API_MOCKS] as const,
    [appliedFilters, page, pageSize],
  )

  const query = useQuery({
    queryKey,
    queryFn: () => loadMovimientos(appliedFilters, page, pageSize),
    placeholderData: (previous) => previous,
  })

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters)
    setPage(1)
  }, [draftFilters])

  const clearFilters = useCallback(() => {
    setDraftFilters(MOVIMIENTOS_FILTER_DEFAULTS)
    setAppliedFilters(MOVIMIENTOS_FILTER_DEFAULTS)
    setPage(1)
  }, [])

  const updateDraftFilter = useCallback(
    <K extends keyof MovementFilters>(key: K, value: MovementFilters[K]) => {
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
