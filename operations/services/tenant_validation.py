from decimal import Decimal

from inventory.models import Lote, Producto, Serie
from inventory.services.lote_service import LoteService
from inventory.services.serie_service import SerieService
from operations.services.exceptions import (
    EmpresaInconsistenteError,
    ObjetoEmpresaInvalidoError,
)


def validar_usuario_empresa(usuario, empresa_id) -> None:
    if usuario.empresa_id != empresa_id:
        raise EmpresaInconsistenteError(
            'El usuario no pertenece a la empresa del documento.'
        )


def validar_objetos_misma_empresa(empresa_id, *objetos, etiquetas=None) -> None:
    etiquetas = etiquetas or []
    for indice, obj in enumerate(objetos):
        if obj is None:
            continue
        obj_empresa_id = getattr(obj, 'empresa_id', None)
        if obj_empresa_id is None:
            continue
        if obj_empresa_id != empresa_id:
            etiqueta = etiquetas[indice] if indice < len(etiquetas) else 'objeto'
            raise ObjetoEmpresaInvalidoError(
                f'{etiqueta} no pertenece a la empresa del documento.'
            )


def validar_serie_producto(producto, serie) -> None:
    if serie is None:
        return
    if serie.producto_id != producto.id:
        raise ObjetoEmpresaInvalidoError(
            'La serie no corresponde al producto del detalle.'
        )
    if serie.empresa_id != producto.empresa_id:
        raise ObjetoEmpresaInvalidoError(
            'La serie no pertenece a la empresa del producto.'
        )


def validar_detalle_operacion(
    empresa_id: int,
    producto: Producto,
    *,
    serie: Serie | None = None,
    lote: Lote | None = None,
    cantidad: Decimal | None = None,
    bodega=None,
    proveedor=None,
) -> None:
    validar_objetos_misma_empresa(
        empresa_id,
        producto,
        serie,
        lote,
        bodega,
        proveedor,
        etiquetas=['producto', 'serie', 'lote', 'bodega', 'proveedor'],
    )
    validar_serie_producto(producto, serie)
    SerieService.validar_tipo_control_serie(producto, serie, lote)
    LoteService.validar_tipo_control_lote(producto, lote, serie)
    if cantidad is not None:
        SerieService.validar_cantidad_serializada(producto, cantidad)


def validar_compra_detalle_serializado(
    producto: Producto,
    cantidad: Decimal,
    numero_serie: str | None = None,
) -> None:
    if producto.tipo_control_inventario.codigo != 'SERIALIZADO':
        return
    if not numero_serie:
        raise ObjetoEmpresaInvalidoError(
            'Producto serializado requiere numero_serie en el detalle.'
        )
    if cantidad != Decimal('1'):
        raise ObjetoEmpresaInvalidoError(
            'Producto serializado requiere cantidad 1 en el detalle.'
        )
