import { API_ACCESS_TOKEN, API_BASE_URL } from '@/config/env'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export class NetworkError extends Error {
  constructor(message = 'No se pudo conectar con el servidor') {
    super(message)
    this.name = 'NetworkError'
  }
}

export function isNetworkOrConfigError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true
  }

  if (error instanceof TypeError) {
    return true
  }

  if (error instanceof ApiError) {
    return error.status === 0
  }

  return false
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`
  const url = new URL(normalizedPath, base)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === '') {
        continue
      }
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (API_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${API_ACCESS_TOKEN}`
  }

  return headers
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(buildUrl(path, params), {
      method: 'GET',
      headers: authHeaders(),
    })
  } catch {
    throw new NetworkError()
  }

  if (!response.ok) {
    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      body = null
    }

    const detail =
      typeof body === 'object' &&
      body !== null &&
      'detail' in body &&
      typeof (body as { detail: unknown }).detail === 'string'
        ? (body as { detail: string }).detail
        : `Error HTTP ${response.status}`

    throw new ApiError(detail, response.status, body)
  }

  return response.json() as Promise<T>
}

function jsonHeaders(): HeadersInit {
  return {
    ...authHeaders(),
    'Content-Type': 'application/json',
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  let response: Response

  try {
    response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: jsonHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new NetworkError()
  }

  if (!response.ok) {
    let responseBody: unknown = null
    try {
      responseBody = await response.json()
    } catch {
      responseBody = null
    }

    const detail =
      typeof responseBody === 'object' &&
      responseBody !== null &&
      'detail' in responseBody &&
      typeof (responseBody as { detail: unknown }).detail === 'string'
        ? (responseBody as { detail: string }).detail
        : `Error HTTP ${response.status}`

    throw new ApiError(detail, response.status, responseBody)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

/**
 * PATCH genérico — preparado para cuando CompraViewSet exponga actualización parcial.
 */
export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  let response: Response

  try {
    response = await fetch(buildUrl(path), {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify(body),
    })
  } catch {
    throw new NetworkError()
  }

  if (!response.ok) {
    let responseBody: unknown = null
    try {
      responseBody = await response.json()
    } catch {
      responseBody = null
    }

    const detail =
      typeof responseBody === 'object' &&
      responseBody !== null &&
      'detail' in responseBody &&
      typeof (responseBody as { detail: unknown }).detail === 'string'
        ? (responseBody as { detail: string }).detail
        : `Error HTTP ${response.status}`

    throw new ApiError(detail, response.status, responseBody)
  }

  return response.json() as Promise<T>
}
