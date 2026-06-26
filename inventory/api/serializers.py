from rest_framework import serializers

from catalogs.models import Categoria, Marca, UnidadMedida
from core.api.serializers_base import EmpresaScopedModelSerializer
from inventory.models import MovimientoInventario, Producto, Proveedor, StockActual


class ProductoSerializer(EmpresaScopedModelSerializer):
    tipo_control_codigo = serializers.CharField(
        source='tipo_control_inventario.codigo',
        read_only=True,
    )
    empresa_scoped_fields = {
        'categoria': Categoria,
        'marca': Marca,
        'unidad_medida': UnidadMedida,
        'unidad_compra': UnidadMedida,
    }

    class Meta:
        model = Producto
        fields = '__all__'
        read_only_fields = ('empresa', 'costo_promedio_actual', 'created_at', 'updated_at')


class ProveedorSerializer(EmpresaScopedModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'
        read_only_fields = ('empresa',)


class StockActualSerializer(serializers.ModelSerializer):
    producto_sku = serializers.CharField(source='producto.sku', read_only=True)
    bodega_codigo = serializers.CharField(source='bodega.codigo', read_only=True)

    class Meta:
        model = StockActual
        fields = '__all__'


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    tipo_movimiento_codigo = serializers.CharField(source='tipo_movimiento.codigo', read_only=True)
    producto_sku = serializers.CharField(source='producto.sku', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = '__all__'
