/**
 * BodegaX — capa de datos / API
 * Sustituir mockFetch por fetch real apuntando a BASE_URL en producción.
 */
(function (global) {
  'use strict';

  var BASE_URL = global.BODEGA_API_BASE || '/api/v1';
  var MOCK_DELAY = 280;

  var STATUS_BADGE = {
    confirmado: 'success',
    borrador: 'warn',
    pendiente: 'warn',
    revision: 'neutral',
    en_proceso: 'info',
    anulado: 'danger',
    en_stock: 'success',
    stock_bajo: 'warn',
    agotado: 'danger'
  };

  var STATUS_LABEL = {
    confirmado: 'Confirmado',
    borrador: 'Borrador',
    pendiente: 'Pendiente',
    revision: 'Revisión',
    en_proceso: 'En proceso',
    anulado: 'Anulado',
    en_stock: 'En stock',
    stock_bajo: 'Stock bajo',
    agotado: 'Agotado'
  };

  var MOVEMENTS = [
    { id: 'MOV-0047', type: 'Entrada', doc: 'REC-0089', sku: 'SKU-004821', product: 'Tornillo hex M8×25', qty: 120, location: 'A-03-02', status: 'confirmado', date: '28/06 09:42', time: '09:42' },
    { id: 'MOV-0046', type: 'Salida', doc: 'DES-0034', sku: 'SKU-006002', product: 'Canaleta 40×25mm', qty: -80, location: 'C-01-02', status: 'confirmado', date: '28/06 09:18', time: '09:18' },
    { id: 'MOV-0045', type: 'Ajuste', doc: 'AJU-0005', sku: 'SKU-005110', product: 'Manilla acero inox', qty: -2, location: 'B-12-04', status: 'pendiente', date: '28/06 08:55', time: '08:55' },
    { id: 'MOV-0044', type: 'Entrada', doc: 'REC-0087', sku: 'SKU-006001', product: 'Cable UTP Cat6 305m', qty: 48, location: 'C-01-01', status: 'confirmado', date: '28/06 08:30', time: '08:30' },
    { id: 'MOV-0043', type: 'Transferencia', doc: 'TRA-0012', sku: 'SKU-005101', product: 'Bisagra industrial 80mm', qty: 15, location: 'B-12-01 → B-14-02', status: 'en_proceso', date: '28/06 08:12', time: '08:12', qtyDisplay: '±15' },
    { id: 'MOV-0042', type: 'Salida', doc: 'DES-0033', sku: 'SKU-004830', product: 'Tuerca autobloc. M8', qty: -30, location: 'A-04-01', status: 'confirmado', date: '28/06 07:48', time: '07:48' },
    { id: 'MOV-0041', type: 'Entrada', doc: 'REC-0086', sku: 'SKU-004822', product: 'Arandela plana M8', qty: 200, location: 'A-03-03', status: 'confirmado', date: '27/06 16:20', time: '16:20' }
  ];

  var PRODUCTS = [
    { sku: 'SKU-004821', name: 'Tornillo hex M8×25', sub: 'Ferretería · unidad', category: 'Ferretería', stock: 1240, min: 200, location: 'A-03-02', status: 'en_stock', lastMove: '28/06' },
    { sku: 'SKU-004830', name: 'Tuerca autobloc. M8', sub: 'Ferretería · unidad', category: 'Ferretería', stock: 45, min: 100, location: 'A-04-01', status: 'stock_bajo', lastMove: '28/06' },
    { sku: 'SKU-005101', name: 'Bisagra industrial 80mm', sub: 'Herrajes · unidad', category: 'Herrajes', stock: 0, min: 50, location: 'B-12-01', status: 'agotado', lastMove: '27/06' },
    { sku: 'SKU-006001', name: 'Cable UTP Cat6 305m', sub: 'Eléctrico · rollo', category: 'Eléctrico', stock: 12, min: 5, location: 'C-01-01', status: 'en_stock', lastMove: '28/06' },
    { sku: 'SKU-006002', name: 'Canaleta 40×25mm', sub: 'Eléctrico · metro', category: 'Eléctrico', stock: 480, min: 100, location: 'C-01-02', status: 'en_stock', lastMove: '28/06' },
    { sku: 'SKU-007001', name: 'Pintura epoxi gris 4L', sub: 'Pinturas · galón', category: 'Pinturas', stock: 34, min: 20, location: 'D-05-01', status: 'stock_bajo', lastMove: '26/06' }
  ];

  var PENDING_DOCS = [
    { id: 'REC-0089', type: 'Recepción', status: 'borrador', screen: 'recepcion' },
    { id: 'DES-0034', type: 'Despacho', status: 'en_proceso', screen: 'despacho' },
    { id: 'TRA-0012', type: 'Traslado', status: 'pendiente', screen: 'traslado' },
    { id: 'AJU-0005', type: 'Ajuste', status: 'revision', screen: 'ajuste' }
  ];

  var ALERTS = [
    { level: 'warn', title: 'Stock bajo', text: 'Tuerca autobloc. M8 — 45 uds · mín. 100' },
    { level: 'danger', title: 'Agotado', text: 'Bisagra industrial 80mm — 0 uds' },
    { level: 'warn', title: 'Stock bajo', text: 'Manilla acero inox — 78 uds · mín. 150' },
    { level: 'danger', title: 'Agotado', text: 'Toma schuko empotrable — 0 uds' }
  ];

  var DASHBOARD_KPIS = {
    stockTotal: { value: '24.680', label: 'Unidades en bodega principal' },
    skusActive: { value: '1.247', label: '842 con movimiento este mes' },
    pending: { value: '18', label: 'Documentos por confirmar' },
    alerts: { value: '7', label: 'Stock bajo o agotado' }
  };

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function mockFetch(endpoint, options) {
    options = options || {};
    var simulateError = global.BODEGA_SIMULATE_ERROR === true;

    return delay(MOCK_DELAY).then(function () {
      if (simulateError) {
        var err = new Error('No se pudo conectar con el servidor de inventario.');
        err.code = 'NETWORK_ERROR';
        throw err;
      }

      switch (endpoint) {
        case '/dashboard':
          return { kpis: DASHBOARD_KPIS, activity: MOVEMENTS.slice(0, 5), alerts: ALERTS, pendingDocs: PENDING_DOCS };
        case '/movements':
          return filterMovements(options.params || {});
        case '/products':
          return filterProducts(options.params || {});
        default:
          if (endpoint.indexOf('/movements/') === 0) {
            var id = endpoint.split('/').pop();
            return MOVEMENTS.find(function (m) { return m.id === id; }) || null;
          }
          return null;
      }
    });
  }

  function filterMovements(params) {
    var q = (params.q || '').toLowerCase();
    var type = params.type || 'Todos';
    var rows = MOVEMENTS.filter(function (m) {
      if (type !== 'Todos' && m.type !== type) return false;
      if (!q) return true;
      return [m.id, m.doc, m.sku, m.product, m.type].join(' ').toLowerCase().indexOf(q) !== -1;
    });
    return { items: rows, total: 248, page: 1, pageSize: 7 };
  }

  function filterProducts(params) {
    var q = (params.q || '').toLowerCase();
    var category = params.category || 'Todas';
    var stockStatus = params.stockStatus || 'Todos';
    var rows = PRODUCTS.filter(function (p) {
      if (category !== 'Todas' && p.category !== category) return false;
      if (stockStatus === 'En stock' && p.status !== 'en_stock') return false;
      if (stockStatus === 'Stock bajo' && p.status !== 'stock_bajo') return false;
      if (stockStatus === 'Agotado' && p.status !== 'agotado') return false;
      if (!q) return true;
      return [p.sku, p.name, p.category].join(' ').toLowerCase().indexOf(q) !== -1;
    });
    return { items: rows, total: 1247, page: 1, pageSize: rows.length };
  }

  function formatQty(m) {
    if (m.qtyDisplay) return m.qtyDisplay;
    return (m.qty > 0 ? '+' : '') + m.qty;
  }

  function formatStock(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /**
   * Punto de entrada único — reemplazar mockFetch por fetch en integración real:
   *
   * async function api(endpoint, options) {
   *   const res = await fetch(BASE_URL + endpoint, { ...options, headers: { Authorization: ... } });
   *   if (!res.ok) throw new ApiError(res);
   *   return res.json();
   * }
   */
  function api(endpoint, options) {
    return mockFetch(endpoint, options);
  }

  global.BodegaAPI = {
    BASE_URL: BASE_URL,
    STATUS_BADGE: STATUS_BADGE,
    STATUS_LABEL: STATUS_LABEL,
    api: api,
    formatQty: formatQty,
    formatStock: formatStock,
    endpoints: {
      dashboard: '/dashboard',
      movements: '/movements',
      movement: function (id) { return '/movements/' + id; },
      products: '/products'
    }
  };
})(window);
