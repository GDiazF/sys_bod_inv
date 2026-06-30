import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/Button'
import { ROUTES } from '@/config/routes'

export function dashboardHeaderActions() {
  return (
    <>
      <Link to={ROUTES.movimientos} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
        Ver movimientos
      </Link>
      <Link to={ROUTES.recepcion} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
        Nueva recepción
      </Link>
    </>
  )
}
