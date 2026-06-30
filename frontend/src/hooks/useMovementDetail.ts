import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMovementDetail } from '@/api/movement-detail'
import { ApiError, isNetworkOrConfigError } from '@/api/client'
import type { DataViewStatus } from '@/components/data/DataView'
import { USE_API_MOCKS } from '@/config/env'
import { parseMovementRouteId } from '@/lib/movement-id'
import { getMovementDetail, type MovementDetail } from '@/mocks/movement-detail'

const MOCK_DELAY_MS = 550

type MovementDetailQueryResult = {
  data: MovementDetail | null
  usedMockFallback: boolean
  notFound: boolean
}

export type UseMovementDetailResult = {
  status: DataViewStatus
  detail: MovementDetail | null
  refetch: () => void
  isUsingMockFallback: boolean
  isNotFound: boolean
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function loadMovementDetail(numericId: number): Promise<MovementDetailQueryResult> {
  if (USE_API_MOCKS) {
    await delay(MOCK_DELAY_MS)
    const data = getMovementDetail(numericId)
    return {
      data,
      usedMockFallback: true,
      notFound: data === null,
    }
  }

  try {
    const data = await fetchMovementDetail(numericId)
    return {
      data,
      usedMockFallback: false,
      notFound: data === null,
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {
        data: null,
        usedMockFallback: false,
        notFound: true,
      }
    }

    if (isNetworkOrConfigError(error)) {
      await delay(MOCK_DELAY_MS)
      const data = getMovementDetail(numericId)
      return {
        data,
        usedMockFallback: true,
        notFound: data === null,
      }
    }

    throw error
  }
}

function toDataViewStatus(
  isLoading: boolean,
  isError: boolean,
  result: MovementDetailQueryResult | undefined,
): DataViewStatus {
  if (isLoading) {
    return 'loading'
  }

  if (isError) {
    return 'error'
  }

  if (!result || result.notFound || !result.data) {
    return 'empty'
  }

  return 'success'
}

export function useMovementDetail(routeId: string | undefined): UseMovementDetailResult {
  const numericId = useMemo(() => parseMovementRouteId(routeId), [routeId])

  const query = useQuery({
    queryKey: ['movement-detail', numericId, USE_API_MOCKS] as const,
    queryFn: async () => {
      if (numericId === null) {
        return {
          data: null,
          usedMockFallback: USE_API_MOCKS,
          notFound: true,
        } satisfies MovementDetailQueryResult
      }

      return loadMovementDetail(numericId)
    },
    enabled: routeId !== undefined,
  })

  const refetch = useCallback(() => {
    void query.refetch()
  }, [query])

  const result = query.data
  const status = toDataViewStatus(query.isLoading, query.isError, result)

  return {
    status,
    detail: result?.data ?? null,
    refetch,
    isUsingMockFallback: result?.usedMockFallback ?? USE_API_MOCKS,
    isNotFound: result?.notFound ?? false,
  }
}
