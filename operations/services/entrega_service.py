from datetime import date
from decimal import Decimal

from django.db import transaction

from core.models import Bodega, CentroCosto, Empresa
from inventory.models import Lote, Producto, Serie
from inventory.services.movimiento_inventario_service import (
    MovimientoInventarioService,
    MovimientoInput,
)
from inventory.services.stock_service import StockService
from operations.models import Entrega, EntregaDetalle, Solicitud
from operations.services.documento_anulacion_service import DocumentoAnulacionService
from operations.services.documento_estado_service import DocumentoEstadoService
from operations.services.exceptions import (
    CantidadExcedeAprobadaError,
    DocumentoNoAprobadoError,
    DocumentoSinDetalleError,
)
from operations.services.historial_documento_service import HistorialDocumentoService
from operations.services.solicitud_service import SolicitudService
from operations.services.tenant_validation import (
    validar_detalle_operacion,
    validar_objetos_misma_empresa,
    validar_usuario_empresa,
)
from security.models import Usuario
from support.services.numerador_service import NumeradorService


class EntregaService:
    @staticmethod
    def _buscar_detalle_solicitud(solicitud: Solicitud, detalle: EntregaDetalle):
        qs = solicitud.detalles.filter(producto_id=detalle.producto_id)
        if detalle.serie_id:
            return qs.filter(serie_id=detalle.serie_id).first()
        if detalle.lote_id:
            return qs.filter(lote_id=detalle.lote_id).first()
        candidatos = qs.filter(serie__isnull=True, lote__isnull=True)
        if candidatos.count() == 1:
            return candidatos.first()
        return None

    @staticmethod
    def _validar_lineas_genericas_producto(
        solicitud: Solicitud,
        producto_id: int,
        detalles_entrega: list[EntregaDetalle],
        consumo_por_linea: dict[int, Decimal],
    ) -> None:
        # Flujo normal: crear_desde_solicitud genera una línea de entrega por línea de
        # solicitud (1:1). Esta validación greedy aplica cuando hay varias líneas genéricas
        # del mismo producto y no hay match único por serie/lote: reparte cantidades en
        # orden de línea sin exceder el aprobado de cada una. No exige 1:1 estricto por
        # detalle de entrega para permitir entregas parciales agregadas.
        lineas_sol = list(
            solicitud.detalles.filter(
                producto_id=producto_id,
                serie__isnull=True,
                lote__isnull=True,
            ).order_by('pk')
        )
        if not lineas_sol:
            raise CantidadExcedeAprobadaError(
                f'No existe línea de solicitud correspondiente para producto id {producto_id}.'
            )

        for detalle in detalles_entrega:
            restante = detalle.cantidad_entregada
            for linea in lineas_sol:
                cap = linea.cantidad_aprobada or linea.cantidad_solicitada
                usado = consumo_por_linea.get(linea.pk, Decimal('0'))
                disponible = cap - usado
                if disponible <= 0:
                    continue
                asignar = min(restante, disponible)
                consumo_por_linea[linea.pk] = usado + asignar
                restante -= asignar
                if restante <= 0:
                    break
            if restante > 0:
                raise CantidadExcedeAprobadaError(
                    f'Cantidad entregada excede aprobada para producto id {producto_id}.'
                )

    @staticmethod
    def _validar_entrega_contra_solicitud(entrega: Entrega) -> None:
        if not entrega.solicitud_id:
            return

        solicitud = entrega.solicitud
        consumo_por_linea: dict[int, Decimal] = {}
        genericas_por_producto: dict[int, list[EntregaDetalle]] = {}

        for detalle in entrega.detalles.all():
            sol_det = EntregaService._buscar_detalle_solicitud(solicitud, detalle)
            if sol_det is not None:
                aprobada = sol_det.cantidad_aprobada or sol_det.cantidad_solicitada
                consumo_por_linea[sol_det.pk] = (
                    consumo_por_linea.get(sol_det.pk, Decimal('0')) + detalle.cantidad_entregada
                )
                if consumo_por_linea[sol_det.pk] > aprobada:
                    raise CantidadExcedeAprobadaError(
                        f'Cantidad entregada excede aprobada para {detalle.producto.sku}.'
                    )
                continue

            if detalle.serie_id or detalle.lote_id:
                raise CantidadExcedeAprobadaError(
                    f'No existe línea de solicitud correspondiente para {detalle.producto.sku}.'
                )

            genericas_por_producto.setdefault(detalle.producto_id, []).append(detalle)

        for producto_id, detalles in genericas_por_producto.items():
            EntregaService._validar_lineas_genericas_producto(
                solicitud,
                producto_id,
                detalles,
                consumo_por_linea,
            )

    @staticmethod
    @transaction.atomic
    def crear_desde_solicitud(
        solicitud: Solicitud,
        bodega: Bodega,
        usuario: Usuario,
        fecha_entrega: date | None = None,
    ) -> Entrega:
        if solicitud.estado.codigo != 'APROBADO':
            raise DocumentoNoAprobadoError('La solicitud debe estar aprobada para generar entrega.')

        validar_usuario_empresa(usuario, solicitud.empresa_id)
        validar_objetos_misma_empresa(
            solicitud.empresa_id,
            bodega,
            solicitud.centro_costo,
            etiquetas=['bodega', 'centro_costo'],
        )

        numero = NumeradorService.generar_folio(solicitud.empresa, Entrega.TIPO_DOCUMENTO)
        entrega = Entrega.objects.create(
            empresa=solicitud.empresa,
            numero=numero,
            solicitud=solicitud,
            bodega=bodega,
            centro_costo=solicitud.centro_costo,
            estado=DocumentoEstadoService.obtener_estado('APROBADO'),
            fecha_entrega=fecha_entrega or date.today(),
            es_ad_hoc=False,
            created_by=usuario,
            approved_by=usuario,
            approved_at=solicitud.approved_at,
        )
        for detalle in solicitud.detalles.all():
            cantidad = detalle.cantidad_aprobada or detalle.cantidad_solicitada
            EntregaDetalle.objects.create(
                entrega=entrega,
                producto=detalle.producto,
                serie=detalle.serie,
                lote=detalle.lote,
                cantidad_entregada=cantidad,
            )
        HistorialDocumentoService.registrar(
            empresa=entrega.empresa,
            documento_tipo=Entrega.TIPO_DOCUMENTO,
            documento_id=entrega.pk,
            estado_anterior=None,
            estado_nuevo='APROBADO',
            usuario=usuario,
        )
        return entrega

    @staticmethod
    @transaction.atomic
    def crear_ad_hoc(
        empresa: Empresa,
        bodega: Bodega,
        centro_costo: CentroCosto,
        usuario: Usuario,
        fecha_entrega: date | None = None,
    ) -> Entrega:
        validar_usuario_empresa(usuario, empresa.id)
        validar_objetos_misma_empresa(
            empresa.id,
            bodega,
            centro_costo,
            etiquetas=['bodega', 'centro_costo'],
        )
        numero = NumeradorService.generar_folio(empresa, Entrega.TIPO_DOCUMENTO)
        entrega = Entrega.objects.create(
            empresa=empresa,
            numero=numero,
            bodega=bodega,
            centro_costo=centro_costo,
            estado=DocumentoEstadoService.obtener_estado('BORRADOR'),
            fecha_entrega=fecha_entrega or date.today(),
            es_ad_hoc=True,
            created_by=usuario,
        )
        HistorialDocumentoService.registrar(
            empresa=empresa,
            documento_tipo=Entrega.TIPO_DOCUMENTO,
            documento_id=entrega.pk,
            estado_anterior=None,
            estado_nuevo='BORRADOR',
            usuario=usuario,
        )
        return entrega

    @staticmethod
    @transaction.atomic
    def agregar_detalle(
        entrega: Entrega,
        producto: Producto,
        cantidad: Decimal,
        serie: Serie | None = None,
        lote: Lote | None = None,
    ) -> EntregaDetalle:
        DocumentoEstadoService.validar_editable(entrega.estado.codigo)
        validar_detalle_operacion(
            entrega.empresa_id,
            producto,
            serie=serie,
            lote=lote,
            cantidad=cantidad,
            bodega=entrega.bodega,
        )
        return EntregaDetalle.objects.create(
            entrega=entrega,
            producto=producto,
            serie=serie,
            lote=lote,
            cantidad_entregada=cantidad,
        )

    @staticmethod
    @transaction.atomic
    def enviar(entrega: Entrega, usuario: Usuario) -> Entrega:
        entrega = Entrega.objects.select_for_update().get(pk=entrega.pk)
        if not entrega.detalles.exists():
            raise DocumentoSinDetalleError('La entrega no tiene detalle.')
        estado_anterior = entrega.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            entrega, Entrega.TIPO_DOCUMENTO, 'PENDIENTE', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            entrega, Entrega.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return entrega

    @staticmethod
    @transaction.atomic
    def aprobar(entrega: Entrega, usuario: Usuario) -> Entrega:
        entrega = Entrega.objects.select_for_update().get(pk=entrega.pk)
        estado_anterior = entrega.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            entrega, Entrega.TIPO_DOCUMENTO, 'APROBADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            entrega, Entrega.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return entrega

    @staticmethod
    @transaction.atomic
    def ejecutar(entrega: Entrega, usuario: Usuario) -> Entrega:
        entrega = (
            Entrega.objects.select_for_update()
            .select_related('bodega', 'centro_costo', 'solicitud')
            .prefetch_related(
                'detalles__producto',
                'detalles__serie',
                'detalles__lote',
                'solicitud__detalles',
            )
            .get(pk=entrega.pk)
        )
        if entrega.estado.codigo != 'APROBADO':
            raise DocumentoNoAprobadoError('La entrega debe estar aprobada para ejecutarse.')
        if not entrega.detalles.exists():
            raise DocumentoSinDetalleError('La entrega no tiene detalle.')

        EntregaService._validar_entrega_contra_solicitud(entrega)

        for detalle in entrega.detalles.all():
            MovimientoInventarioService.registrar_movimiento(
                MovimientoInput(
                    empresa=entrega.empresa,
                    producto=detalle.producto,
                    tipo_movimiento_codigo='SALIDA_ENTREGA',
                    cantidad=detalle.cantidad_entregada,
                    created_by=usuario,
                    bodega_origen=entrega.bodega,
                    serie=detalle.serie,
                    lote=detalle.lote,
                    centro_costo=entrega.centro_costo,
                    referencia_tipo=Entrega.TIPO_DOCUMENTO,
                    referencia_id=str(entrega.pk),
                )
            )

        estado_anterior = entrega.estado.codigo
        DocumentoEstadoService.cambiar_estado(
            entrega, Entrega.TIPO_DOCUMENTO, 'CERRADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            entrega, Entrega.TIPO_DOCUMENTO, estado_anterior, usuario
        )

        if entrega.solicitud_id:
            SolicitudService.cerrar(entrega.solicitud, usuario)

        return entrega

    @staticmethod
    @transaction.atomic
    def anular(entrega: Entrega, usuario: Usuario) -> Entrega:
        entrega = Entrega.objects.select_for_update().get(pk=entrega.pk)
        estado_anterior = entrega.estado.codigo
        if estado_anterior == 'CERRADO':
            DocumentoAnulacionService.reversar_movimientos(
                Entrega.TIPO_DOCUMENTO,
                entrega.pk,
                usuario,
                entrega.empresa_id,
            )
        DocumentoEstadoService.cambiar_estado(
            entrega, Entrega.TIPO_DOCUMENTO, 'ANULADO', usuario
        )
        HistorialDocumentoService.registrar_cambio(
            entrega, Entrega.TIPO_DOCUMENTO, estado_anterior, usuario
        )
        return entrega
