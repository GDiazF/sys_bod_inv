from drf_spectacular.utils import OpenApiResponse, extend_schema


def schema_accion_documento(*, request=None, response=None, summary=None):
    kwargs = {}
    if request is not None:
        kwargs['request'] = request
    if response is not None:
        kwargs['responses'] = {200: response}
    if summary is not None:
        kwargs['summary'] = summary
    return extend_schema(**kwargs)


def schema_crear_detalle(request_serializer):
    return extend_schema(
        request=request_serializer,
        responses={201: OpenApiResponse(description='Detalle creado.')},
        summary='Agregar detalle al documento.',
    )


def schema_anular_documento(response_serializer):
    return extend_schema(
        request=None,
        responses={200: response_serializer},
        summary='Anular documento.',
    )


def schema_crear_documento(request_serializer, response_serializer, summary):
    return extend_schema(
        request=request_serializer,
        responses={201: response_serializer},
        summary=summary,
    )
