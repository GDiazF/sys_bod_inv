import { useCallback, useEffect, useState } from 'react'
import type { DataViewStatus } from '@/components/data/DataView'
import { MOCK_DASHBOARD_DATA, type DashboardData } from '@/mocks/dashboard'

const MOCK_DELAY_MS = 650

export type UseDashboardDataOptions = {
  simulateError?: boolean
  simulateEmpty?: boolean
}

export type UseDashboardDataResult = {
  status: DataViewStatus
  data: DashboardData | null
  refetch: () => void
}

export function useDashboardData(options: UseDashboardDataOptions = {}): UseDashboardDataResult {
  const { simulateError = false, simulateEmpty = false } = options
  const [status, setStatus] = useState<DataViewStatus>('loading')
  const [data, setData] = useState<DashboardData | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  const refetch = useCallback(() => {
    setFetchKey((current) => current + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setData(null)

    const timer = window.setTimeout(() => {
      if (cancelled) {
        return
      }

      if (simulateError) {
        setStatus('error')
        return
      }

      if (simulateEmpty) {
        setData({ ...MOCK_DASHBOARD_DATA, activity: [], alerts: [], pendingDocs: [] })
        setStatus('empty')
        return
      }

      setData(MOCK_DASHBOARD_DATA)
      setStatus('success')
    }, MOCK_DELAY_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [fetchKey, simulateError, simulateEmpty])

  return { status, data, refetch }
}
