from datetime import date
from decimal import Decimal

from django.db import transaction

from core.models import CentroCosto, Empresa
from inventory.models import Lote, Producto
from operations.models import Solicitud, SolicitudDetalle
from operations.services.documento_estado_service import DocumentoEstadoService
from operations.services.exceptions import DocumentoSinDetalleError
from operations.services.historial_documento_service import HistorialDocumentoService
from security.models import Usuario
from support.services.numerador_service import NumeradorService


class SolicitudService:
    @staticmethod
    @transaction.atomic
    def crear(
        empresa: Empresa,
        centro_costo: CentroCosto,
        usuario: Usuario,
        fecha_solicitud: date | None = None,
        motivo: str | None = None,
    ) -> Solicitud:
        numero = NumeradorService.generar_folio(empresa, Solicitud.TIPO_DOCUMENTO)
        solicitud = Solicitud.objects.create(
            empresa=empresa,
            numero=numero,
            centro_costo=centro_costo,
            estado=DocumentoEstadoService.obtener_estado('BORRADOR'),
            fecha_solicitud=fecha_solicitud or date.today(),
            motivo=motivo,
            created_by=usuario,
        )
        HistorialDocumentoService.registrar(
            empresa=empresa,
            documento_tipo=Solicitud.TIPO_DOCUMENTO,
            documento_id=solicitud.pk,
            estado_anterior=None,
            estado_nuevo='BORRADOR',
            usuario=usuario,
        )
        return solicitud

    @staticmethod
    @transaction.atomic
    def agregar_detalle(
        solicitud: Solicitud,
        producto: Producto,
        cantidad_solicitada: Decimal,
        lote: Lote | None = None,
    ) -> SolicitudDetalle:
        DocumentoEstadoService.validar_editable(solicitud.estado.codigo)
        return SolicitudDetalle.objects.create(
            solicitud=solicitud,
            producto=producto,
            lote=lote,
            cantidad_solicitada=cantidad_solicitada,
        )

    @staticmethod
    @transaction.atomic
    def enviar(solicitud: Solicitud, usuario: Usuario) -> Solicitud:
        solicitud = Solicitud.objects.select_for_update().get(pk=solicitud.pk)
        if not solicitud.detalles.exists():
            raise DocumentoSinDetalleError('La solicitud no tiene detalle.')

        estado_anterior = solicitud.estado.codigo
        requiere_aprobacion = solicitud.empresa.parametros.aprobacion_salida_requerida
        nuevo_estado = 'PENDIENTE' if requiere_aprobacion else 'APROBADO'
        DocumentoEstadoService.cambiar_estado(
            solicitud, Solicitud.TIPO_DOCUMENTO, nuevo_estado, usuario
        )
        if nuevo_estado == 'APROBADO':
            for detalle in solicitud.detalles.all():
                detalle.cantidad_aprobada = detalle.cantidad_solicitada
                detalle.save(update_fields=['cantidad_aprobada'])
        HistorialDocumentoService.registrar_cambio(
            solicitud, Solicitud.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return solicitud

    @staticmethod
    @transaction.atomic
    def aprobar(solicitud: Solicitud, usuario: Usuario) -> Solicitud:
        solicitud = Solicitud.objects.select_for_update().prefetch_related('detalles').get(
            pk=solicitud.pk
        )
        estado_anterior = solicitud.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            solicitud, Solicitud.TIPO_DOCUMENTO, 'APROBADO', usuario
        )
        for detalle in solicitud.detalles.all():
            detalle.cantidad_aprobada = detalle.cantidad_aprobada or detalle.cantidad_solicitada
            detalle.save(update_fields=['cantidad_aprobada'])
        HistorialDocumentoService.registrar_cambio(
            solicitud, Solicitud.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return solicitud

    @staticmethod
    @transaction.atomic
    def rechazar(solicitud: Solicitud, usuario: Usuario) -> Solicitud:
        solicitud = Solicitud.objects.select_for_update().get(pk=solicitud.pk)
        estado_anterior = solicitud.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            solicitud, Solicitud.TIPO_DOCUMENTO, 'RECHAZADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            solicitud, Solicitud.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return solicitud

    @staticmethod
    @transaction.atomic
    def anular(solicitud: Solicitud, usuario: Usuario) -> Solicitud:
        solicitud = Solicitud.objects.select_for_update().get(pk=solicitud.pk)
        estado_anterior = solicitud.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            solicitud, Solicitud.TIPO_DOCUMENTO, 'ANULADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            solicitud, Solicitud.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return solicitud

    @staticmethod
    @transaction.atomic
    def cerrar(solicitud: Solicitud, usuario: Usuario) -> Solicitud:
        solicitud = Solicitud.objects.select_for_update().get(pk=solicitud.pk)
        estado_anterior = solicitud.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            solicitud, Solicitud.TIPO_DOCUMENTO, 'CERRADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            solicitud, Solicitud.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return solicitud
