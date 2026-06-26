from rest_framework import serializers

from catalogs.models import (
    Categoria,
    EstadoDocumento,
    EstadoSerie,
    Marca,
    MetodoCosteo,
    TipoControlInventario,
    TipoMovimientoInventario,
    UnidadMedida,
)
from core.api.serializers_base import EmpresaScopedModelSerializer


class CategoriaSerializer(EmpresaScopedModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'
        read_only_fields = ('empresa',)


class MarcaSerializer(EmpresaScopedModelSerializer):
    class Meta:
        model = Marca
        fields = '__all__'
        read_only_fields = ('empresa',)


class UnidadMedidaSerializer(EmpresaScopedModelSerializer):
    class Meta:
        model = UnidadMedida
        fields = '__all__'
        read_only_fields = ('empresa',)


class CatalogoGlobalSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ('id', 'codigo', 'nombre', 'activo')


class TipoControlInventarioSerializer(CatalogoGlobalSerializer):
    class Meta(CatalogoGlobalSerializer.Meta):
        model = TipoControlInventario
        fields = CatalogoGlobalSerializer.Meta.fields + ('descripcion',)


class EstadoSerieSerializer(CatalogoGlobalSerializer):
    class Meta(CatalogoGlobalSerializer.Meta):
        model = EstadoSerie
        fields = CatalogoGlobalSerializer.Meta.fields + ('es_final',)


class TipoMovimientoInventarioSerializer(CatalogoGlobalSerializer):
    class Meta(CatalogoGlobalSerializer.Meta):
        model = TipoMovimientoInventario
        fields = CatalogoGlobalSerializer.Meta.fields + (
            'naturaleza',
            'afecta_stock',
            'requiere_aprobacion',
        )


class MetodoCosteoSerializer(CatalogoGlobalSerializer):
    class Meta(CatalogoGlobalSerializer.Meta):
        model = MetodoCosteo
        fields = CatalogoGlobalSerializer.Meta.fields + ('descripcion',)


class EstadoDocumentoSerializer(CatalogoGlobalSerializer):
    class Meta(CatalogoGlobalSerializer.Meta):
        model = EstadoDocumento
        fields = CatalogoGlobalSerializer.Meta.fields + (
            'modulo',
            'documento_tipo',
            'es_final',
        )
