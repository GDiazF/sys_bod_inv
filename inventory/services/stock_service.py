from decimal import Decimal

from django.db.models import Sum

from core.models import Bodega, Empresa, ParametroEmpresa
from inventory.models import Lote, Producto, StockActual
from inventory.services.exceptions import StockInsuficienteError


class StockService:
    @staticmethod
    def obtener_stock(
        bodega: Bodega,
        producto: Producto,
        lote: Lote | None = None,
    ) -> Decimal:
        stock = StockActual.objects.filter(
            empresa=producto.empresa,
            bodega=bodega,
            producto=producto,
            lote=lote,
        ).first()
        return stock.cantidad if stock else Decimal('0')

    @staticmethod
    def obtener_stock_bloqueado(
        empresa: Empresa,
        bodega: Bodega,
        producto: Producto,
        lote: Lote | None = None,
    ) -> StockActual:
        stock = (
            StockActual.objects.select_for_update()
            .filter(
                empresa=empresa,
                bodega=bodega,
                producto=producto,
                lote=lote,
            )
            .first()
        )
        if stock is None:
            stock = StockActual.objects.create(
                empresa=empresa,
                bodega=bodega,
                producto=producto,
                lote=lote,
                cantidad=Decimal('0'),
                costo_promedio=producto.costo_promedio_actual,
            )
            stock = StockActual.objects.select_for_update().get(pk=stock.pk)
        return stock

    @staticmethod
    def stock_negativo_permitido(
        producto: Producto,
        override: bool = False,
    ) -> bool:
        if override:
            return True
        try:
            parametros = producto.empresa.parametros
        except ParametroEmpresa.DoesNotExist:
            return False
        return parametros.stock_negativo_permitido and producto.permite_stock_negativo

    @staticmethod
    def validar_stock_suficiente(
        stock: StockActual,
        cantidad: Decimal,
        producto: Producto,
        override: bool = False,
    ) -> None:
        if producto.tipo_control_inventario.codigo == 'SERIALIZADO':
            if cantidad != Decimal('1'):
                raise StockInsuficienteError(
                    'Producto serializado solo permite cantidad 1 por movimiento.'
                )
            nuevo_saldo = stock.cantidad - cantidad
            if nuevo_saldo < 0:
                raise StockInsuficienteError(
                    f'Stock insuficiente en {stock.bodega.codigo}: '
                    f'disponible {stock.cantidad}, requerido {cantidad}.'
                )
            return
        nuevo_saldo = stock.cantidad - cantidad
        if nuevo_saldo < 0 and not StockService.stock_negativo_permitido(producto, override):
            raise StockInsuficienteError(
                f'Stock insuficiente en {stock.bodega.codigo}: '
                f'disponible {stock.cantidad}, requerido {cantidad}.'
            )

    @staticmethod
    def aplicar_entrada(
        stock: StockActual,
        cantidad: Decimal,
        costo_unitario: Decimal,
    ) -> None:
        stock.cantidad += cantidad
        stock.costo_promedio = costo_unitario
        stock.save(update_fields=['cantidad', 'costo_promedio', 'updated_at'])

    @staticmethod
    def aplicar_salida(stock: StockActual, cantidad: Decimal) -> None:
        stock.cantidad -= cantidad
        stock.save(update_fields=['cantidad', 'updated_at'])

    @staticmethod
    def total_producto_empresa(producto: Producto) -> Decimal:
        total = (
            StockActual.objects.filter(empresa=producto.empresa, producto=producto)
            .aggregate(total=Sum('cantidad'))
            .get('total')
        )
        return total or Decimal('0')
