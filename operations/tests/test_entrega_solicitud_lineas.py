from decimal import Decimal

import pytest

from inventory.models import Producto, Serie
from inventory.services.movimiento_inventario_service import (
    MovimientoInventarioService,
    MovimientoInput,
)
from operations.services.entrega_service import EntregaService
from operations.services.solicitud_service import SolicitudService
from operations.tests.conftest import entrada_stock


@pytest.mark.django_db
class TestEntregaSolicitudMultilinea:
    def test_ejecutar_valida_por_serie_cuando_mismo_producto(
        self,
        empresa,
        unidad,
        bodega_a,
        centro_costo,
        usuario,
        catalogos_globales,
    ):
        from catalogs.models import TipoControlInventario

        tipo_ser = TipoControlInventario.objects.get(codigo='SERIALIZADO')
        producto_ser = Producto.objects.create(
            empresa=empresa,
            sku='SER-MULTI',
            nombre='Item serializado multi',
            unidad_medida=unidad,
            tipo_control_inventario=tipo_ser,
        )
        for numero in ('SER-A-001', 'SER-A-002'):
            MovimientoInventarioService.registrar_entrada_serializada(
                MovimientoInput(
                    empresa=empresa,
                    producto=producto_ser,
                    tipo_movimiento_codigo='ENTRADA_COMPRA',
                    cantidad=Decimal('1'),
                    costo_unitario=Decimal('100'),
                    created_by=usuario,
                    bodega_destino=bodega_a,
                ),
                numero_serie=numero,
            )
        serie_a = Serie.objects.get(numero_serie='SER-A-001')
        serie_b = Serie.objects.get(numero_serie='SER-A-002')

        solicitud = SolicitudService.crear(empresa, centro_costo, usuario)
        SolicitudService.agregar_detalle(solicitud, producto_ser, Decimal('1'), serie=serie_a)
        SolicitudService.agregar_detalle(solicitud, producto_ser, Decimal('1'), serie=serie_b)
        solicitud = SolicitudService.enviar(solicitud, usuario)
        solicitud = SolicitudService.aprobar(solicitud, usuario)

        entrega = EntregaService.crear_desde_solicitud(solicitud, bodega_a, usuario)
        entrega = EntregaService.ejecutar(entrega, usuario)

        assert entrega.estado.codigo == 'CERRADO'
        serie_a.refresh_from_db()
        serie_b.refresh_from_db()
        assert serie_a.estado_serie.codigo == 'ENTREGADO'
        assert serie_b.estado_serie.codigo == 'ENTREGADO'

    def test_ejecutar_rechaza_serie_sin_linea_solicitud(
        self,
        empresa,
        unidad,
        bodega_a,
        centro_costo,
        usuario,
        catalogos_globales,
    ):
        from catalogs.models import TipoControlInventario
        from operations.services.exceptions import CantidadExcedeAprobadaError

        tipo_ser = TipoControlInventario.objects.get(codigo='SERIALIZADO')
        producto_ser = Producto.objects.create(
            empresa=empresa,
            sku='SER-MISMATCH',
            nombre='Item serializado mismatch',
            unidad_medida=unidad,
            tipo_control_inventario=tipo_ser,
        )
        for numero in ('SER-M-001', 'SER-M-002'):
            MovimientoInventarioService.registrar_entrada_serializada(
                MovimientoInput(
                    empresa=empresa,
                    producto=producto_ser,
                    tipo_movimiento_codigo='ENTRADA_COMPRA',
                    cantidad=Decimal('1'),
                    costo_unitario=Decimal('100'),
                    created_by=usuario,
                    bodega_destino=bodega_a,
                ),
                numero_serie=numero,
            )
        serie_ok = Serie.objects.get(numero_serie='SER-M-001')
        serie_extra = Serie.objects.get(numero_serie='SER-M-002')

        solicitud = SolicitudService.crear(empresa, centro_costo, usuario)
        SolicitudService.agregar_detalle(solicitud, producto_ser, Decimal('1'), serie=serie_ok)
        solicitud = SolicitudService.enviar(solicitud, usuario)
        solicitud = SolicitudService.aprobar(solicitud, usuario)

        entrega = EntregaService.crear_desde_solicitud(solicitud, bodega_a, usuario)
        detalle_incorrecto = entrega.detalles.first()
        detalle_incorrecto.serie = serie_extra
        detalle_incorrecto.save(update_fields=['serie'])

        with pytest.raises(CantidadExcedeAprobadaError):
            EntregaService.ejecutar(entrega, usuario)

    def test_ejecutar_rechaza_generico_duplicado_que_excede_por_linea(
        self,
        empresa,
        producto,
        bodega_a,
        centro_costo,
        usuario,
        catalogos_globales,
    ):
        from operations.services.exceptions import CantidadExcedeAprobadaError

        entrada_stock(empresa, producto, bodega_a, usuario, '20')

        solicitud = SolicitudService.crear(empresa, centro_costo, usuario)
        SolicitudService.agregar_detalle(solicitud, producto, Decimal('3'))
        SolicitudService.agregar_detalle(solicitud, producto, Decimal('2'))
        solicitud = SolicitudService.enviar(solicitud, usuario)
        solicitud = SolicitudService.aprobar(solicitud, usuario)

        entrega = EntregaService.crear_desde_solicitud(solicitud, bodega_a, usuario)
        detalles = list(entrega.detalles.order_by('pk'))
        detalles[0].cantidad_entregada = Decimal('3')
        detalles[0].save(update_fields=['cantidad_entregada'])
        detalles[1].cantidad_entregada = Decimal('3')
        detalles[1].save(update_fields=['cantidad_entregada'])

        with pytest.raises(CantidadExcedeAprobadaError):
            EntregaService.ejecutar(entrega, usuario)

    def test_ejecutar_multilinea_generica_1_a_1_desde_solicitud(
        self,
        empresa,
        producto,
        bodega_a,
        centro_costo,
        usuario,
        catalogos_globales,
    ):
        entrada_stock(empresa, producto, bodega_a, usuario, '20')

        solicitud = SolicitudService.crear(empresa, centro_costo, usuario)
        SolicitudService.agregar_detalle(solicitud, producto, Decimal('3'))
        SolicitudService.agregar_detalle(solicitud, producto, Decimal('2'))
        solicitud = SolicitudService.enviar(solicitud, usuario)
        solicitud = SolicitudService.aprobar(solicitud, usuario)

        entrega = EntregaService.crear_desde_solicitud(solicitud, bodega_a, usuario)
        assert entrega.detalles.count() == 2
        entrega = EntregaService.ejecutar(entrega, usuario)

        assert entrega.estado.codigo == 'CERRADO'
