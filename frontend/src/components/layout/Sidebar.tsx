import { NavLink } from 'react-router-dom'
import { DEV_NAV_ITEMS, NAVIGATION } from '@/config/navigation'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/lib/cn'

function NavLinkItem({
  to,
  label,
  numbered = false,
  onNavigate,
}: {
  to: string
  label: string
  numbered?: boolean
  onNavigate: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'mb-0.5 flex w-full items-center gap-2 rounded-sm border border-transparent px-3 py-[7px] text-left text-[13px] text-sidebar-muted transition-colors motion-reduce:transition-none',
          numbered &&
            'before:min-w-5 before:font-mono before:text-[10px] before:font-semibold before:tracking-wide before:text-steel-mid before:opacity-55 before:[counter-increment:nav-index] before:content-[counter(nav-index,decimal-leading-zero)]',
          'hover:border-sidebar-border hover:bg-sidebar-surface hover:text-sidebar-fg',
          numbered && 'hover:before:opacity-85 hover:before:text-steel',
          isActive &&
            'border-sidebar-border bg-surface-raised font-medium text-sidebar-fg shadow-sm [box-shadow:var(--shadow-sm),inset_3px_0_0_var(--accent)]',
          isActive && numbered && 'before:text-accent before:opacity-100',
          !numbered &&
            isActive &&
            'before:hidden',
        )
      }
    >
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const { isOpen, close } = useSidebar()

  return (
    <>
      <aside
        className={cn(
          'bx-sidebar-rail bx-sidebar-drawer flex w-sidebar shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar-bg',
          'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-[260px] max-md:translate-x-[-100%]',
          isOpen && 'max-md:translate-x-0',
        )}
        aria-label="Navegación principal"
      >
        <div className="flex h-header shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar-bg pl-[calc(var(--space-4)+3px)] pr-4">
          <div className="bx-brand-mark grid h-[34px] w-[34px] place-items-center rounded-[4px_4px_4px_0] bg-accent font-mono text-[11px] font-bold tracking-tight text-accent-fg">
            BX
          </div>
          <div>
            <div className="font-display text-[15px] font-bold tracking-tight text-sidebar-fg">
              BodegaX
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-sidebar-muted">
              WMS · Operativo
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto py-3 pl-[calc(var(--space-3)+3px)] pr-3 [counter-reset:nav-index]">
          {NAVIGATION.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-2 pt-4 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-steel-mid before:content-['▸_'] before:text-sidebar-rail">
                {group.label}
              </div>
              {group.items.map((item) => (
                <NavLinkItem
                  key={item.id}
                  to={item.path}
                  label={item.label}
                  numbered
                  onNavigate={close}
                />
              ))}
            </div>
          ))}

          <div className="mt-auto border-t border-sidebar-border pt-3">
            <div className="px-3 pb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-steel-mid">
              Dev
            </div>
            {DEV_NAV_ITEMS.map((item) => (
              <NavLinkItem key={item.path} to={item.path} label={item.label} onNavigate={close} />
            ))}
          </div>
        </nav>
      </aside>

      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-fg/20 md:hidden"
          aria-label="Cerrar menú"
          onClick={close}
        />
      ) : null}
    </>
  )
}
