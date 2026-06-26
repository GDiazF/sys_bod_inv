"""Datos semilla idempotentes para catálogos globales (v1)."""

METODOS_COSTEO = [
    {
        'codigo': 'PROMEDIO_PONDERADO',
        'nombre': 'Promedio ponderado',
        'descripcion': 'Método de costeo por promedio ponderado. Activo en v1.',
        'activo': True,
    },
    {
        'codigo': 'FIFO',
        'nombre': 'FIFO',
        'descripcion': 'First In, First Out. Modelado en v1; deshabilitado operativamente.',
        'activo': False,
    },
]

TIPOS_CONTROL_INVENTARIO = [
    {
        'codigo': 'SERIALIZADO',
        'nombre': 'Serializado',
        'descripcion': 'Control por unidad con número de serie único.',
    },
    {
        'codigo': 'NO_SERIALIZADO',
        'nombre': 'No serializado',
        'descripcion': 'Control por cantidad y unidad de medida.',
    },
    {
        'codigo': 'POR_LOTE',
        'nombre': 'Por lote',
        'descripcion': 'Control por lote con trazabilidad de partida.',
    },
]

ESTADOS_SERIE = [
    {'codigo': 'DISPONIBLE', 'nombre': 'Disponible', 'es_final': False},
    {'codigo': 'EN_TRANSITO', 'nombre': 'En tránsito', 'es_final': False},
    {'codigo': 'ENTREGADO', 'nombre': 'Entregado', 'es_final': False},
    {'codigo': 'BAJA', 'nombre': 'Baja', 'es_final': True},
    {'codigo': 'MANTENIMIENTO', 'nombre': 'Mantenimiento', 'es_final': False},
]

TIPOS_MOVIMIENTO = [
    {
        'codigo': 'ENTRADA_COMPRA',
        'nombre': 'Entrada por compra',
        'naturaleza': 'ENTRADA',
        'afecta_stock': True,
        'requiere_aprobacion': False,
    },
    {
        'codigo': 'SALIDA_ENTREGA',
        'nombre': 'Salida por entrega',
        'naturaleza': 'SALIDA',
        'afecta_stock': True,
        'requiere_aprobacion': False,
    },
    {
        'codigo': 'TRASLADO_SALIDA',
        'nombre': 'Traslado salida origen',
        'naturaleza': 'SALIDA',
        'afecta_stock': True,
        'requiere_aprobacion': False,
    },
    {
        'codigo': 'TRASLADO_ENTRADA',
        'nombre': 'Traslado entrada destino',
        'naturaleza': 'ENTRADA',
        'afecta_stock': True,
        'requiere_aprobacion': False,
    },
    {
        'codigo': 'AJUSTE_POSITIVO',
        'nombre': 'Ajuste positivo',
        'naturaleza': 'ENTRADA',
        'afecta_stock': True,
        'requiere_aprobacion': True,
    },
    {
        'codigo': 'AJUSTE_NEGATIVO',
        'nombre': 'Ajuste negativo',
        'naturaleza': 'SALIDA',
        'afecta_stock': True,
        'requiere_aprobacion': True,
    },
    {
        'codigo': 'REVERSA',
        'nombre': 'Reversa de movimiento',
        'naturaleza': 'NEUTRO',
        'afecta_stock': True,
        'requiere_aprobacion': False,
    },
]

ESTADOS_DOCUMENTO = [
    {
        'codigo': 'BORRADOR',
        'nombre': 'Borrador',
        'modulo': 'operations',
        'documento_tipo': None,
        'es_final': False,
    },
    {
        'codigo': 'PENDIENTE',
        'nombre': 'Pendiente',
        'modulo': 'operations',
        'documento_tipo': None,
        'es_final': False,
    },
    {
        'codigo': 'APROBADO',
        'nombre': 'Aprobado',
        'modulo': 'operations',
        'documento_tipo': None,
        'es_final': False,
    },
    {
        'codigo': 'RECHAZADO',
        'nombre': 'Rechazado',
        'modulo': 'operations',
        'documento_tipo': None,
        'es_final': True,
    },
    {
        'codigo': 'EN_TRANSITO',
        'nombre': 'En tránsito',
        'modulo': 'operations',
        'documento_tipo': 'TRASLADO',
        'es_final': False,
    },
    {
        'codigo': 'CERRADO',
        'nombre': 'Cerrado',
        'modulo': 'operations',
        'documento_tipo': None,
        'es_final': True,
    },
    {
        'codigo': 'ANULADO',
        'nombre': 'Anulado',
        'modulo': 'operations',
        'documento_tipo': None,
        'es_final': True,
    },
]
