import { DATA_UI } from '@/config/data-ui'
import { cn } from '@/lib/cn'

export type PaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
  itemLabel?: string
}

function formatRange(page: number, pageSize: number, total: number): string {
  if (total === 0) {
    return DATA_UI.pagination.empty
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return `${start}–${end} de ${total}`
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
  itemLabel = DATA_UI.pagination.defaultItemLabel,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const canPrev = safePage > 1
  const canNext = safePage < totalPages

  const windowStart = Math.max(1, safePage - 2)
  const windowEnd = Math.min(totalPages, windowStart + 4)
  const adjustedStart = Math.max(1, windowEnd - 4)
  const pages = Array.from({ length: windowEnd - adjustedStart + 1 }, (_, index) => adjustedStart + index)

  return (
    <nav className={cn('bx-pagination', className)} aria-label={DATA_UI.pagination.navLabel}>
      <span className="bx-pagination__info">
        {formatRange(safePage, pageSize, total)} {itemLabel}
      </span>
      <div className="bx-pagination__btns">
        <button
          type="button"
          className="bx-page-btn"
          disabled={!canPrev}
          aria-label={DATA_UI.pagination.prev}
          onClick={() => onPageChange(safePage - 1)}
        >
          ‹
        </button>
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={cn('bx-page-btn', pageNumber === safePage && 'bx-page-btn--active')}
            aria-current={pageNumber === safePage ? 'page' : undefined}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          className="bx-page-btn"
          disabled={!canNext}
          aria-label={DATA_UI.pagination.next}
          onClick={() => onPageChange(safePage + 1)}
        >
          ›
        </button>
      </div>
    </nav>
  )
}
