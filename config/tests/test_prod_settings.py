import importlib

import pytest
from django.core.exceptions import ImproperlyConfigured


@pytest.fixture
def prod_env(monkeypatch):
    monkeypatch.setenv(
        'DJANGO_SECRET_KEY',
        'prod-secret-key-with-enough-length-32-chars',
    )
    monkeypatch.setenv('ALLOWED_HOSTS', 'api.example.com')
    monkeypatch.setenv('CORS_ALLOWED_ORIGINS', 'https://app.example.com')
    monkeypatch.setenv('CSRF_TRUSTED_ORIGINS', 'https://app.example.com')
    monkeypatch.setenv('DB_PASSWORD', 'db-secret')


def test_prod_settings_exige_secret_key(prod_env, monkeypatch):
    import config.settings.base as base_settings
    import config.settings.prod as prod_settings

    monkeypatch.setenv('DJANGO_SECRET_KEY', '')
    with pytest.raises(ImproperlyConfigured, match='DJANGO_SECRET_KEY'):
        importlib.reload(prod_settings)

    monkeypatch.setenv(
        'DJANGO_SECRET_KEY',
        'prod-secret-key-with-enough-length-32-chars',
    )
    importlib.reload(base_settings)
    importlib.reload(prod_settings)


def test_prod_settings_carga_con_variables_obligatorias(prod_env, monkeypatch):
    monkeypatch.setenv(
        'DJANGO_SECRET_KEY',
        'prod-secret-key-with-enough-length-32-chars',
    )
    import config.settings.prod as prod_settings

    importlib.reload(prod_settings)

    assert prod_settings.DEBUG is False
    assert prod_settings.SECURE_SSL_REDIRECT is True
    assert prod_settings.SESSION_COOKIE_SECURE is True
    assert prod_settings.CSRF_COOKIE_SECURE is True
    assert prod_settings.SECURE_CONTENT_TYPE_NOSNIFF is True
    assert prod_settings.X_FRAME_OPTIONS == 'DENY'
    assert prod_settings.SECURE_HSTS_SECONDS > 0
    assert prod_settings.ALLOWED_HOSTS == ['api.example.com']

    import config.settings.base as base_settings

    importlib.reload(base_settings)
    importlib.reload(prod_settings)
