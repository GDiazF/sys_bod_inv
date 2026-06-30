import { Outlet, useLocation } from 'react-router-dom'
import { resolveRouteChrome } from '@/config/chrome'
import { MainContent } from '@/components/layout/MainContent'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { SidebarProvider } from '@/hooks/useSidebar'

export function AppShell() {
  const location = useLocation()
  const chrome = resolveRouteChrome(location.pathname)

  return (
    <SidebarProvider>
      <div className="flex h-full overflow-hidden bg-bg">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar title={chrome.title} meta={chrome.meta || undefined} />
          <MainContent>
            <Outlet />
          </MainContent>
        </div>
      </div>
    </SidebarProvider>
  )
}
