from decimal import Decimal

from rest_framework import serializers

from core.api.fields import EmpresaScopedPrimaryKeyRelatedField
from core.models import Bodega, CentroCosto
from inventory.models import Lote, Producto, Proveedor, Serie
from operations.models import (
    AjusteInventario,
    AjusteInventarioDetalle,
    Compra,
    CompraDetalle,
    Entrega,
    EntregaDetalle,
    Solicitud,
    SolicitudDetalle,
    Traslado,
    TrasladoDetalle,
)


class SolicitudDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolicitudDetalle
        fields = '__all__'


class SolicitudSerializer(serializers.ModelSerializer):
    estado_codigo = serializers.CharField(source='estado.codigo', read_only=True)
    detalles = SolicitudDetalleSerializer(many=True, read_only=True)

    class Meta:
        model = Solicitud
        fields = '__all__'
        read_only_fields = (
            'numero',
            'empresa',
            'estado',
            'approved_by',
            'approved_at',
            'created_by',
            'created_at',
            'updated_at',
        )


class SolicitudCreateSerializer(serializers.Serializer):
    centro_costo = EmpresaScopedPrimaryKeyRelatedField(CentroCosto)
    fecha_solicitud = serializers.DateField(required=False)
    motivo = serializers.CharField(required=False, allow_blank=True)


class SolicitudDetalleCreateSerializer(serializers.Serializer):
    producto = EmpresaScopedPrimaryKeyRelatedField(Producto)
    cantidad_solicitada = serializers.DecimalField(max_digits=18, decimal_places=4)
    serie = EmpresaScopedPrimaryKeyRelatedField(Serie, required=False, allow_null=True)
    lote = EmpresaScopedPrimaryKeyRelatedField(Lote, required=False, allow_null=True)


class EntregaDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntregaDetalle
        fields = '__all__'


class EntregaSerializer(serializers.ModelSerializer):
    estado_codigo = serializers.CharField(source='estado.codigo', read_only=True)
    detalles = EntregaDetalleSerializer(many=True, read_only=True)

    class Meta:
        model = Entrega
        fields = '__all__'
        read_only_fields = (
            'numero',
            'empresa',
            'estado',
            'approved_by',
            'approved_at',
            'created_by',
            'created_at',
            'updated_at',
        )


class EntregaDesdeSolicitudSerializer(serializers.Serializer):
    solicitud = EmpresaScopedPrimaryKeyRelatedField(Solicitud)
    bodega = EmpresaScopedPrimaryKeyRelatedField(Bodega)
    fecha_entrega = serializers.DateField(required=False)


class EntregaAdHocCreateSerializer(serializers.Serializer):
    bodega = EmpresaScopedPrimaryKeyRelatedField(Bodega)
    centro_costo = EmpresaScopedPrimaryKeyRelatedField(CentroCosto)
    fecha_entrega = serializers.DateField(required=False)


class EntregaDetalleCreateSerializer(serializers.Serializer):
    producto = EmpresaScopedPrimaryKeyRelatedField(Producto)
    cantidad_entregada = serializers.DecimalField(max_digits=18, decimal_places=4)
    serie = EmpresaScopedPrimaryKeyRelatedField(Serie, required=False, allow_null=True)
    lote = EmpresaScopedPrimaryKeyRelatedField(Lote, required=False, allow_null=True)


class TrasladoDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrasladoDetalle
        fields = '__all__'


class TrasladoSerializer(serializers.ModelSerializer):
    estado_codigo = serializers.CharField(source='estado.codigo', read_only=True)
    detalles = TrasladoDetalleSerializer(many=True, read_only=True)

    class Meta:
        model = Traslado
        fields = '__all__'
        read_only_fields = (
            'numero',
            'empresa',
            'estado',
            'approved_by',
            'approved_at',
            'created_by',
            'created_at',
            'updated_at',
        )


class TrasladoCreateSerializer(serializers.Serializer):
    bodega_origen = EmpresaScopedPrimaryKeyRelatedField(Bodega)
    bodega_destino = EmpresaScopedPrimaryKeyRelatedField(Bodega)
    bodega_transito = EmpresaScopedPrimaryKeyRelatedField(Bodega, required=False, allow_null=True)
    motivo = serializers.CharField(required=False, allow_blank=True)


class TrasladoDetalleCreateSerializer(serializers.Serializer):
    producto = EmpresaScopedPrimaryKeyRelatedField(Producto)
    cantidad_trasladada = serializers.DecimalField(max_digits=18, decimal_places=4)
    serie = EmpresaScopedPrimaryKeyRelatedField(Serie, required=False, allow_null=True)
    lote = EmpresaScopedPrimaryKeyRelatedField(Lote, required=False, allow_null=True)


class CompraDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompraDetalle
        fields = '__all__'


class CompraSerializer(serializers.ModelSerializer):
    estado_codigo = serializers.CharField(source='estado.codigo', read_only=True)
    detalles = CompraDetalleSerializer(many=True, read_only=True)

    class Meta:
        model = Compra
        fields = '__all__'
        read_only_fields = (
            'numero',
            'empresa',
            'estado',
            'approved_by',
            'approved_at',
            'created_by',
            'created_at',
            'updated_at',
        )


class CompraCreateSerializer(serializers.Serializer):
    proveedor = EmpresaScopedPrimaryKeyRelatedField(Proveedor)
    bodega_destino = EmpresaScopedPrimaryKeyRelatedField(Bodega)
    fecha_compra = serializers.DateField(required=False)
    observacion = serializers.CharField(required=False, allow_blank=True)


class CompraDetalleCreateSerializer(serializers.Serializer):
    producto = EmpresaScopedPrimaryKeyRelatedField(Producto)
    cantidad = serializers.DecimalField(max_digits=18, decimal_places=4)
    costo_unitario = serializers.DecimalField(max_digits=18, decimal_places=4)
    lote = EmpresaScopedPrimaryKeyRelatedField(Lote, required=False, allow_null=True)
    numero_serie = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class AjusteInventarioDetalleSerializer(serializers.ModelSerializer):
    diferencia = serializers.DecimalField(max_digits=18, decimal_places=4, read_only=True)

    class Meta:
        model = AjusteInventarioDetalle
        fields = '__all__'


class AjusteInventarioSerializer(serializers.ModelSerializer):
    estado_codigo = serializers.CharField(source='estado.codigo', read_only=True)
    detalles = AjusteInventarioDetalleSerializer(many=True, read_only=True)

    class Meta:
        model = AjusteInventario
        fields = '__all__'
        read_only_fields = (
            'numero',
            'empresa',
            'estado',
            'approved_by',
            'approved_at',
            'created_by',
            'created_at',
            'updated_at',
        )


class AjusteCreateSerializer(serializers.Serializer):
    bodega = EmpresaScopedPrimaryKeyRelatedField(Bodega)
    fecha_ajuste = serializers.DateField(required=False)
    motivo = serializers.CharField(required=False, allow_blank=True)


class AjusteDetalleCreateSerializer(serializers.Serializer):
    producto = EmpresaScopedPrimaryKeyRelatedField(Producto)
    cantidad_contada = serializers.DecimalField(max_digits=18, decimal_places=4)
    serie = EmpresaScopedPrimaryKeyRelatedField(Serie, required=False, allow_null=True)
    lote = EmpresaScopedPrimaryKeyRelatedField(Lote, required=False, allow_null=True)
