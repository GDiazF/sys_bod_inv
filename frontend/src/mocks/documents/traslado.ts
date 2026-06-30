import type { DocumentHeaderBase, DocumentLineStatus, SelectOption } from '@/mocks/documents/types'

export type TrasladoLine = {
  id: string
  lineNumber: string
  sku: string
  description: string
  plannedQty: number
  transferQty: number
  originLocation: string
  destLocation: string
  lineStatus: DocumentLineStatus
  originLocationOptions: SelectOption[]
  destLocationOptions: SelectOption[]
  /** Id del detalle Traslado en API (solo modo real). */
  detalleId?: number
}

export type TrasladoHeader = Omit<DocumentHeaderBase, 'warehouse'> & {
  warehouseOrigin: string
  warehouseDest: string
  reason: string
  warehouseOriginOptions: SelectOption[]
  warehouseDestOptions: SelectOption[]
  reasonOptions: SelectOption[]
}

export type TrasladoDocument = {
  /** Id Traslado en API (solo modo real). */
  trasladoId?: number
  /** Estado crudo DRF para acciones (solo modo real). */
  estadoCodigo?: string
  header: TrasladoHeader
  lines: TrasladoLine[]
}

export const MOCK_TRASLADO: TrasladoDocument = {
  header: {
    code: 'TRA-0012',
    status: 'pendiente',
    date: '2026-06-28',
    warehouseOrigin: 'bodega-principal',
    warehouseDest: 'bodega-principal',
    reason: 'reubicacion',
    operator: 'Ana Ruiz',
    notes: '',
    warehouseOriginOptions: [
      { value: 'bodega-principal', label: 'Bodega principal' },
      { value: 'bodega-secundaria', label: 'Bodega secundaria' },
    ],
    warehouseDestOptions: [
      { value: 'bodega-principal', label: 'Bodega principal' },
      { value: 'bodega-secundaria', label: 'Bodega secundaria' },
    ],
    reasonOptions: [
      { value: 'reubicacion', label: 'Reubicación por espacio' },
      { value: 'consolidacion', label: 'Consolidación' },
      { value: 'optimizacion', label: 'Optimización de picking' },
    ],
  },
  lines: [
    {
      id: 'tra-line-001',
      lineNumber: '001',
      sku: 'SKU-005101',
      description: 'Bisagra industrial 80mm',
      plannedQty: 15,
      transferQty: 15,
      originLocation: 'B-12-01',
      destLocation: 'B-14-02',
      lineStatus: 'ok',
      originLocationOptions: [
        { value: 'B-12-01', label: 'B-12-01 · Pasillo B' },
        { value: 'B-12-02', label: 'B-12-02 · Pasillo B' },
      ],
      destLocationOptions: [
        { value: 'B-14-02', label: 'B-14-02 · Pasillo B' },
        { value: 'B-14-03', label: 'B-14-03 · Pasillo B' },
      ],
    },
    {
      id: 'tra-line-002',
      lineNumber: '002',
      sku: 'SKU-004821',
      description: 'Tornillo hex M8×25',
      plannedQty: 200,
      transferQty: 200,
      originLocation: 'A-03-02',
      destLocation: 'A-05-01',
      lineStatus: 'ok',
      originLocationOptions: [{ value: 'A-03-02', label: 'A-03-02' }],
      destLocationOptions: [{ value: 'A-05-01', label: 'A-05-01' }],
    },
    {
      id: 'tra-line-003',
      lineNumber: '003',
      sku: 'SKU-006002',
      description: 'Canaleta 40×25mm',
      plannedQty: 40,
      transferQty: 35,
      originLocation: 'C-01-02',
      destLocation: 'C-03-01',
      lineStatus: 'diferencia',
      originLocationOptions: [{ value: 'C-01-02', label: 'C-01-02' }],
      destLocationOptions: [{ value: 'C-03-01', label: 'C-03-01' }],
    },
    {
      id: 'tra-line-004',
      lineNumber: '004',
      sku: 'SKU-004830',
      description: 'Tuerca autobloc. M8',
      plannedQty: 30,
      transferQty: 0,
      originLocation: 'A-04-01',
      destLocation: 'A-06-02',
      lineStatus: 'pendiente',
      originLocationOptions: [{ value: 'A-04-01', label: 'A-04-01' }],
      destLocationOptions: [{ value: 'A-06-02', label: 'A-06-02' }],
    },
    {
      id: 'tra-line-005',
      lineNumber: '005',
      sku: 'SKU-006001',
      description: 'Cable UTP Cat6 305m',
      plannedQty: 6,
      transferQty: 6,
      originLocation: 'C-01-01',
      destLocation: 'C-02-04',
      lineStatus: 'revision',
      originLocationOptions: [{ value: 'C-01-01', label: 'C-01-01' }],
      destLocationOptions: [{ value: 'C-02-04', label: 'C-02-04' }],
    },
  ],
}

export function deriveTrasladoLineStatus(
  plannedQty: number,
  transferQty: number,
): DocumentLineStatus {
  if (transferQty === plannedQty) {
    return 'ok'
  }
  if (transferQty === 0) {
    return 'pendiente'
  }
  return 'diferencia'
}

export function computeTrasladoTotals(lines: TrasladoLine[]) {
  const lineCount = lines.length
  const plannedUnits = lines.reduce((sum, line) => sum + line.plannedQty, 0)
  const transferUnits = lines.reduce((sum, line) => sum + line.transferQty, 0)
  const withDifference = lines.filter((line) => line.transferQty !== line.plannedQty).length

  return { lineCount, plannedUnits, transferUnits, withDifference }
}

export function cloneTraslado(document: TrasladoDocument): TrasladoDocument {
  return {
    header: { ...document.header },
    lines: document.lines.map((line) => ({
      ...line,
      originLocationOptions: [...line.originLocationOptions],
      destLocationOptions: [...line.destLocationOptions],
    })),
  }
}

export function resolveTrasladoReasonLabel(
  reason: string,
  options: SelectOption[],
): string {
  return options.find((option) => option.value === reason)?.label ?? reason
}

export function resolveWarehouseLabel(warehouse: string, options: SelectOption[]): string {
  return options.find((option) => option.value === warehouse)?.label ?? warehouse
}
