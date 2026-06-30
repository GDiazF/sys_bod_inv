import type { AppRouteId } from '@/config/routes'

import { APP_MAIN_ROUTES } from '@/config/routes'



export type RouteChrome = {

  title: string

  meta: string

}



export type RoutePageMeta = {

  eyebrow: string

  title: string

  lead?: string

  breadcrumbLabel: string

}



export const ROUTE_PAGE_META: Record<AppRouteId, RoutePageMeta> = {

  dashboard: {

    eyebrow: 'WMS · Dashboard',

    title: 'Centro de mando',

    lead: 'Resumen operativo de stock, alertas y actividad reciente.',

    breadcrumbLabel: 'Dashboard',

  },

  movimientos: {

    eyebrow: 'INV · Movimientos',

    title: 'Historial de movimientos',

    lead: 'Consulta y seguimiento de entradas, salidas y traslados.',

    breadcrumbLabel: 'Movimientos',

  },

  'movimiento-detalle': {

    eyebrow: 'DET · Movimiento',

    title: 'Detalle de movimiento',

    lead: 'Líneas, totales e historial del documento.',

    breadcrumbLabel: 'Detalle',

  },

  productos: {

    eyebrow: 'CAT · Productos',

    title: 'Catálogo de productos',

    lead: 'SKUs, unidades de medida y stock por ubicación.',

    breadcrumbLabel: 'Productos',

  },

  recepcion: {

    eyebrow: 'DOC · Recepción',

    title: 'Recepción de mercancía',

    lead: 'Registro de ingreso a bodega.',

    breadcrumbLabel: 'Recepción',

  },

  despacho: {

    eyebrow: 'DOC · Despacho',

    title: 'Despacho / entrega',

    lead: 'Salida de mercancía hacia destino.',

    breadcrumbLabel: 'Despacho',

  },

  traslado: {

    eyebrow: 'DOC · Traslado',

    title: 'Traslado entre ubicaciones',

    lead: 'Movimiento interno entre bodegas o zonas.',

    breadcrumbLabel: 'Traslado',

  },

  ajuste: {

    eyebrow: 'DOC · Ajuste',

    title: 'Ajuste de inventario',

    lead: 'Corrección de stock por conteo o diferencia.',

    breadcrumbLabel: 'Ajuste',

  },

}



const PATH_TO_ROUTE_ID = Object.fromEntries(

  APP_MAIN_ROUTES.map((route) => [route.path, route.id]),

) as Record<string, AppRouteId>



const DEV_CHROME: Record<string, RouteChrome> = {

  '/dev/components': { title: 'Componentes UI', meta: 'Fase 2 · catálogo de primitivos' },

  '/dev/tokens': { title: 'Design tokens', meta: 'Fase 1 · validación visual' },

  '/dev/layout': { title: 'Layout base', meta: 'Fase 3 · shell y page header' },

  '/dev/routes': { title: 'Rutas', meta: 'Fase 4 · páginas esqueleto' },

  '/dev/data': { title: 'Componentes de datos', meta: 'Fase 5 · tablas, KPIs, filtros' },

  '/dev/document': { title: 'Componentes de documento', meta: 'Fase 7 · formularios y qty' },

  '/': { title: 'BodegaX', meta: 'Scaffold · React + Tailwind' },

}



export function resolveRouteChrome(pathname: string): RouteChrome {

  if (DEV_CHROME[pathname]) {

    return DEV_CHROME[pathname]

  }



  const routeId = PATH_TO_ROUTE_ID[pathname]

  if (routeId) {

    const meta = ROUTE_PAGE_META[routeId]

    return { title: meta.title, meta: meta.eyebrow }

  }



  return { title: 'BodegaX', meta: '' }

}



export function resolveRoutePageMeta(pathname: string): RoutePageMeta | null {

  const routeId = PATH_TO_ROUTE_ID[pathname]

  return routeId ? ROUTE_PAGE_META[routeId] : null

}


