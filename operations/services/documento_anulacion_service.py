from inventory.models import MovimientoInventario
from inventory.services.movimiento_inventario_service import MovimientoInventarioService
from operations.services.tenant_validation import validar_usuario_empresa
from security.models import Usuario


class DocumentoAnulacionService:
    @staticmethod
    def reversar_movimientos(
        referencia_tipo: str,
        referencia_id,
        usuario: Usuario,
        empresa_id: int,
    ) -> None:
        validar_usuario_empresa(usuario, empresa_id)
        movimientos = (
            MovimientoInventario.objects.filter(
                empresa_id=empresa_id,
                referencia_tipo=referencia_tipo,
                referencia_id=str(referencia_id),
                anulado=False,
            )
            .select_related('tipo_movimiento')
            .order_by('-created_at', '-pk')
        )
        for movimiento in movimientos:
            MovimientoInventarioService.anular_movimiento(movimiento, usuario)
