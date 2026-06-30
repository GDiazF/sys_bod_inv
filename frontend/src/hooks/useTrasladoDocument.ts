import { useCallback, useEffect, useState } from 'react'
import type { DataViewStatus } from '@/components/data/DataView'
import {
  cloneTraslado,
  MOCK_TRASLADO,
  type TrasladoDocument,
} from '@/mocks/documents/traslado'
import type { DocumentStatus } from '@/mocks/documents/types'

const MOCK_DELAY_MS = 550
const ACTION_DELAY_MS = 900

export type UseTrasladoDocumentResult = {
  status: DataViewStatus
  document: TrasladoDocument | null
  setDocument: React.Dispatch<React.SetStateAction<TrasladoDocument | null>>
  refetch: () => void
  saveDraft: () => Promise<void>
  confirmDocument: () => Promise<void>
  isSaving: boolean
  isConfirming: boolean
  isReadOnly: boolean
}

export function useTrasladoDocument(): UseTrasladoDocumentResult {
  const [status, setStatus] = useState<DataViewStatus>('loading')
  const [document, setDocument] = useState<TrasladoDocument | null>(null)
  const [fetchKey, setFetchKey] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const refetch = useCallback(() => {
    setFetchKey((current) => current + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setDocument(null)

    const timer = window.setTimeout(() => {
      if (cancelled) {
        return
      }
      setDocument(cloneTraslado(MOCK_TRASLADO))
      setStatus('success')
    }, MOCK_DELAY_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [fetchKey])

  const saveDraft = useCallback(async () => {
    if (!document || isSaving || isConfirming) {
      return
    }

    setIsSaving(true)
    await new Promise((resolve) => window.setTimeout(resolve, ACTION_DELAY_MS))
    setDocument((current) =>
      current
        ? {
            ...current,
            header: {
              ...current.header,
              status: nextDraftStatus(current.header.status),
            },
          }
        : current,
    )
    setIsSaving(false)
  }, [document, isConfirming, isSaving])

  const confirmDocument = useCallback(async () => {
    if (!document || isSaving || isConfirming) {
      return
    }

    setIsConfirming(true)
    await new Promise((resolve) => window.setTimeout(resolve, ACTION_DELAY_MS))
    setDocument((current) =>
      current
        ? {
            ...current,
            header: { ...current.header, status: 'confirmado' },
          }
        : current,
    )
    setIsConfirming(false)
  }, [document, isConfirming, isSaving])

  const isReadOnly = document?.header.status === 'confirmado'

  return {
    status,
    document,
    setDocument,
    refetch,
    saveDraft,
    confirmDocument,
    isSaving,
    isConfirming,
    isReadOnly,
  }
}

function nextDraftStatus(current: DocumentStatus): DocumentStatus {
  if (current === 'confirmado') {
    return current
  }
  return current === 'borrador' ? 'borrador' : current
}
