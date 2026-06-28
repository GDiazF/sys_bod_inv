from rest_framework.exceptions import AuthenticationFailed
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from security.models import Usuario


class AuthRateThrottle(ScopedRateThrottle):
    scope = 'auth'


class ActivoTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.activo:
            raise AuthenticationFailed(
                'Usuario inactivo.',
                code='user_inactive',
            )
        return data


class ActivoTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = RefreshToken(attrs['refresh'])
        user_id = refresh.payload.get('user_id')
        if user_id is not None:
            try:
                usuario = Usuario.objects.get(pk=user_id)
            except Usuario.DoesNotExist as exc:
                raise AuthenticationFailed(
                    'Usuario no encontrado.',
                    code='user_not_found',
                ) from exc
            if not usuario.activo:
                raise AuthenticationFailed(
                    'Usuario inactivo.',
                    code='user_inactive',
                )
        return super().validate(attrs)


class ActivoTokenObtainPairView(TokenObtainPairView):
    serializer_class = ActivoTokenObtainPairSerializer
    throttle_classes = [AuthRateThrottle]


class ActivoTokenRefreshView(TokenRefreshView):
    serializer_class = ActivoTokenRefreshSerializer
    throttle_classes = [AuthRateThrottle]
