from operations.models import EstadoHistorialDocumento


class HistorialDocumentoService:
    @staticmethod
    def registrar(
        empresa,
        documento_tipo: str,
        documento_id,
        estado_anterior: str | None,
        estado_nuevo: str,
        usuario,
    ) -> EstadoHistorialDocumento:
        return EstadoHistorialDocumento.objects.create(
            empresa=empresa,
            documento_tipo=documento_tipo,
            documento_id=str(documento_id),
            estado_anterior=estado_anterior,
            estado_nuevo=estado_nuevo,
            usuario=usuario,
        )

    @staticmethod
    def registrar_cambio(documento, documento_tipo: str, estado_anterior: str, usuario) -> None:
        HistorialDocumentoService.registrar(
            empresa=documento.empresa,
            documento_tipo=documento_tipo,
            documento_id=documento.pk,
            estado_anterior=estado_anterior,
            estado_nuevo=documento.estado.codigo,
            usuario=usuario,
        )
