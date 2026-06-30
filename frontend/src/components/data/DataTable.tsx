import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type DataTableColumn<T> = {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  headerClassName?: string
  cellClassName?: string
  mono?: boolean
}

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  className?: string
  caption?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  className,
  caption,
}: DataTableProps<T>) {
  return (
    <table className={cn('bx-table', className)}>
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.id} className={column.headerClassName}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const key = rowKey(row)
          const isInteractive = Boolean(onRowClick)

          return (
            <tr
              key={key}
              className={cn(isInteractive && 'bx-table-row-link')}
              tabIndex={isInteractive ? 0 : undefined}
              onClick={isInteractive ? () => onRowClick?.(row) : undefined}
              onKeyDown={
                isInteractive
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onRowClick?.(row)
                      }
                    }
                  : undefined
              }
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn(column.mono && 'mono', column.cellClassName)}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
