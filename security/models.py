from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('activo', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='usuarios',
    )
    email = models.EmailField(max_length=150, unique=True)
    nombre_completo = models.CharField(max_length=150)
    activo = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    ultimo_acceso_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre_completo']

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'usuario'
        verbose_name_plural = 'usuarios'

    def __str__(self):
        return self.email


class Rol(models.Model):
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='roles',
    )
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'roles'
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'codigo'],
                name='uq_rol_empresa_codigo',
            ),
        ]
        verbose_name = 'rol'
        verbose_name_plural = 'roles'

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class Permiso(models.Model):
    codigo = models.CharField(max_length=60, unique=True)
    nombre = models.CharField(max_length=120)
    modulo = models.CharField(max_length=50, blank=True, null=True)
    documento_tipo = models.CharField(
        max_length=40,
        blank=True,
        null=True,
        help_text='Tipo de documento al que aplica el permiso (ej. SOLICITUD, COMPRA).',
    )
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'permisos'
        verbose_name = 'permiso'
        verbose_name_plural = 'permisos'

    def __str__(self):
        return self.codigo


class UsuarioRol(models.Model):
    usuario = models.ForeignKey('security.Usuario', on_delete=models.PROTECT)
    rol = models.ForeignKey('security.Rol', on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuarioroles'
        constraints = [
            models.UniqueConstraint(
                fields=['usuario', 'rol'],
                name='uq_usuario_rol',
            ),
        ]
        verbose_name = 'usuario-rol'
        verbose_name_plural = 'usuario-roles'

    def __str__(self):
        return f'{self.usuario.email} -> {self.rol.codigo}'


class RolPermiso(models.Model):
    rol = models.ForeignKey('security.Rol', on_delete=models.PROTECT)
    permiso = models.ForeignKey('security.Permiso', on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rolpermisos'
        constraints = [
            models.UniqueConstraint(
                fields=['rol', 'permiso'],
                name='uq_rol_permiso',
            ),
        ]
        verbose_name = 'rol-permiso'
        verbose_name_plural = 'rol-permisos'

    def __str__(self):
        return f'{self.rol.codigo} -> {self.permiso.codigo}'
