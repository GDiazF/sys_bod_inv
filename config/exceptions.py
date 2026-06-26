from rest_framework.views import exception_handler

from inventory.services.exceptions import InventoryServiceError
from operations.services.exceptions import OperationsServiceError
from support.services.exceptions import SupportServiceError


def api_exception_handler(exc, context):
    if isinstance(exc, (OperationsServiceError, InventoryServiceError, SupportServiceError)):
        from rest_framework.response import Response

        return Response({'detail': str(exc)}, status=400)
    return exception_handler(exc, context)
