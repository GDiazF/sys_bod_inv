import { Button } from '@/components/ui'

export function movimientosHeaderActions() {
  return (
    <>
      <Button variant="secondary" size="sm" disabled>
        Exportar
      </Button>
      <Button variant="primary" size="sm" disabled>
        Nuevo documento
      </Button>
    </>
  )
}

export function productosHeaderActions() {
  return (
    <>
      <Button variant="secondary" size="sm" disabled>
        Importar
      </Button>
      <Button variant="primary" size="sm" disabled>
        Nuevo producto
      </Button>
    </>
  )
}
