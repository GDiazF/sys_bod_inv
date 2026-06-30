/**

 * Rutas alineadas con Proyecto/index.html (hash router original).

 */

export const ROUTES = {

  dashboard: '/dashboard',

  movimientos: '/movimientos',

  movimientoDetalle: '/movimiento-detalle',

  productos: '/productos',

  recepcion: '/recepcion',

  despacho: '/despacho',

  traslado: '/traslado',

  ajuste: '/ajuste',

  devTokens: '/dev/tokens',

  devComponents: '/dev/components',

  devLayout: '/dev/layout',

  devRoutes: '/dev/routes',

  devData: '/dev/data',

  devDocument: '/dev/document',

  home: '/',

} as const



export type AppRouteId =

  | 'dashboard'

  | 'movimientos'

  | 'movimiento-detalle'

  | 'productos'

  | 'recepcion'

  | 'despacho'

  | 'traslado'

  | 'ajuste'



export type AppMainRoute = {

  id: AppRouteId

  path: string

  label: string

}



/** Rutas principales de la aplicación (Fase 4). */

export const APP_MAIN_ROUTES: readonly AppMainRoute[] = [

  { id: 'dashboard', path: ROUTES.dashboard, label: 'Dashboard' },

  { id: 'movimientos', path: ROUTES.movimientos, label: 'Movimientos' },

  { id: 'movimiento-detalle', path: ROUTES.movimientoDetalle, label: 'Detalle movimiento' },

  { id: 'productos', path: ROUTES.productos, label: 'Productos' },

  { id: 'recepcion', path: ROUTES.recepcion, label: 'Recepción' },

  { id: 'despacho', path: ROUTES.despacho, label: 'Despacho' },

  { id: 'traslado', path: ROUTES.traslado, label: 'Traslado' },

  { id: 'ajuste', path: ROUTES.ajuste, label: 'Ajuste' },

] as const



export const APP_ROUTE_IDS: AppRouteId[] = APP_MAIN_ROUTES.map((route) => route.id)


