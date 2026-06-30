import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'

import { ROUTES } from '@/config/routes'

import {

  AjustePage,

  DashboardPage,

  DespachoPage,

  MovimientoDetallePage,

  MovimientosPage,

  ProductosPage,

  RecepcionPage,

  TrasladoPage,

} from '@/pages'

import { ComponentsCatalogPage } from '@/pages/ComponentsCatalogPage'

import { DesignTokensPage } from '@/pages/DesignTokensPage'

import { HomePage } from '@/pages/HomePage'

import { LayoutPreviewPage } from '@/pages/LayoutPreviewPage'

import { RoutesPreviewPage } from '@/pages/RoutesPreviewPage'
import { DataComponentsPage } from '@/pages/DataComponentsPage'
import { DocumentComponentsPage } from '@/pages/DocumentComponentsPage'



export function AppRouter() {

  return (

    <Routes>

      <Route element={<AppShell />}>

        <Route path={ROUTES.home} element={<HomePage />} />

        <Route path={ROUTES.dashboard} element={<DashboardPage />} />

        <Route path={ROUTES.movimientos} element={<MovimientosPage />} />

        <Route path={ROUTES.movimientoDetalle} element={<MovimientoDetallePage />} />

        <Route path={ROUTES.productos} element={<ProductosPage />} />

        <Route path={ROUTES.recepcion} element={<RecepcionPage />} />

        <Route path={ROUTES.despacho} element={<DespachoPage />} />

        <Route path={ROUTES.traslado} element={<TrasladoPage />} />

        <Route path={ROUTES.ajuste} element={<AjustePage />} />

        <Route path={ROUTES.devTokens} element={<DesignTokensPage />} />

        <Route path={ROUTES.devComponents} element={<ComponentsCatalogPage />} />

        <Route path={ROUTES.devLayout} element={<LayoutPreviewPage />} />

        <Route path={ROUTES.devRoutes} element={<RoutesPreviewPage />} />

        <Route path={ROUTES.devData} element={<DataComponentsPage />} />

        <Route path={ROUTES.devDocument} element={<DocumentComponentsPage />} />

        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />

      </Route>

    </Routes>

  )

}


