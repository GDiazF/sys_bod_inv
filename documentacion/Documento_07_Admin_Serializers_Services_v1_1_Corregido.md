Documento 07
Admin, Serializers y Services
Guía de estructura técnica

| Archivo | Formato |
| --- | --- |
| output/Documento_07_Admin_Serializers_Services.md | Markdown |

# Documento 07 — Admin, Serializers y Services
Este documento define la estructura recomendada para `admin.py`, `serializers.py` y `services.py` por app. La idea es mantener los modelos limpios, la validación en serializers y la lógica de negocio en servicios.
## Principios
- `models.py`: estructura y reglas de integridad.
- `serializers.py`: validación de entrada y salida para API.
- `services.py`: lógica de negocio, transacciones y reglas de inventario.
- `admin.py`: registro y configuración básica del backoffice.
- Las vistas deben ser delgadas.
## Estructura recomendada
### core
- `admin.py`: EmpresaAdmin, SucursalAdmin, BodegaAdmin, CentroCostoAdmin, ParametroEmpresaAdmin.
- `serializers.py`: EmpresaSerializer, SucursalSerializer, BodegaSerializer, CentroCostoSerializer, ParametroEmpresaSerializer.
- `services.py`: EmpresaService, SucursalService, BodegaService, CentroCostoService.
### security
- `admin.py`: UsuarioAdmin, RolAdmin, PermisoAdmin, UsuarioRolAdmin, RolPermisoAdmin.
- `serializers.py`: UsuarioSerializer, RolSerializer, PermisoSerializer, UsuarioRolSerializer, RolPermisoSerializer.
- `services.py`: AuthService, UsuarioService, RolService, PermisoService, AccessControlService.
### catalogs
- `admin.py`: CategoriaAdmin, MarcaAdmin, UnidadMedidaAdmin, TipoControlInventarioAdmin, EstadoSerieAdmin, TipoMovimientoInventarioAdmin.
- `serializers.py`: CategoriaSerializer, MarcaSerializer, UnidadMedidaSerializer, TipoControlInventarioSerializer, EstadoSerieSerializer, TipoMovimientoInventarioSerializer.
- `services.py`: CatalogoService, EstadoSerieService, TipoMovimientoService.
### inventory
- `admin.py`: ProductoAdmin, SerieAdmin, LoteAdmin, StockActualAdmin, MovimientoInventarioAdmin, UbicacionBodegaAdmin, CustodioAdmin.
- `serializers.py`: ProductoSerializer, SerieSerializer, LoteSerializer, StockActualSerializer, MovimientoInventarioSerializer, UbicacionBodegaSerializer, CustodioSerializer.
- `services.py`: ProductoService, SerieService, LoteService, StockService, MovimientoInventarioService, ValorizacionService.
### operations
- `admin.py`: SolicitudAdmin, SolicitudDetalleAdmin, EntregaAdmin, EntregaDetalleAdmin, TrasladoAdmin, TrasladoDetalleAdmin, EstadoHistorialDocumentoAdmin.
- `serializers.py`: SolicitudSerializer, SolicitudDetalleSerializer, EntregaSerializer, EntregaDetalleSerializer, TrasladoSerializer, TrasladoDetalleSerializer, EstadoHistorialDocumentoSerializer.
- `services.py`: SolicitudService, EntregaService, TrasladoService, HistorialDocumentoService.
### support
- `admin.py`: NumeradorAdmin, AdjuntoAdmin.
- `serializers.py`: NumeradorSerializer, AdjuntoSerializer.
- `services.py`: NumeradorService, AdjuntoService, FileStorageService.
## Regla de diseño
La validación simple puede vivir en serializers, pero toda operación que afecte stock, series, traslados o reversas debe ejecutarse en services con transacciones.
## Orden de implementación
1. Registrar modelos en admin.
2. Crear serializers base.
3. Implementar servicios de inventario.
4. Conectar vistas y endpoints.
5. Agregar tests de reglas de negocio.
## Recomendación práctica
Para este sistema, el primer foco debe ser `inventory.services`, porque ahí vive la lógica más delicada: entradas, salidas, traslados, reversas, stock y costeo.