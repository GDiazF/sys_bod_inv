import pytest
from django.conf import settings
from rest_framework import status
from rest_framework.test import APIRequestFactory

from security.api.permissions import RBACPermission
from security.models import Rol, Usuario, UsuarioRol


def _crear_usuario_admin(empresa):
    usuario = Usuario.objects.create_user(
        email='admin-a@example.com',
        password='pass12345',
        nombre_completo='Admin A',
        empresa=empresa,
    )
    rol = Rol.objects.get(empresa=empresa, codigo='ADMIN')
    UsuarioRol.objects.create(usuario=usuario, rol=rol)
    return usuario


@pytest.mark.django_db
class TestAuthJWT:
    def test_usuario_activo_obtiene_token(self, api_client, usuario_bodeguero_a):
        response = api_client.post(
            '/api/v1/auth/token/',
            {'email': usuario_bodeguero_a.email, 'password': 'pass12345'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_usuario_inactivo_no_obtiene_token(self, api_client, empresa_a):
        usuario = Usuario.objects.create_user(
            email='inactivo@example.com',
            password='pass12345',
            nombre_completo='Inactivo',
            empresa=empresa_a,
            activo=False,
        )
        assert usuario.pk
        response = api_client.post(
            '/api/v1/auth/token/',
            {'email': usuario.email, 'password': 'pass12345'},
            format='json',
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_rechaza_usuario_inactivo(self, api_client, empresa_a):
        usuario = Usuario.objects.create_user(
            email='activo-luego-inactivo@example.com',
            password='pass12345',
            nombre_completo='Temporal',
            empresa=empresa_a,
            activo=True,
        )
        token_response = api_client.post(
            '/api/v1/auth/token/',
            {'email': usuario.email, 'password': 'pass12345'},
            format='json',
        )
        refresh = token_response.data['refresh']

        usuario.activo = False
        usuario.save(update_fields=['activo'])

        response = api_client.post(
            '/api/v1/auth/token/refresh/',
            {'refresh': refresh},
            format='json',
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_auth_throttle_configurado_en_settings(self):
        assert 'auth' in settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']

    def test_auth_views_usan_throttle(self):
        from security.api.auth import (
            ActivoTokenObtainPairView,
            ActivoTokenRefreshView,
            AuthRateThrottle,
        )

        assert AuthRateThrottle.scope == 'auth'
        assert ActivoTokenObtainPairView.throttle_classes == [AuthRateThrottle]
        assert ActivoTokenRefreshView.throttle_classes == [AuthRateThrottle]


@pytest.mark.django_db
class TestUsuarioIsStaff:
    def test_is_staff_no_escribible_en_create(self, api_client, empresa_a):
        admin = _crear_usuario_admin(empresa_a)
        api_client.force_authenticate(user=admin)
        response = api_client.post(
            '/api/v1/security/usuarios/',
            {
                'email': 'nuevo@example.com',
                'nombre_completo': 'Nuevo Usuario',
                'password': 'pass12345',
                'activo': True,
                'is_staff': True,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        usuario = Usuario.objects.get(email='nuevo@example.com')
        assert usuario.is_staff is False

    def test_is_staff_no_escribible_en_update(self, api_client, empresa_a, usuario_bodeguero_a):
        admin = _crear_usuario_admin(empresa_a)
        api_client.force_authenticate(user=admin)
        assert usuario_bodeguero_a.is_staff is False
        response = api_client.patch(
            f'/api/v1/security/usuarios/{usuario_bodeguero_a.pk}/',
            {'is_staff': True},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        usuario_bodeguero_a.refresh_from_db()
        assert usuario_bodeguero_a.is_staff is False


@pytest.mark.django_db
class TestRBACFailClosed:
    def test_permiso_none_deniega_acceso(self, usuario_bodeguero_a):
        factory = APIRequestFactory()
        request = factory.get('/api/v1/inventory/productos/')
        request.user = usuario_bodeguero_a

        class VistaSinPermisoMapeado:
            def get_required_permission(self):
                return None

        permiso = RBACPermission()
        assert permiso.has_permission(request, VistaSinPermisoMapeado()) is False


@pytest.mark.django_db
class TestSecurityApiUsuarios:
    def test_consulta_no_puede_listar_usuarios(self, api_client, usuario_consulta_a):
        api_client.force_authenticate(user=usuario_consulta_a)
        response = api_client.get('/api/v1/security/usuarios/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_adjunto_ruta_archivo_no_escribible(
        self, api_client, usuario_bodeguero_a, empresa_a
    ):
        api_client.force_authenticate(user=usuario_bodeguero_a)
        response = api_client.post(
            '/api/v1/support/adjuntos/',
            {
                'modulo': 'operations',
                'documento_id': '1',
                'nombre_archivo': 'factura.pdf',
                'ruta_archivo': '/etc/passwd',
                'mime_type': 'application/pdf',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['ruta_archivo'].startswith(f'adjuntos/{empresa_a.id}/')
        assert '/etc/passwd' not in response.data['ruta_archivo']
        assert response.data['subido_por'] == usuario_bodeguero_a.pk

    def test_ruta_protegida_requiere_autenticacion(self, api_client):
        response = api_client.get('/api/v1/inventory/productos/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
