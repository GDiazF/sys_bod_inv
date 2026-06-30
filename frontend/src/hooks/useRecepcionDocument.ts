import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  confirmRecepcion,
  fetchRecepcion,
  resolveRecepcionCompraId,
} from '@/api/recepcion'
import { ApiError, isNetworkOrConfigError } from '@/api/client'
import type { DataViewStatus } from '@/components/data/DataView'
import { USE_API_MOCKS } from '@/config/env'
import {
  cloneRecepcion,
  MOCK_RECEPCION,
  type RecepcionDocument,
} from '@/mocks/documents/recepcion'

const MOCK_DELAY_MS = 550
const ACTION_DELAY_MS = 900

type RecepcionQueryResult = {
  document: RecepcionDocument | null
  usedMockFallback: boolean
  notFound: boolean
}

export type UseRecepcionDocumentOptions = {
  simulateError?: boolean
  simulateEmpty?: boolean
  documentId?: string | number
}

export type UseRecepcionDocumentResult = {
  status: DataViewStatus
  document: RecepcionDocument | null
  setDocument: React.Dispatch<React.SetStateAction<RecepcionDocument | null>>
  refetch: () => void
  saveDraft: () => Promise<void>
  confirmDocument: () => Promise<void>
  isSaving: boolean
  isConfirming: boolean
  isReadOnly: boolean
  isUsingMockFallback: boolean
  isNotFound: boolean
  actionError: string | null
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function loadRecepcionDocument(
  explicitId: string | undefined,
  simulateError: boolean,
  simulateEmpty: boolean,
): Promise<RecepcionQueryResult> {
  if (simulateError) {
    throw new Error('Error simulado en recepción')
  }

  if (simulateEmpty) {
    await delay(MOCK_DELAY_MS)
    return {
      document: null,
      usedMockFallback: true,
      notFound: true,
    }
  }

  if (USE_API_MOCKS) {
    await delay(MOCK_DELAY_MS)
    return {
      document: cloneRecepcion(MOCK_RECEPCION),
      usedMockFallback: true,
      notFound: false,
    }
  }

  try {
    const compraId = await resolveRecepcionCompraId(explicitId)
    if (compraId === null) {
      return {
        document: null,
        usedMockFallback: false,
        notFound: true,
      }
    }

    const document = await fetchRecepcion(compraId)
    return {
      document,
      usedMockFallback: false,
      notFound: false,
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {
        document: null,
        usedMockFallback: false,
        notFound: true,
      }
    }

    if (isNetworkOrConfigError(error)) {
      await delay(MOCK_DELAY_MS)
      return {
        document: cloneRecepcion(MOCK_RECEPCION),
        usedMockFallback: true,
        notFound: false,
      }
    }

    throw error
  }
}

function toDataViewStatus(
  isLoading: boolean,
  isError: boolean,
  result: RecepcionQueryResult | undefined,
  simulateEmpty: boolean,
): DataViewStatus {
  if (isLoading) {
    return 'loading'
  }

  if (isError) {
    return 'error'
  }

  if (!result || result.notFound || simulateEmpty || !result.document) {
    return 'empty'
  }

  return 'success'
}

export function useRecepcionDocument(
  options: UseRecepcionDocumentOptions = {},
): UseRecepcionDocumentResult {
  const { simulateError = false, simulateEmpty = false, documentId } = options
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const explicitId = documentId !== undefined ? String(documentId) : (searchParams.get('id') ?? undefined)

  const [document, setDocument] = useState<RecepcionDocument | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const queryKey = useMemo(
    () => ['recepcion', explicitId, USE_API_MOCKS, simulateError, simulateEmpty] as const,
    [explicitId, simulateError, simulateEmpty],
  )

  const query = useQuery({
    queryKey,
    queryFn: () => loadRecepcionDocument(explicitId, simulateError, simulateEmpty),
    placeholderData: (previous) => previous,
  })

  useEffect(() => {
    if (query.data?.document) {
      setDocument(cloneRecepcion(query.data.document))
    } else if (query.data?.notFound) {
      setDocument(null)
    }
  }, [query.data])

  const refetch = useCallback(() => {
    setActionError(null)
    void query.refetch()
  }, [query])

  const saveDraft = useCallback(async () => {
    if (!document || isSaving || isConfirming) {
      return
    }

    setIsSaving(true)
    setActionError(null)

    try {
      if (USE_API_MOCKS) {
        await delay(ACTION_DELAY_MS)
        setDocument((current) =>
          current
            ? {
                ...current,
                header: { ...current.header, status: current.header.status },
              }
            : current,
        )
      } else {
        // PATCH /operations/compras/{id}/ no existe en v1: el borrador vive en estado local.
        await delay(ACTION_DELAY_MS)
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo guardar el borrador.'
      setActionError(message)
    } finally {
      setIsSaving(false)
    }
  }, [document, isConfirming, isSaving, queryClient])

  const confirmDocument = useCallback(async () => {
    if (!document || isSaving || isConfirming) {
      return
    }

    setIsConfirming(true)
    setActionError(null)

    try {
      if (USE_API_MOCKS) {
        await delay(ACTION_DELAY_MS)
        setDocument((current) =>
          current
            ? {
                ...current,
                header: { ...current.header, status: 'confirmado' },
              }
            : current,
        )
      } else if (document.compraId) {
        const updated = await confirmRecepcion(document.compraId)
        setDocument(cloneRecepcion(updated))
        await queryClient.invalidateQueries({ queryKey: ['recepcion'] })
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'No se pudo confirmar la recepción.'
      setActionError(message)
    } finally {
      setIsConfirming(false)
    }
  }, [document, isConfirming, isSaving, queryClient])

  const status = toDataViewStatus(query.isLoading, query.isError, query.data, simulateEmpty)
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
    isUsingMockFallback: query.data?.usedMockFallback ?? USE_API_MOCKS,
    isNotFound: query.data?.notFound ?? false,
    actionError,
  }
}
