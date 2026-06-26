from decimal import Decimal

from catalogs.models import MetodoCosteo
from core.models import Empresa, ParametroEmpresa
from inventory.models import MovimientoInventario, Producto
from inventory.services.exceptions import FifoNoHabilitadoError
from inventory.services.stock_service import StockService


class ValorizacionService:
    CODIGO_PROMEDIO = 'PROMEDIO_PONDERADO'
    CODIGO_FIFO = 'FIFO'

    @staticmethod
    def obtener_metodo_costeo(empresa: Empresa) -> MetodoCosteo:
        try:
            parametros = empresa.parametros
        except ParametroEmpresa.DoesNotExist:
            return MetodoCosteo.objects.get(codigo=ValorizacionService.CODIGO_PROMEDIO)
        if parametros.metodo_costeo_id is None:
            return MetodoCosteo.objects.get(codigo=ValorizacionService.CODIGO_PROMEDIO)
        return parametros.metodo_costeo

    @staticmethod
    def asegurar_metodo_habilitado(metodo: MetodoCosteo) -> None:
        if metodo.codigo == ValorizacionService.CODIGO_FIFO:
            raise FifoNoHabilitadoError(
                'FIFO está modelado pero deshabilitado operativamente en v1.'
            )
        if not metodo.activo:
            raise FifoNoHabilitadoError(
                f'El método de costeo {metodo.codigo} no está activo.'
            )

    @staticmethod
    def costo_entrada(
        producto: Producto,
        cantidad: Decimal,
        costo_unitario: Decimal,
    ) -> Decimal:
        """Actualiza costo promedio global del producto y retorna el costo unitario aplicado."""
        total_actual = StockService.total_producto_empresa(producto)
        costo_actual = producto.costo_promedio_actual

        if total_actual + cantidad == 0:
            nuevo_promedio = costo_unitario
        else:
            valor_actual = total_actual * costo_actual
            valor_entrada = cantidad * costo_unitario
            nuevo_promedio = (valor_actual + valor_entrada) / (total_actual + cantidad)

        producto.costo_promedio_actual = nuevo_promedio.quantize(Decimal('0.0001'))
        producto.save(update_fields=['costo_promedio_actual', 'updated_at'])
        return costo_unitario

    @staticmethod
    def costo_salida(producto: Producto, cantidad: Decimal) -> tuple[Decimal, Decimal]:
        """Retorna (costo_unitario, costo_total) usando promedio ponderado vigente."""
        costo_unitario = producto.costo_promedio_actual
        costo_total = (cantidad * costo_unitario).quantize(Decimal('0.0001'))
        return costo_unitario, costo_total

    @staticmethod
    def revertir_entrada(
        producto: Producto,
        cantidad: Decimal,
        costo_unitario: Decimal,
    ) -> None:
        total_actual = StockService.total_producto_empresa(producto)
        if total_actual - cantidad <= 0:
            producto.costo_promedio_actual = Decimal('0')
        else:
            valor_total = total_actual * producto.costo_promedio_actual
            valor_revertido = cantidad * costo_unitario
            nuevo_total = total_actual - cantidad
            if nuevo_total > 0:
                producto.costo_promedio_actual = (
                    (valor_total - valor_revertido) / nuevo_total
                ).quantize(Decimal('0.0001'))
        producto.save(update_fields=['costo_promedio_actual', 'updated_at'])

    @staticmethod
    def revertir_salida(
        producto: Producto,
        movimiento_original: MovimientoInventario,
    ) -> tuple[Decimal, Decimal]:
        return movimiento_original.costo_unitario, movimiento_original.costo_total

    @staticmethod
    def calcular_costo_total(cantidad: Decimal, costo_unitario: Decimal) -> Decimal:
        return (cantidad * costo_unitario).quantize(Decimal('0.0001'))
