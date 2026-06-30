export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/** Si es true, pantallas integradas con API usan mocks locales sin llamar al backend. */
export const USE_API_MOCKS = import.meta.env.VITE_USE_API_MOCKS === 'true'

/** Token JWT de desarrollo (Bearer). Obtener con POST /api/v1/auth/token/ */
export const API_ACCESS_TOKEN = import.meta.env.VITE_API_ACCESS_TOKEN ?? ''
