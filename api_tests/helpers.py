from decimal import Decimal

from inventory.services.movimiento_inventario_service import (
    MovimientoInventarioService,
    MovimientoInput,
)


def entrada_stock(empresa, producto, bodega, usuario, cantidad='100'):
    MovimientoInventarioService.registrar_movimiento(
        MovimientoInput(
            empresa=empresa,
            producto=producto,
            tipo_movimiento_codigo='ENTRADA_COMPRA',
            cantidad=Decimal(cantidad),
            costo_unitario=Decimal('10'),
            created_by=usuario,
            bodega_destino=bodega,
        )
    )
