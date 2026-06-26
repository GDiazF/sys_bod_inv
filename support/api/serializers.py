from rest_framework import serializers

from core.api.serializers_base import EmpresaScopedModelSerializer
from core.models import Bodega
from support.models import Adjunto, Custodio, Numerador, UbicacionBodega


class UbicacionBodegaSerializer(EmpresaScopedModelSerializer):
    empresa_scoped_fields = {'bodega': Bodega}

    class Meta:
        model = UbicacionBodega
        fields = '__all__'
        read_only_fields = ('empresa',)


class CustodioSerializer(EmpresaScopedModelSerializer):
    class Meta:
        model = Custodio
        fields = '__all__'
        read_only_fields = ('empresa',)


class NumeradorSerializer(EmpresaScopedModelSerializer):
    class Meta:
        model = Numerador
        fields = '__all__'
        read_only_fields = ('empresa',)


class AdjuntoSerializer(EmpresaScopedModelSerializer):
    class Meta:
        model = Adjunto
        fields = '__all__'
        read_only_fields = ('empresa', 'created_at')
