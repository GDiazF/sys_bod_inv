import { cva, type VariantProps } from 'class-variance-authority'
import { type HTMLAttributes } from 'react'
import { DataTable, type DataTableProps } from '@/components/data/DataTable'
import { cn } from '@/lib/cn'

const scrollableTableWrapVariants = cva('bx-table-wrap', {
  variants: {
    height: {
      default: '',
      tall: 'bx-table-wrap--tall',
      dashboard: 'bx-table-wrap--dashboard',
      doc: 'bx-table-wrap--doc',
    },
    flush: {
      true: 'bx-table-wrap--flush',
      false: '',
    },
  },
  defaultVariants: {
    height: 'default',
    flush: false,
  },
})

export type ScrollableTableProps<T> = DataTableProps<T> &
  HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof scrollableTableWrapVariants>

export function ScrollableTable<T>({
  className,
  height,
  flush,
  columns,
  rows,
  rowKey,
  onRowClick,
  caption,
  ...props
}: ScrollableTableProps<T>) {
  return (
    <div className={cn(scrollableTableWrapVariants({ height, flush }), className)} {...props}>
      <div className="bx-table-scroll">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={rowKey}
          onRowClick={onRowClick}
          caption={caption}
        />
      </div>
    </div>
  )
}

export { scrollableTableWrapVariants }
