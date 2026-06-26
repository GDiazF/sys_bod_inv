from django.db import transaction

from core.models import Empresa
from support.models import Numerador
from support.services.exceptions import NumeradorInactivoError, NumeradorNoConfiguradoError


class NumeradorService:
    @staticmethod
    @transaction.atomic
    def generar_folio(empresa: Empresa, tipo_documento: str) -> str:
        """
        Genera un folio único por empresa y tipo de documento.
        Usa select_for_update para evitar duplicados en concurrencia.
        """
        try:
            numerador = (
                Numerador.objects.select_for_update()
                .get(empresa=empresa, tipo_documento=tipo_documento)
            )
        except Numerador.DoesNotExist as exc:
            raise NumeradorNoConfiguradoError(
                f'No existe numerador para {tipo_documento} en empresa {empresa.codigo}.'
            ) from exc

        if not numerador.activo:
            raise NumeradorInactivoError(
                f'El numerador {tipo_documento} está inactivo para empresa {empresa.codigo}.'
            )

        numerador.ultimo_numero += 1
        numerador.save(update_fields=['ultimo_numero'])

        numero = str(numerador.ultimo_numero)
        if numerador.longitud:
            numero = numero.zfill(numerador.longitud)

        prefijo = numerador.prefijo or ''
        return f'{prefijo}{numero}'

    @staticmethod
    def obtener_o_crear(
        empresa: Empresa,
        tipo_documento: str,
        prefijo: str = '',
        longitud: int = 6,
    ) -> Numerador:
        numerador, _ = Numerador.objects.get_or_create(
            empresa=empresa,
            tipo_documento=tipo_documento,
            defaults={
                'prefijo': prefijo,
                'longitud': longitud,
                'ultimo_numero': 0,
                'activo': True,
            },
        )
        return numerador
