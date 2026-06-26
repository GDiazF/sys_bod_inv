from rest_framework import serializers

from security.models import Permiso, Rol, Usuario
from security.services.permiso_service import PermisoService


class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ('id', 'codigo', 'nombre', 'modulo', 'documento_tipo', 'descripcion', 'activo')


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ('id', 'empresa', 'codigo', 'nombre', 'descripcion', 'activo')
        read_only_fields = ('empresa',)


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = (
            'id',
            'empresa',
            'email',
            'nombre_completo',
            'activo',
            'is_staff',
            'ultimo_acceso_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('empresa', 'ultimo_acceso_at', 'created_at', 'updated_at')
        extra_kwargs = {'password': {'write_only': True}}


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = ('email', 'nombre_completo', 'password', 'activo', 'is_staff')

    def create(self, validated_data):
        empresa = self.context['empresa']
        return Usuario.objects.create_user(empresa=empresa, **validated_data)


class MeSerializer(serializers.ModelSerializer):
    empresa_codigo = serializers.CharField(source='empresa.codigo', read_only=True)
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = (
            'id',
            'email',
            'nombre_completo',
            'empresa_id',
            'empresa_codigo',
            'activo',
            'permisos',
        )

    def get_permisos(self, obj):
        return sorted(PermisoService.obtener_codigos_usuario(obj))
