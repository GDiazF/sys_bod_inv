import type { MovimientoTipoFilter } from '@/config/filter-options'
import type { MovementListStatus } from '@/mocks/status-labels'

export type MovementRow = {
  id: string
  type: Exclude<MovimientoTipoFilter, 'Todos'>
  doc: string
  sku: string
  product: string
  qty: number
  qtyDisplay?: string
  location: string
  status: MovementListStatus
  date: string
}

const BASE_MOVEMENTS: MovementRow[] = [
  {
    id: 'MOV-0047',
    type: 'Entrada',
    doc: 'REC-0089',
    sku: 'SKU-004821',
    product: 'Tornillo hex M8×25',
    qty: 120,
    location: 'A-03-02',
    status: 'confirmado',
    date: '28/06 09:42',
  },
  {
    id: 'MOV-0046',
    type: 'Salida',
    doc: 'DES-0034',
    sku: 'SKU-006002',
    product: 'Canaleta 40×25mm',
    qty: -80,
    location: 'C-01-02',
    status: 'confirmado',
    date: '28/06 09:18',
  },
  {
    id: 'MOV-0045',
    type: 'Ajuste',
    doc: 'AJU-0005',
    sku: 'SKU-005110',
    product: 'Manilla acero inox',
    qty: -2,
    location: 'B-12-04',
    status: 'pendiente',
    date: '28/06 08:55',
  },
  {
    id: 'MOV-0044',
    type: 'Entrada',
    doc: 'REC-0087',
    sku: 'SKU-006001',
    product: 'Cable UTP Cat6 305m',
    qty: 48,
    location: 'C-01-01',
    status: 'confirmado',
    date: '28/06 08:30',
  },
  {
    id: 'MOV-0043',
    type: 'Transferencia',
    doc: 'TRA-0012',
    sku: 'SKU-005101',
    product: 'Bisagra industrial 80mm',
    qty: 15,
    qtyDisplay: '±15',
    location: 'B-12-01 → B-14-02',
    status: 'en_proceso',
    date: '28/06 08:12',
  },
  {
    id: 'MOV-0042',
    type: 'Salida',
    doc: 'DES-0033',
    sku: 'SKU-004830',
    product: 'Tuerca autobloc. M8',
    qty: -30,
    location: 'A-04-01',
    status: 'confirmado',
    date: '28/06 07:48',
  },
  {
    id: 'MOV-0041',
    type: 'Entrada',
    doc: 'REC-0086',
    sku: 'SKU-004822',
    product: 'Arandela plana M8',
    qty: 200,
    location: 'A-03-03',
    status: 'confirmado',
    date: '27/06 16:20',
  },
]

const MOVEMENT_TYPES: MovementRow['type'][] = ['Entrada', 'Salida', 'Transferencia', 'Ajuste']
const MOVEMENT_STATUSES: MovementListStatus[] = ['confirmado', 'pendiente', 'en_proceso']

function buildMovementCatalog(): MovementRow[] {
  const rows: MovementRow[] = [...BASE_MOVEMENTS]

  for (let index = 40; index >= 1; index -= 1) {
    const base = BASE_MOVEMENTS[index % BASE_MOVEMENTS.length]
    const id = `MOV-${String(index).padStart(4, '0')}`
    if (rows.some((row) => row.id === id)) {
      continue
    }

    rows.push({
      ...base,
      id,
      type: MOVEMENT_TYPES[index % MOVEMENT_TYPES.length],
      doc: `${base.doc.slice(0, 3)}-${String(100 + index)}`,
      sku: `SKU-${String(4800 + index)}`,
      product: `${base.product} (${index})`,
      qty: index % 2 === 0 ? index * 3 : index * -2,
      location: base.location,
      status: MOVEMENT_STATUSES[index % MOVEMENT_STATUSES.length],
      date: `${String(27 - (index % 5)).padStart(2, '0')}/06 ${String(8 + (index % 10)).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}`,
      qtyDisplay: undefined,
    })
  }

  return rows.sort((a, b) => b.id.localeCompare(a.id))
}

export const MOCK_MOVEMENTS = buildMovementCatalog()

export type MovementFilters = {
  q: string
  type: MovimientoTipoFilter
  from: string
  to: string
}

export type PaginatedRows<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export function queryMovements(
  filters: MovementFilters,
  page: number,
  pageSize: number,
): PaginatedRows<MovementRow> {
  const q = filters.q.trim().toLowerCase()
  const filtered = MOCK_MOVEMENTS.filter((movement) => {
    if (filters.type !== 'Todos' && movement.type !== filters.type) {
      return false
    }

    if (q) {
      const haystack = [movement.id, movement.doc, movement.sku, movement.product, movement.type]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) {
        return false
      }
    }

    return true
  })

  const total = filtered.length
  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return { items, total, page, pageSize }
}

/** Total de referencia del diseño original (248 movimientos). */
export const MOVIMIENTOS_TOTAL_REF = 248
