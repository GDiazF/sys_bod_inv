from django.core.management.base import BaseCommand

from catalogs.sync import sync_catalogos_globales
from catalogs.models import MetodoCosteo
from core.models import Empresa, ParametroEmpresa
from security.models import Permiso, Rol, RolPermiso
from security.sync import sync_permisos_v1
from support.services.numerador_service import NumeradorService


ROLE_PERMISSIONS = {
    'ADMIN': '__all__',
    'BODEGUERO': [
        'core.bodega.ver',
        'catalogs.ver',
        'inventory.producto.ver',
        'inventory.producto.editar',
        'inventory.stock.ver',
        'inventory.movimiento.ver',
        'inventory.proveedor.editar',
        'operations.solicitud.crear',
        'operations.entrega.crear',
        'operations.traslado.crear',
        'operations.traslado.despachar',
        'operations.traslado.recibir',
        'operations.compra.crear',
        'operations.compra.confirmar',
        'support.adjunto.subir',
    ],
    'SUPERVISOR': [
        'core.empresa.ver',
        'core.bodega.ver',
        'core.bodega.editar',
        'catalogs.ver',
        'catalogs.editar',
        'inventory.producto.ver',
        'inventory.producto.editar',
        'inventory.stock.ver',
        'inventory.movimiento.ver',
        'inventory.proveedor.editar',
        'inventory.override_stock_negativo',
        'inventory.aprobar_ajuste',
        'operations.solicitud.crear',
        'operations.solicitud.aprobar',
        'operations.entrega.crear',
        'operations.entrega.aprobar',
        'operations.traslado.crear',
        'operations.traslado.aprobar',
        'operations.traslado.despachar',
        'operations.traslado.recibir',
        'operations.compra.crear',
        'operations.compra.aprobar',
        'operations.compra.confirmar',
        'operations.documento.anular',
        'security.usuario.ver',
        'support.adjunto.subir',
    ],
    'APROBADOR': [
        'core.bodega.ver',
        'catalogs.ver',
        'inventory.producto.ver',
        'inventory.stock.ver',
        'operations.solicitud.aprobar',
        'operations.entrega.aprobar',
        'operations.traslado.aprobar',
        'operations.compra.aprobar',
        'inventory.aprobar_ajuste',
    ],
    'CONSULTA': [
        'core.empresa.ver',
        'core.bodega.ver',
        'catalogs.ver',
        'inventory.producto.ver',
        'inventory.stock.ver',
        'inventory.movimiento.ver',
    ],
}

ROLE_DEFINITIONS = [
    ('ADMIN', 'Administrador', 'Acceso completo al sistema.'),
    ('BODEGUERO', 'Bodeguero', 'Operación diaria de bodega.'),
    ('SUPERVISOR', 'Supervisor', 'Supervisión, aprobaciones y excepciones.'),
    ('APROBADOR', 'Aprobador', 'Aprobación de documentos sensibles.'),
    ('CONSULTA', 'Consulta', 'Solo lectura de stock y reportes.'),
]

NUMERADORES_DEMO = [
    ('SOLICITUD', 'SOL-', 6),
    ('ENTREGA', 'ENT-', 6),
    ('TRASLADO', 'TRA-', 6),
    ('COMPRA', 'COM-', 6),
    ('AJUSTE', 'AJU-', 6),
]


class Command(BaseCommand):
    help = 'Carga catálogos globales, permisos v1 y datos demo de empresa/roles (idempotente).'

    def handle(self, *args, **options):
        self.stdout.write('Sincronizando catálogos globales...')
        sync_catalogos_globales()

        self.stdout.write('Sincronizando permisos v1...')
        sync_permisos_v1()

        empresa, created = Empresa.objects.get_or_create(
            codigo='DEMO',
            defaults={
                'nombre': 'Empresa Demo',
                'rut': '76.000.000-0',
                'activo': True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Empresa DEMO creada.'))
        else:
            self.stdout.write('Empresa DEMO ya existía.')

        metodo_default = MetodoCosteo.objects.get(codigo='PROMEDIO_PONDERADO')
        parametros, parametros_created = ParametroEmpresa.objects.get_or_create(
            empresa=empresa,
            defaults={
                'metodo_costeo': metodo_default,
                'stock_negativo_permitido': False,
                'aprobacion_salida_requerida': True,
                'permite_cambio_metodo_costeo': False,
            },
        )
        if parametros_created:
            self.stdout.write('Parámetros DEMO creados.')
        else:
            self.stdout.write('Parámetros DEMO ya existían (sin sobrescribir).')

        all_permisos = {p.codigo: p for p in Permiso.objects.filter(activo=True)}

        for codigo_rol, nombre, descripcion in ROLE_DEFINITIONS:
            rol, rol_created = Rol.objects.update_or_create(
                empresa=empresa,
                codigo=codigo_rol,
                defaults={
                    'nombre': nombre,
                    'descripcion': descripcion,
                    'activo': True,
                },
            )
            permisos_codigos = ROLE_PERMISSIONS[codigo_rol]
            if permisos_codigos == '__all__':
                permisos_codigos = list(all_permisos.keys())

            permisos_agregados = 0
            for permiso_codigo in permisos_codigos:
                permiso = all_permisos.get(permiso_codigo)
                if permiso is None:
                    self.stdout.write(
                        self.style.WARNING(f'Permiso no encontrado: {permiso_codigo}')
                    )
                    continue
                _, created_permiso = RolPermiso.objects.get_or_create(rol=rol, permiso=permiso)
                if created_permiso:
                    permisos_agregados += 1

            accion = 'creado' if rol_created else 'sincronizado'
            self.stdout.write(
                f'Rol {codigo_rol} {accion}: '
                f'{permisos_agregados} permisos nuevos, '
                f'{RolPermiso.objects.filter(rol=rol).count()} permisos totales.'
            )

        for tipo_documento, prefijo, longitud in NUMERADORES_DEMO:
            NumeradorService.obtener_o_crear(
                empresa,
                tipo_documento,
                prefijo=prefijo,
                longitud=longitud,
            )
        self.stdout.write(f'Numeradores demo: {len(NUMERADORES_DEMO)} tipos configurados.')

        self.stdout.write(self.style.SUCCESS('Datos iniciales sincronizados correctamente.'))
