from decimal import Decimal

from inventory.models import Lote, Producto
from inventory.services.exceptions import (
    LoteProhibidoError,
    LoteRequeridoError,
    SerieProhibidaError,
)


class LoteService:
    @staticmethod
    def validar_tipo_control_lote(
        producto: Producto,
        lote: Lote | None,
        serie,
    ) -> None:
        codigo = producto.tipo_control_inventario.codigo
        if codigo == 'POR_LOTE':
            if lote is None:
                raise LoteRequeridoError('Producto por lote requiere identificar el lote.')
            if lote.producto_id != producto.id:
                raise LoteRequeridoError('El lote no pertenece al producto.')
            if lote.empresa_id != producto.empresa_id:
                raise LoteRequeridoError('El lote no pertenece a la empresa.')
            if not lote.activo:
                raise LoteRequeridoError('El lote está inactivo.')
        elif codigo in ('NO_SERIALIZADO', 'SERIALIZADO') and lote is not None:
            raise LoteProhibidoError(
                f'El tipo de control {codigo} no admite lote en este movimiento.'
            )
        if codigo == 'SERIALIZADO' and serie is not None and lote is not None:
            raise LoteProhibidoError('Producto serializado no admite lote.')

    @staticmethod
    def validar_cantidad(producto: Producto, cantidad: Decimal) -> None:
        if producto.tipo_control_inventario.codigo == 'POR_LOTE' and cantidad <= 0:
            raise LoteRequeridoError('La cantidad debe ser mayor que cero.')
