/** Convierte `42`, `0042` o `MOV-0042` en id numérico de API. */
export function parseMovementRouteId(param: string | undefined): number | null {
  if (!param) {
    return null
  }

  const trimmed = param.trim()
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed)
  }

  const match = /^MOV-0*(\d+)$/i.exec(trimmed)
  return match ? Number(match[1]) : null
}

export function formatMovementDisplayId(numericId: number): string {
  return `MOV-${String(numericId).padStart(4, '0')}`
}
