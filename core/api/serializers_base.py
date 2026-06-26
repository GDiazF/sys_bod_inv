from rest_framework import serializers

from core.api.fields import scope_model_serializer_fks


class EmpresaScopedModelSerializer(serializers.ModelSerializer):
    """ModelSerializer con FKs acotados por empresa del request."""

    empresa_scoped_fields: dict = {}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.empresa_scoped_fields:
            scope_model_serializer_fks(self, self.empresa_scoped_fields)

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated and 'empresa' in self.fields:
            validated_data['empresa_id'] = request.user.empresa_id
        return super().create(validated_data)
