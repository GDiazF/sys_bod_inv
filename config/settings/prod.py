from django.core.exceptions import ImproperlyConfigured

from decouple import Csv, config

from .base import *  # noqa: F401, F403

DEBUG = False

SECRET_KEY = config('DJANGO_SECRET_KEY', default='')
if not SECRET_KEY or SECRET_KEY == 'insecure-dev-key-change-me':
    raise ImproperlyConfigured(
        'DJANGO_SECRET_KEY debe definirse con un valor seguro en producción.'
    )

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='', cast=Csv())
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured('ALLOWED_HOSTS debe definirse en producción.')

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='', cast=Csv())
if not CORS_ALLOWED_ORIGINS:
    raise ImproperlyConfigured('CORS_ALLOWED_ORIGINS debe definirse en producción.')

CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='', cast=Csv())
if not CSRF_TRUSTED_ORIGINS:
    raise ImproperlyConfigured('CSRF_TRUSTED_ORIGINS debe definirse en producción.')

DB_PASSWORD = config('DB_PASSWORD', default='')
if not DB_PASSWORD:
    raise ImproperlyConfigured('DB_PASSWORD debe definirse en producción.')

SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True

SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=31536000, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = config('SECURE_HSTS_PRELOAD', default=False, cast=bool)

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
