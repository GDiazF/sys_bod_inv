import { Button } from '@/components/ui/Button'
import { useSidebar } from '@/hooks/useSidebar'

export type TopbarProps = {
  title: string
  meta?: string
  actions?: React.ReactNode
}

export function Topbar({ title, meta, actions }: TopbarProps) {
  const { open } = useSidebar()

  return (
    <header className="bx-topbar-accent relative flex h-header shrink-0 items-center justify-between gap-4 border-b border-border bg-surface-raised px-gutter shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="md:hidden !px-2 !py-2"
          aria-label="Abrir menú"
          onClick={open}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </Button>
        <div className="min-w-0">
          <div className="truncate font-display text-base font-semibold tracking-tight">{title}</div>
          {meta ? (
            <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-widest text-muted">
              {meta}
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {actions}
        <div className="hidden items-center gap-1.5 rounded-sm border border-border bg-surface-inset px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-widest text-steel-mid max-md:hidden md:inline-flex">
          <span className="h-1.5 w-1.5 rounded-[1px] bg-accent shadow-[0_0_0_2px_var(--accent-muted)]" aria-hidden />
          Operativo
        </div>
      </div>
    </header>
  )
}
