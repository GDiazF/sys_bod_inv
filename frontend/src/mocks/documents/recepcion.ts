import type { DocumentHeaderBase, DocumentLineStatus, SelectOption } from '@/mocks/documents/types'

export type RecepcionLine = {
  id: string
  lineNumber: string
  sku: string
  description: string
  expectedQty: number
  receivedQty: number
  location: string
  batch: string
  lineStatus: DocumentLineStatus
  locationOptions: SelectOption[]
  /** Id del detalle Compra en API (solo modo real). */
  detalleId?: number
}

export type RecepcionHeader = DocumentHeaderBase & {
  supplier: string
  purchaseOrder: string
  supplierOptions: SelectOption[]
  warehouseOptions: SelectOption[]
}

export type RecepcionDocument = {
  /** Id Compra en API (solo modo real). */
  compraId?: number
  header: RecepcionHeader
  lines: RecepcionLine[]
}

export const MOCK_RECEPCION: RecepcionDocument = {
  header: {
    code: 'REC-0089',
    status: 'borrador',
    date: '2026-06-28',
    supplier: 'ferreteria-norte',
    purchaseOrder: 'OC-2026-1847',
    warehouse: 'bodega-principal',
    operator: 'María González',
    notes: '',
    supplierOptions: [
      { value: 'ferreteria-norte', label: 'Ferretería Industrial Norte S.A.' },
      { value: 'distribuidora-sur', label: 'Distribuidora Sur Ltda.' },
    ],
    warehouseOptions: [
      { value: 'bodega-principal', label: 'Bodega principal' },
      { value: 'bodega-secundaria', label: 'Bodega secundaria' },
    ],
  },
  lines: [
    {
      id: 'line-001',
      lineNumber: '001',
      sku: 'SKU-004821',
      description: 'Tornillo hex M8×25',
      expectedQty: 120,
      receivedQty: 120,
      location: 'A-03-02',
      batch: 'LT-2026-0612',
      lineStatus: 'ok',
      locationOptions: [
        { value: 'A-03-02', label: 'A-03-02' },
        { value: 'A-03-01', label: 'A-03-01' },
      ],
    },
    {
      id: 'line-002',
      lineNumber: '002',
      sku: 'SKU-004822',
      description: 'Arandela plana M8',
      expectedQty: 200,
      receivedQty: 200,
      location: 'A-03-03',
      batch: 'LT-2026-0612',
      lineStatus: 'ok',
      locationOptions: [{ value: 'A-03-03', label: 'A-03-03' }],
    },
    {
      id: 'line-003',
      lineNumber: '003',
      sku: 'SKU-004830',
      description: 'Tuerca autobloc. M8',
      expectedQty: 100,
      receivedQty: 100,
      location: 'A-04-01',
      batch: '',
      lineStatus: 'pendiente',
      locationOptions: [{ value: 'A-04-01', label: 'A-04-01' }],
    },
    {
      id: 'line-004',
      lineNumber: '004',
      sku: 'SKU-006001',
      description: 'Cable UTP Cat6 305m',
      expectedQty: 48,
      receivedQty: 45,
      location: 'C-01-01',
      batch: 'LT-2026-0601',
      lineStatus: 'diferencia',
      locationOptions: [{ value: 'C-01-01', label: 'C-01-01' }],
    },
    {
      id: 'line-005',
      lineNumber: '005',
      sku: 'SKU-006002',
      description: 'Canaleta 40×25mm',
      expectedQty: 80,
      receivedQty: 80,
      location: 'C-01-02',
      batch: '',
      lineStatus: 'revision',
      locationOptions: [{ value: 'C-01-02', label: 'C-01-02' }],
    },
  ],
}

export function computeRecepcionTotals(lines: RecepcionLine[]) {
  const totalUnits = lines.reduce((sum, line) => sum + line.receivedQty, 0)
  const lineCount = lines.length
  const withDifference = lines.filter((line) => line.receivedQty !== line.expectedQty).length

  return { lineCount, totalUnits, withDifference }
}

export function deriveLineStatus(expectedQty: number, receivedQty: number): DocumentLineStatus {
  if (receivedQty === expectedQty) {
    return 'ok'
  }
  if (receivedQty === 0) {
    return 'pendiente'
  }
  return 'diferencia'
}

export function cloneRecepcion(document: RecepcionDocument): RecepcionDocument {
  return {
    header: { ...document.header },
    lines: document.lines.map((line) => ({ ...line, locationOptions: [...line.locationOptions] })),
  }
}
