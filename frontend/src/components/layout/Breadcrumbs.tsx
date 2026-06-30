import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

export type BreadcrumbItem = {
  label: string
  to?: string
}

export type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <nav className={cn('bx-breadcrumbs', className)} aria-label="Migas de pan">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? <span className="bx-breadcrumb-sep" aria-hidden>/</span> : null}
            {!isLast && item.to ? (
              <Link to={item.to} className="bx-breadcrumb-item">
                {item.label}
              </Link>
            ) : (
              <span
                className="bx-breadcrumb-item bx-breadcrumb-item--active"
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
