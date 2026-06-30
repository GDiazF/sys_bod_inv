import type { DocumentHeaderBase, DocumentLineStatus, SelectOption } from '@/mocks/documents/types'

export type DespachoLine = {
  id: string
  lineNumber: string
  sku: string
  description: string
  committedQty: number
  dispatchQty: number
  location: string
  lineStatus: DocumentLineStatus
  locationOptions: SelectOption[]
  /** Id del detalle Entrega en API (solo modo real). */
  detalleId?: number
}

export type DespachoHeader = DocumentHeaderBase & {
  client: string
  orderRef: string
  warehouse: string
  carrier: string
  warehouseOptions: SelectOption[]
  carrierOptions: SelectOption[]
}

export type DespachoDocument = {
  /** Id Entrega en API (solo modo real). */
  entregaId?: number
  header: DespachoHeader
  lines: DespachoLine[]
}

export const MOCK_DESPACHO: DespachoDocument = {
  header: {
    code: 'DES-0034',
    status: 'en_proceso',
    date: '2026-06-28',
    client: 'Obra Residencial Los Álamos',
    orderRef: 'PED-2026-0923',
    warehouse: 'bodega-principal',
    carrier: 'logistica-express',
    operator: 'Carlos Mendoza',
    notes: '',
    warehouseOptions: [
      { value: 'bodega-principal', label: 'Bodega principal' },
      { value: 'bodega-secundaria', label: 'Bodega secundaria' },
    ],
    carrierOptions: [
      { value: 'logistica-express', label: 'Logística Express' },
      { value: 'retiro-bodega', label: 'Retiro en bodega' },
    ],
  },
  lines: [
    {
      id: 'des-line-001',
      lineNumber: '001',
      sku: 'SKU-006002',
      description: 'Canaleta 40×25mm',
      committedQty: 80,
      dispatchQty: 80,
      location: 'C-01-02',
      lineStatus: 'ok',
      locationOptions: [{ value: 'C-01-02', label: 'C-01-02' }],
    },
    {
      id: 'des-line-002',
      lineNumber: '002',
      sku: 'SKU-006010',
      description: 'Caja derivación IP55',
      committedQty: 24,
      dispatchQty: 24,
      location: 'C-02-01',
      lineStatus: 'ok',
      locationOptions: [{ value: 'C-02-01', label: 'C-02-01' }],
    },
    {
      id: 'des-line-003',
      lineNumber: '003',
      sku: 'SKU-004830',
      description: 'Tuerca autobloc. M8',
      committedQty: 50,
      dispatchQty: 45,
      location: 'A-04-01',
      lineStatus: 'diferencia',
      locationOptions: [{ value: 'A-04-01', label: 'A-04-01' }],
    },
    {
      id: 'des-line-004',
      lineNumber: '004',
      sku: 'SKU-006001',
      description: 'Cable UTP Cat6 305m',
      committedQty: 12,
      dispatchQty: 0,
      location: 'C-01-01',
      lineStatus: 'pendiente',
      locationOptions: [{ value: 'C-01-01', label: 'C-01-01' }],
    },
    {
      id: 'des-line-005',
      lineNumber: '005',
      sku: 'SKU-004821',
      description: 'Tornillo hex M8×25',
      committedQty: 100,
      dispatchQty: 100,
      location: 'A-03-02',
      lineStatus: 'revision',
      locationOptions: [{ value: 'A-03-02', label: 'A-03-02' }],
    },
  ],
}

export function deriveDespachoLineStatus(
  committedQty: number,
  dispatchQty: number,
): DocumentLineStatus {
  if (dispatchQty === committedQty) {
    return 'ok'
  }
  if (dispatchQty === 0) {
    return 'pendiente'
  }
  return 'diferencia'
}

export function computeDespachoTotals(lines: DespachoLine[]) {
  const lineCount = lines.length
  const committedUnits = lines.reduce((sum, line) => sum + line.committedQty, 0)
  const dispatchUnits = lines.reduce((sum, line) => sum + line.dispatchQty, 0)
  const withDifference = lines.filter((line) => line.dispatchQty !== line.committedQty).length

  return { lineCount, committedUnits, dispatchUnits, withDifference }
}

export function cloneDespacho(document: DespachoDocument): DespachoDocument {
  return {
    header: { ...document.header },
    lines: document.lines.map((line) => ({ ...line, locationOptions: [...line.locationOptions] })),
  }
}
