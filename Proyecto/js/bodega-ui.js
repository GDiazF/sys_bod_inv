/**
 * BodegaX — helpers de renderizado y estados UI
 */
(function (global) {
  'use strict';

  var API = global.BodegaAPI;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function badge(status) {
    var key = status;
    var variant = API.STATUS_BADGE[key] || 'neutral';
    var label = API.STATUS_LABEL[key] || status;
    return '<span class="badge badge-' + variant + '">' + escapeHtml(label) + '</span>';
  }

  function emptyState(opts) {
    opts = opts || {};
    return (
      '<div class="empty-state" role="status">' +
        '<div class="empty-icon" aria-hidden="true">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>' +
          '</svg>' +
        '</div>' +
        '<div class="empty-title">' + escapeHtml(opts.title || 'Sin resultados') + '</div>' +
        '<div class="empty-desc">' + escapeHtml(opts.desc || 'No hay registros que coincidan con los filtros aplicados.') + '</div>' +
        (opts.actionLabel ? '<button type="button" class="btn btn-secondary btn-sm" data-empty-action>' + escapeHtml(opts.actionLabel) + '</button>' : '') +
      '</div>'
    );
  }

  function errorState(opts) {
    opts = opts || {};
    return (
      '<div class="error-state" role="alert">' +
        '<div class="error-icon" aria-hidden="true">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>' +
          '</svg>' +
        '</div>' +
        '<div class="error-title">' + escapeHtml(opts.title || 'Error al cargar datos') + '</div>' +
        '<div class="error-desc">' + escapeHtml(opts.desc || 'No se pudo obtener la información. Intente de nuevo.') + '</div>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-retry>' + escapeHtml(opts.retryLabel || 'Reintentar') + '</button>' +
      '</div>'
    );
  }

  function loadingState(label) {
    return (
      '<div class="loading-state" role="status" aria-live="polite">' +
        '<div class="spinner" aria-hidden="true"></div>' +
        '<div class="loading-label">' + escapeHtml(label || 'Cargando…') + '</div>' +
      '</div>'
    );
  }

  function tableSkeleton(rows, cols) {
    rows = rows || 5;
    cols = cols || 6;
    var html = '<div class="table-skeleton" aria-hidden="true">';
    for (var r = 0; r < rows; r++) {
      html += '<div class="skeleton skeleton-row"></div>';
    }
    html += '</div>';
    return html;
  }

  function setRegionState(regionEl, state, html) {
    if (!regionEl) return;
    regionEl.setAttribute('data-ui-state', state);
    if (state === 'data') {
      regionEl.innerHTML = html || regionEl.getAttribute('data-default-html') || '';
      regionEl.removeAttribute('aria-busy');
    } else {
      if (!regionEl.getAttribute('data-default-html') && state === 'loading') {
        regionEl.setAttribute('data-default-html', regionEl.innerHTML);
      }
      regionEl.innerHTML = html;
      regionEl.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
    }
  }

  function renderMovementRow(m, compact) {
    var qty = API.formatQty(m);
    var goto = ' class="row-link" data-goto="movimiento-detalle" tabindex="0" role="link"';
    if (compact) {
      return (
        '<tr' + goto + '>' +
          '<td class="mono">' + escapeHtml(m.id) + '</td>' +
          '<td>' + escapeHtml(m.type) + '</td>' +
          '<td class="mono">' + escapeHtml(m.sku) + '</td>' +
          '<td class="mono">' + escapeHtml(qty) + '</td>' +
          '<td>' + badge(m.status) + '</td>' +
          '<td class="mono">' + escapeHtml(m.time) + '</td>' +
        '</tr>'
      );
    }
    return (
      '<tr' + goto + '>' +
        '<td class="mono">' + escapeHtml(m.id) + '</td>' +
        '<td>' + escapeHtml(m.type) + '</td>' +
        '<td class="mono">' + escapeHtml(m.doc) + '</td>' +
        '<td class="mono">' + escapeHtml(m.sku) + '</td>' +
        '<td>' + escapeHtml(m.product) + '</td>' +
        '<td class="mono">' + escapeHtml(qty) + '</td>' +
        '<td class="mono">' + escapeHtml(m.location) + '</td>' +
        '<td>' + badge(m.status) + '</td>' +
        '<td class="mono">' + escapeHtml(m.date) + '</td>' +
      '</tr>'
    );
  }

  function renderProductRow(p) {
    return (
      '<tr tabindex="0">' +
        '<td class="mono">' + escapeHtml(p.sku) + '</td>' +
        '<td><div class="product-cell">' + escapeHtml(p.name) + '<span class="product-cell-sub">' + escapeHtml(p.sub) + '</span></div></td>' +
        '<td>' + escapeHtml(p.category) + '</td>' +
        '<td class="mono">' + API.formatStock(p.stock) + '</td>' +
        '<td class="mono">' + API.formatStock(p.min) + '</td>' +
        '<td class="mono">' + escapeHtml(p.location) + '</td>' +
        '<td>' + badge(p.status) + '</td>' +
        '<td class="mono">' + escapeHtml(p.lastMove) + '</td>' +
      '</tr>'
    );
  }

  function renderPendingDocRow(d) {
    return (
      '<tr class="row-link" data-goto="' + escapeHtml(d.screen) + '" tabindex="0" role="link">' +
        '<td class="mono">' + escapeHtml(d.id) + '</td>' +
        '<td>' + escapeHtml(d.type) + '</td>' +
        '<td>' + badge(d.status) + '</td>' +
      '</tr>'
    );
  }

  function renderAlert(a) {
    return (
      '<div class="alert alert-' + escapeHtml(a.level) + '">' +
        '<div><div class="alert-title">' + escapeHtml(a.title) + '</div>' + escapeHtml(a.text) + '</div>' +
      '</div>'
    );
  }

  function paginationInfo(from, to, total, noun) {
    return from + '–' + to + ' de ' + API.formatStock(total) + ' ' + (noun || 'registros');
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function bindRowLinks(root) {
    if (!root) return;
    root.querySelectorAll('.row-link[data-goto]').forEach(function (row) {
      if (row._bxBound) return;
      row._bxBound = true;
      row.addEventListener('click', function (e) {
        if (e.target.closest('button, a, input, select, textarea, label')) return;
        var target = row.getAttribute('data-goto');
        if (!target) return;
        e.preventDefault();
        if (global.BodegaShell && global.BodegaShell.navigate) {
          global.BodegaShell.navigate(target);
        } else {
          document.dispatchEvent(new CustomEvent('bodega:navigate', { detail: { id: target } }));
        }
      });
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          row.click();
        }
      });
    });
  }

  global.BodegaUI = {
    escapeHtml: escapeHtml,
    badge: badge,
    emptyState: emptyState,
    errorState: errorState,
    loadingState: loadingState,
    tableSkeleton: tableSkeleton,
    setRegionState: setRegionState,
    renderMovementRow: renderMovementRow,
    renderProductRow: renderProductRow,
    renderPendingDocRow: renderPendingDocRow,
    renderAlert: renderAlert,
    paginationInfo: paginationInfo,
    debounce: debounce,
    bindRowLinks: bindRowLinks
  };
})(window);
