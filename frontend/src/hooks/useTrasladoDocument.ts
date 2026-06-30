import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { confirmTraslado, fetchTraslado, resolveTrasladoId } from '@/api/traslado'
import { ApiError, isNetworkOrConfigError } from '@/api/client'
import type { DataViewStatus } from '@/components/data/DataView'
import { USE_API_MOCKS } from '@/config/env'
import {
  cloneTraslado,
  MOCK_TRASLADO,
  type TrasladoDocument,
} from '@/mocks/documents/traslado'

const MOCK_DELAY_MS = 550
const ACTION_DELAY_MS = 900

type TrasladoQueryResult = {
  document: TrasladoDocument | null
  usedMockFallback: boolean
  notFound: boolean
}

export type UseTrasladoDocumentOptions = {
  simulateError?: boolean
  simulateEmpty?: boolean
  documentId?: string | number
}

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
  isUsingMockFallback: boolean
  isNotFound: boolean
  actionError: string | null
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function loadTrasladoDocument(
  explicitId: string | undefined,
  simulateError: boolean,
  simulateEmpty: boolean,
): Promise<TrasladoQueryResult> {
  if (simulateError) {
    throw new Error('Error simulado en traslado')
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
      document: cloneTraslado(MOCK_TRASLADO),
      usedMockFallback: true,
      notFound: false,
    }
  }

  try {
    const trasladoId = await resolveTrasladoId(explicitId)
    if (trasladoId === null) {
      return {
        document: null,
        usedMockFallback: false,
        notFound: true,
      }
    }

    const document = await fetchTraslado(trasladoId)
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
        document: cloneTraslado(MOCK_TRASLADO),
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
  result: TrasladoQueryResult | undefined,
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

export function useTrasladoDocument(
  options: UseTrasladoDocumentOptions = {},
): UseTrasladoDocumentResult {
  const { simulateError = false, simulateEmpty = false, documentId } = options
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const explicitId = documentId !== undefined ? String(documentId) : (searchParams.get('id') ?? undefined)

  const [document, setDocument] = useState<TrasladoDocument | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const queryKey = useMemo(
    () => ['traslado', explicitId, USE_API_MOCKS, simulateError, simulateEmpty] as const,
    [explicitId, simulateError, simulateEmpty],
  )

  const query = useQuery({
    queryKey,
    queryFn: () => loadTrasladoDocument(explicitId, simulateError, simulateEmpty),
    placeholderData: (previous) => previous,
  })

  useEffect(() => {
    if (query.data?.document) {
      setDocument(cloneTraslado(query.data.document))
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
        // PATCH /operations/traslados/{id}/ no existe en v1: borrador en estado local.
        await delay(ACTION_DELAY_MS)
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo guardar el borrador.'
      setActionError(message)
    } finally {
      setIsSaving(false)
    }
  }, [document, isConfirming, isSaving])

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
      } else if (document.trasladoId) {
        const updated = await confirmTraslado(document.trasladoId, document.estadoCodigo)
        setDocument(cloneTraslado(updated))
        await queryClient.invalidateQueries({ queryKey: ['traslado'] })
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'No se pudo confirmar el traslado.'
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
