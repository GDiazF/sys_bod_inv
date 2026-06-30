# Componentes de documento (`src/components/document/`)

Formularios y layout para recepción, despacho, traslado y ajuste. Estilos en `src/styles/document.css`.

## Preview

http://localhost:5173/dev/document

Recepción funcional (mock): http://localhost:5173/recepcion

## Componentes

| Componente | Responsabilidad |
|------------|-----------------|
| **DocLayout** | Contenedor vertical del documento |
| **FormSection** | Panel de cabecera con zona HDR/LIN |
| **FormField** | Wrapper de campo |
| **DocInfoStrip** | Meta visible (fecha, proveedor, bodega, OC) |
| **DocMetaRow** | Pie compacto dentro del panel de líneas |
| **DocSummary** | Resumen de totales |
| **QtyControl** | Stepper de cantidad (+/−/input) |

## Mocks

- `mocks/documents/types.ts` — tipos y badges de documento/línea
- `mocks/documents/recepcion.ts` — REC-0089 demo
- `mocks/documents/despacho.ts` — DES-0034 demo
- `mocks/documents/traslado.ts` — TRA-0012 demo
- `mocks/documents/ajuste.ts` — AJU-0005 demo
- `hooks/useRecepcionDocument.ts` — recepción
- `hooks/useDespachoDocument.ts` — despacho
- `hooks/useTrasladoDocument.ts` — traslado
- `hooks/useAjusteDocument.ts` — ajuste

Recepción · Despacho · Traslado · Ajuste — rutas `/recepcion`, `/despacho`, `/traslado`, `/ajuste`

## Reutilizable en Fase 8+

Despacho, Traslado y Ajuste pueden reutilizar:

- `DocLayout`, `FormSection`, `FormField`, `DocInfoStrip`, `DocSummary`
- `QtyControl` en tablas de líneas
- `ScrollableTable` con `height="doc"`
- `DOCUMENT_STATUS_BADGES`, `DOCUMENT_LINE_STATUS_BADGES`
- Patrón `useXDocument` + `DataView` + acciones loading/disabled
