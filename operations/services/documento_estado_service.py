from django.utils import timezone

from catalogs.models import EstadoDocumento
from operations.services.exceptions import DocumentoEstadoInvalidoError, DocumentoNoEditableError


class DocumentoEstadoService:
    TRANSICIONES = {
        'SOLICITUD': {
            'BORRADOR': {'PENDIENTE', 'APROBADO', 'ANULADO'},
            'PENDIENTE': {'APROBADO', 'RECHAZADO', 'ANULADO'},
            'APROBADO': {'CERRADO', 'ANULADO'},
        },
        'ENTREGA': {
            'BORRADOR': {'PENDIENTE', 'APROBADO', 'ANULADO'},
            'PENDIENTE': {'APROBADO', 'RECHAZADO', 'ANULADO'},
            'APROBADO': {'CERRADO', 'ANULADO'},
            'CERRADO': {'ANULADO'},
        },
        'TRASLADO': {
            'BORRADOR': {'PENDIENTE', 'ANULADO'},
            'PENDIENTE': {'APROBADO', 'RECHAZADO', 'ANULADO'},
            'APROBADO': {'EN_TRANSITO', 'ANULADO'},
            'EN_TRANSITO': {'CERRADO', 'ANULADO'},
            'CERRADO': {'ANULADO'},
        },
        'COMPRA': {
            'BORRADOR': {'PENDIENTE', 'ANULADO'},
            'PENDIENTE': {'APROBADO', 'RECHAZADO', 'ANULADO'},
            'APROBADO': {'CERRADO', 'ANULADO'},
            'CERRADO': {'ANULADO'},
        },
        'AJUSTE': {
            'BORRADOR': {'PENDIENTE', 'ANULADO'},
            'PENDIENTE': {'APROBADO', 'RECHAZADO', 'ANULADO'},
            'APROBADO': {'CERRADO', 'ANULADO'},
            'CERRADO': {'ANULADO'},
        },
    }

    ESTADOS_EDITABLES = {'BORRADOR'}

    @staticmethod
    def obtener_estado(codigo: str) -> EstadoDocumento:
        return EstadoDocumento.objects.get(codigo=codigo)

    @classmethod
    def validar_transicion(
        cls,
        documento_tipo: str,
        estado_actual_codigo: str,
        estado_nuevo_codigo: str,
    ) -> None:
        permitidos = cls.TRANSICIONES.get(documento_tipo, {}).get(estado_actual_codigo, set())
        if estado_nuevo_codigo not in permitidos:
            raise DocumentoEstadoInvalidoError(
                f'Transición no permitida: {estado_actual_codigo} -> {estado_nuevo_codigo} '
                f'para {documento_tipo}.'
            )

    @classmethod
    def validar_editable(cls, estado_actual_codigo: str) -> None:
        if estado_actual_codigo not in cls.ESTADOS_EDITABLES:
            raise DocumentoNoEditableError(
                f'Solo documentos en BORRADOR son editables (estado actual: {estado_actual_codigo}).'
            )

    @classmethod
    def cambiar_estado(cls, documento, documento_tipo: str, nuevo_codigo: str, usuario) -> None:
        cls.validar_transicion(
            documento_tipo,
            documento.estado.codigo,
            nuevo_codigo,
        )
        documento.estado = cls.obtener_estado(nuevo_codigo)
        if nuevo_codigo == 'APROBADO':
            documento.approved_by = usuario
            documento.approved_at = timezone.now()
        documento.save()

    @staticmethod
    def marcar_aprobacion(documento, usuario) -> None:
        documento.approved_by = usuario
        documento.approved_at = timezone.now()
        documento.save(update_fields=['approved_by', 'approved_at', 'updated_at'])
