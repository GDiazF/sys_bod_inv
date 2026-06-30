import { useCallback, useEffect, useState } from 'react'
import type { DataViewStatus } from '@/components/data/DataView'

const MOCK_DELAY_MS = 550

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type UsePaginatedMockListOptions<TFilters, TRow> = {
  queryFn: (filters: TFilters, page: number, pageSize: number) => PaginatedResult<TRow>
  initialFilters: TFilters
  pageSize?: number
  simulateError?: boolean
}

export type UsePaginatedMockListResult<TFilters, TRow> = {
  status: DataViewStatus
  result: PaginatedResult<TRow> | null
  page: number
  setPage: (page: number) => void
  pageSize: number
  draftFilters: TFilters
  setDraftFilters: (filters: TFilters) => void
  updateDraftFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void
  applyFilters: () => void
  clearFilters: () => void
  refetch: () => void
}

export function usePaginatedMockList<TFilters, TRow>({
  queryFn,
  initialFilters,
  pageSize = 7,
  simulateError = false,
}: UsePaginatedMockListOptions<TFilters, TRow>): UsePaginatedMockListResult<TFilters, TRow> {
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<DataViewStatus>('loading')
  const [result, setResult] = useState<PaginatedResult<TRow> | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters)
    setPage(1)
    setFetchKey((current) => current + 1)
  }, [draftFilters])

  const clearFilters = useCallback(() => {
    setDraftFilters(initialFilters)
    setAppliedFilters(initialFilters)
    setPage(1)
    setFetchKey((current) => current + 1)
  }, [initialFilters])

  const refetch = useCallback(() => {
    setFetchKey((current) => current + 1)
  }, [])

  const updateDraftFilter = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setResult(null)

    const timer = window.setTimeout(() => {
      if (cancelled) {
        return
      }

      if (simulateError) {
        setStatus('error')
        return
      }

      const next = queryFn(appliedFilters, page, pageSize)
      if (next.total === 0) {
        setResult(next)
        setStatus('empty')
        return
      }

      setResult(next)
      setStatus('success')
    }, MOCK_DELAY_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [appliedFilters, page, pageSize, fetchKey, queryFn, simulateError])

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
  }
}
