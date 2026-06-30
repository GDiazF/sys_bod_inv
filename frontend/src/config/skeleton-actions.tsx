import { Badge, Button } from '@/components/ui'

export const skeletonBadge = <Badge variant="neutral">Esqueleto</Badge>

export function skeletonDashboardActions() {
  return (
    <>
      {skeletonBadge}
      <Button variant="secondary" size="sm" disabled>
        Ver movimientos
      </Button>
      <Button variant="primary" size="sm" disabled>
        Nueva recepción
      </Button>
    </>
  )
}

export function skeletonListActions() {
  return (
    <>
      {skeletonBadge}
      <Button variant="secondary" size="sm" disabled>
        Exportar
      </Button>
      <Button variant="primary" size="sm" disabled>
        Nuevo documento
      </Button>
    </>
  )
}

export function skeletonCatalogActions() {
  return (
    <>
      {skeletonBadge}
      <Button variant="secondary" size="sm" disabled>
        Importar
      </Button>
      <Button variant="primary" size="sm" disabled>
        Nuevo producto
      </Button>
    </>
  )
}

export function skeletonDocumentActions(confirmLabel: string) {
  return (
    <>
      {skeletonBadge}
      <Button variant="ghost" size="sm" disabled>
        Anular
      </Button>
      <Button variant="secondary" size="sm" disabled>
        Guardar
      </Button>
      <Button variant="primary" size="sm" disabled>
        {confirmLabel}
      </Button>
    </>
  )
}

export function skeletonDetailActions() {
  return (
    <>
      {skeletonBadge}
      <Button variant="ghost" size="sm" disabled>
        Volver
      </Button>
      <Button variant="secondary" size="sm" disabled>
        Imprimir
      </Button>
    </>
  )
}
