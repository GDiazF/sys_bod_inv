from rest_framework import serializers


class EmpresaScopedPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """FK restringido a registros de la empresa del usuario autenticado."""

    def __init__(self, model, **kwargs):
        self.empresa_model = model
        kwargs.setdefault('queryset', model.objects.none())
        super().__init__(**kwargs)

    def bind(self, field_name, parent):
        super().bind(field_name, parent)
        request = parent.context.get('request')
        if request and request.user.is_authenticated:
            self.queryset = self.empresa_model.objects.filter(
                empresa_id=request.user.empresa_id
            )


def scope_model_serializer_fks(serializer, empresa_scoped_fields: dict):
    """Restringe querysets de PrimaryKeyRelatedField al tenant actual."""
    request = serializer.context.get('request')
    if not request or not request.user.is_authenticated:
        return
    empresa_id = request.user.empresa_id
    for field_name, model in empresa_scoped_fields.items():
        field = serializer.fields.get(field_name)
        if isinstance(field, serializers.PrimaryKeyRelatedField):
            field.queryset = model.objects.filter(empresa_id=empresa_id)
