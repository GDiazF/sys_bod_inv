import { ROUTES } from '@/config/routes'
import type { BreadcrumbItem } from '@/components/layout/Breadcrumbs'

export function homeBreadcrumb(): BreadcrumbItem[] {
  return [{ label: 'Inicio', to: ROUTES.dashboard }]
}

export function sectionBreadcrumbs(sectionLabel: string, sectionPath?: string): BreadcrumbItem[] {
  return [
    { label: 'Inicio', to: ROUTES.dashboard },
    { label: sectionLabel, to: sectionPath },
  ].filter((item) => item.label !== sectionLabel || sectionPath) as BreadcrumbItem[]
}

export function pageBreadcrumbs(pageLabel: string, parent?: { label: string; to: string }): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: 'Inicio', to: ROUTES.dashboard }]
  if (parent) {
    items.push(parent)
  }
  items.push({ label: pageLabel })
  return items
}
