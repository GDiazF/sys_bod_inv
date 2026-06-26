from rest_framework import serializers

from catalogs.models import Categoria, Marca, UnidadMedida
from core.api.serializers_base import EmpresaScopedModelSerializer
from core.models import Bodega, CentroCosto, Empresa, ParametroEmpresa, Sucursal


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = (
            'id',
            'codigo',
            'nombre',
            'rut',
            'activo',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields


class SucursalSerializer(EmpresaScopedModelSerializer):
    class Meta:
        model = Sucursal
        fields = '__all__'
        read_only_fields = ('empresa', 'created_at', 'updated_at')


class BodegaSerializer(EmpresaScopedModelSerializer):
    empresa_scoped_fields = {'sucursal': Sucursal}

    class Meta:
        model = Bodega
        fields = '__all__'
        read_only_fields = ('empresa', 'created_at', 'updated_at')


class CentroCostoSerializer(EmpresaScopedModelSerializer):
    class Meta:
        model = CentroCosto
        fields = '__all__'
        read_only_fields = ('empresa', 'created_at', 'updated_at')


class ParametroEmpresaSerializer(EmpresaScopedModelSerializer):
    metodo_costeo_codigo = serializers.CharField(
        source='metodo_costeo.codigo',
        read_only=True,
    )

    class Meta:
        model = ParametroEmpresa
        fields = (
            'id',
            'empresa',
            'metodo_costeo',
            'metodo_costeo_codigo',
            'stock_negativo_permitido',
            'aprobacion_salida_requerida',
            'permite_cambio_metodo_costeo',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('empresa', 'created_at', 'updated_at')
