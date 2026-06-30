import type { DocumentHeaderBase, DocumentLineStatus, SelectOption } from '@/mocks/documents/types'

export type AjusteAdjustType = 'sobrante' | 'faltante' | 'rotura' | 'inventario_fisico'

export type AjusteDifferenceType = 'sobrante' | 'faltante' | 'neutro'

export type AjusteLine = {
  id: string
  lineNumber: string
  sku: string
  description: string
  theoreticalStock: number
  physicalStock: number
  location: string
  lineStatus: DocumentLineStatus
  locationOptions: SelectOption[]
}

export type AjusteHeader = DocumentHeaderBase & {
  adjustType: AjusteAdjustType
  reason: string
  countRef: string
  adjustTypeOptions: SelectOption[]
  warehouseOptions: SelectOption[]
  reasonOptions: SelectOption[]
}

export type AjusteDocument = {
  header: AjusteHeader
  lines: AjusteLine[]
}

export const AJUSTE_ADJUST_TYPE_LABELS: Record<AjusteAdjustType, string> = {
  sobrante: 'Sobrante',
  faltante: 'Faltante / merma',
  rotura: 'Rotura / daño',
  inventario_fisico: 'Inventario físico',
}

export const AJUSTE_DIFFERENCE_TYPE_LABELS: Record<AjusteDifferenceType, string> = {
  sobrante: 'Sobrante',
  faltante: 'Faltante',
  neutro: 'Sin diferencia',
}

export const MOCK_AJUSTE: AjusteDocument = {
  header: {
    code: 'AJU-0005',
    status: 'revision',
    date: '2026-06-28',
    warehouse: 'bodega-principal',
    adjustType: 'faltante',
    reason: 'conteo-ciclico',
    countRef: 'CNT-2026-0612',
    operator: 'Carlos Ruiz',
    notes:
      'Conteo cíclico zona B-12: diferencia detectada en manillas acero inox por unidades dañadas en estantería.',
    warehouseOptions: [
      { value: 'bodega-principal', label: 'Bodega principal' },
      { value: 'bodega-secundaria', label: 'Bodega secundaria' },
    ],
    adjustTypeOptions: [
      { value: 'sobrante', label: AJUSTE_ADJUST_TYPE_LABELS.sobrante },
      { value: 'faltante', label: AJUSTE_ADJUST_TYPE_LABELS.faltante },
      { value: 'rotura', label: AJUSTE_ADJUST_TYPE_LABELS.rotura },
      { value: 'inventario_fisico', label: AJUSTE_ADJUST_TYPE_LABELS.inventario_fisico },
    ],
    reasonOptions: [
      { value: 'conteo-ciclico', label: 'Conteo cíclico' },
      { value: 'dano-detectado', label: 'Daño detectado' },
      { value: 'correccion-sistema', label: 'Corrección de sistema' },
    ],
  },
  lines: [
    {
      id: 'aju-line-001',
      lineNumber: '001',
      sku: 'SKU-005110',
      description: 'Manilla acero inox',
      theoreticalStock: 80,
      physicalStock: 78,
      location: 'B-12-04',
      lineStatus: 'diferencia',
      locationOptions: [{ value: 'B-12-04', label: 'B-12-04' }],
    },
    {
      id: 'aju-line-002',
      lineNumber: '002',
      sku: 'SKU-004830',
      description: 'Tuerca autobloc. M8',
      theoreticalStock: 45,
      physicalStock: 45,
      location: 'A-04-01',
      lineStatus: 'ok',
      locationOptions: [{ value: 'A-04-01', label: 'A-04-01' }],
    },
    {
      id: 'aju-line-003',
      lineNumber: '003',
      sku: 'SKU-005101',
      description: 'Bisagra industrial 80mm',
      theoreticalStock: 0,
      physicalStock: 3,
      location: 'B-12-01',
      lineStatus: 'diferencia',
      locationOptions: [{ value: 'B-12-01', label: 'B-12-01' }],
    },
    {
      id: 'aju-line-004',
      lineNumber: '004',
      sku: 'SKU-006002',
      description: 'Canaleta 40×25mm',
      theoreticalStock: 120,
      physicalStock: 0,
      location: 'C-01-02',
      lineStatus: 'pendiente',
      locationOptions: [{ value: 'C-01-02', label: 'C-01-02' }],
    },
    {
      id: 'aju-line-005',
      lineNumber: '005',
      sku: 'SKU-004821',
      description: 'Tornillo hex M8×25',
      theoreticalStock: 200,
      physicalStock: 198,
      location: 'A-03-02',
      lineStatus: 'revision',
      locationOptions: [{ value: 'A-03-02', label: 'A-03-02' }],
    },
  ],
}

export function computeLineDifference(line: Pick<AjusteLine, 'theoreticalStock' | 'physicalStock'>): number {
  return line.physicalStock - line.theoreticalStock
}

export function deriveAjusteDifferenceType(difference: number): AjusteDifferenceType {
  if (difference > 0) {
    return 'sobrante'
  }
  if (difference < 0) {
    return 'faltante'
  }
  return 'neutro'
}

export function deriveAjusteLineStatus(
  theoreticalStock: number,
  physicalStock: number,
): DocumentLineStatus {
  if (physicalStock === theoreticalStock) {
    return 'ok'
  }
  if (physicalStock === 0 && theoreticalStock > 0) {
    return 'pendiente'
  }
  const diff = physicalStock - theoreticalStock
  if (Math.abs(diff) >= 5 && diff < 0) {
    return 'revision'
  }
  return 'diferencia'
}

export function formatAjusteDifference(difference: number): string {
  if (difference > 0) {
    return `+${difference}`
  }
  return String(difference)
}

export function computeAjusteTotals(lines: AjusteLine[]) {
  const lineCount = lines.length
  const totalDifference = lines.reduce((sum, line) => sum + computeLineDifference(line), 0)
  const adjustedUnits = lines.reduce((sum, line) => sum + Math.abs(computeLineDifference(line)), 0)
  const withDifference = lines.filter((line) => computeLineDifference(line) !== 0).length

  return { lineCount, totalDifference, adjustedUnits, withDifference }
}

export function cloneAjuste(document: AjusteDocument): AjusteDocument {
  return {
    header: { ...document.header },
    lines: document.lines.map((line) => ({ ...line, locationOptions: [...line.locationOptions] })),
  }
}

export function resolveAjusteAdjustTypeLabel(
  adjustType: AjusteAdjustType,
  options: SelectOption[],
): string {
  return options.find((option) => option.value === adjustType)?.label ?? AJUSTE_ADJUST_TYPE_LABELS[adjustType]
}

export function resolveWarehouseLabel(warehouse: string, options: SelectOption[]): string {
  return options.find((option) => option.value === warehouse)?.label ?? warehouse
}

export function resolveAjusteReasonLabel(reason: string, options: SelectOption[]): string {
  return options.find((option) => option.value === reason)?.label ?? reason
}
