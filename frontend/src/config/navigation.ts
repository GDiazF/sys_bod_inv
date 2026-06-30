import type { AppRouteId } from '@/config/routes'

export type NavItemConfig = {
  id: AppRouteId
  label: string
  path: string
}

export type NavGroupConfig = {
  label: string
  items: NavItemConfig[]
}

/**
 * Navegación principal — espejo de Proyecto/index.html sidebar.
 */
export const NAVIGATION: NavGroupConfig[] = [
  {
    label: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
      { id: 'movimientos', label: 'Movimientos', path: '/movimientos' },
      { id: 'productos', label: 'Productos', path: '/productos' },
    ],
  },
  {
    label: 'Documentos',
    items: [
      { id: 'recepcion', label: 'Recepción', path: '/recepcion' },
      { id: 'despacho', label: 'Despacho', path: '/despacho' },
      { id: 'traslado', label: 'Traslado', path: '/traslado' },
      { id: 'ajuste', label: 'Ajuste', path: '/ajuste' },
    ],
  },
]

export const DEV_NAV_ITEMS = [
  { label: 'Design tokens', path: '/dev/tokens' },
  { label: 'Componentes UI', path: '/dev/components' },
  { label: 'Layout base', path: '/dev/layout' },
  { label: 'Rutas esqueleto', path: '/dev/routes' },
  { label: 'Componentes de datos', path: '/dev/data' },
  { label: 'Componentes documento', path: '/dev/document' },
] as const
