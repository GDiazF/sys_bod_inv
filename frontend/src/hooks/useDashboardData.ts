import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDashboard } from '@/api/dashboard'
import { isNetworkOrConfigError } from '@/api/client'
import type { DataViewStatus } from '@/components/data/DataView'
import { USE_API_MOCKS } from '@/config/env'
import { MOCK_DASHBOARD_DATA, type DashboardData } from '@/mocks/dashboard'

const MOCK_DELAY_MS = 650

const EMPTY_DASHBOARD: DashboardData = {
  kpis: MOCK_DASHBOARD_DATA.kpis.map((kpi) => ({ ...kpi, value: '0', label: kpi.label })),
  activity: [],
  alerts: [],
  pendingDocs: [],
}

export type UseDashboardDataOptions = {
  simulateError?: boolean
  simulateEmpty?: boolean
}

export type UseDashboardDataResult = {
  status: DataViewStatus
  data: DashboardData | null
  refetch: () => void
  isUsingMockFallback: boolean
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function loadDashboard(
  simulateError: boolean,
  simulateEmpty: boolean,
): Promise<{ data: DashboardData; usedMockFallback: boolean }> {
  if (simulateError) {
    throw new Error('Error simulado en dashboard')
  }

  if (simulateEmpty) {
    await delay(MOCK_DELAY_MS)
    return { data: EMPTY_DASHBOARD, usedMockFallback: true }
  }

  if (USE_API_MOCKS) {
    await delay(MOCK_DELAY_MS)
    return { data: MOCK_DASHBOARD_DATA, usedMockFallback: true }
  }

  try {
    const data = await fetchDashboard()
    return { data, usedMockFallback: false }
  } catch (error) {
    if (isNetworkOrConfigError(error)) {
      await delay(MOCK_DELAY_MS)
      return { data: MOCK_DASHBOARD_DATA, usedMockFallback: true }
    }
    throw error
  }
}

function isDashboardEmpty(data: DashboardData): boolean {
  const allKpisZero = data.kpis.every((kpi) => {
    const numeric = Number(kpi.value.replace(/\./g, '').replace(/,/g, ''))
    return Number.isNaN(numeric) || numeric === 0
  })

  return (
    allKpisZero &&
    data.activity.length === 0 &&
    data.alerts.length === 0 &&
    data.pendingDocs.length === 0
  )
}

function toDataViewStatus(
  isLoading: boolean,
  isError: boolean,
  data: DashboardData | null,
  simulateEmpty: boolean,
): DataViewStatus {
  if (isLoading) {
    return 'loading'
  }

  if (isError) {
    return 'error'
  }

  if (!data || simulateEmpty || isDashboardEmpty(data)) {
    return 'empty'
  }

  return 'success'
}

export function useDashboardData(options: UseDashboardDataOptions = {}): UseDashboardDataResult {
  const { simulateError = false, simulateEmpty = false } = options

  const query = useQuery({
    queryKey: ['dashboard', USE_API_MOCKS, simulateError, simulateEmpty] as const,
    queryFn: () => loadDashboard(simulateError, simulateEmpty),
    placeholderData: (previous) => previous,
  })

  const refetch = useCallback(() => {
    void query.refetch()
  }, [query])

  const result = query.data?.data ?? null
  const status = toDataViewStatus(query.isLoading, query.isError, result, simulateEmpty)

  return {
    status,
    data: result,
    refetch,
    isUsingMockFallback: query.data?.usedMockFallback ?? USE_API_MOCKS,
  }
}
