(function () {
  'use strict';

  var API = window.BodegaAPI;
  var UI = window.BodegaUI;

  var screens = {};
  var sidebar = document.getElementById('sidebar');
  var sidebarToggle = document.getElementById('sidebarToggle');
  var topbarTitle = document.getElementById('topbarTitle');
  var topbarMeta = document.getElementById('topbarMeta');
  var confirmBackdrop = document.getElementById('confirmBackdrop');
  var toastContainer = document.getElementById('toastContainer');
  var routerReady = false;

  function registerScreens() {
    screens = {};
    document.querySelectorAll('.screen[id^="screen-"]').forEach(function (el) {
      screens[el.id.replace('screen-', '')] = el;
    });
  }

  registerScreens();

  var titles = {
    dashboard: ['Dashboard', 'Centro de mando · inventario'],
    movimientos: ['Movimientos', 'Historial de stock'],
    'movimiento-detalle': ['Detalle de movimiento', 'MOV-0047'],
    recepcion: ['Recepción de mercancía', 'Documento REC-0089'],
    despacho: ['Despacho / entrega', 'Documento DES-0034'],
    traslado: ['Traslado entre ubicaciones', 'Documento TRA-0012'],
    ajuste: ['Ajuste de inventario', 'Documento AJU-0005'],
    productos: ['Catálogo de productos', 'Maestro de artículos']
  };

  var currentScreenId = null;
  var syncingHash = false;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function parseRoute() {
    return (location.hash || '#dashboard').replace(/^#/, '');
  }

  function updateChrome(id) {
    document.querySelectorAll('.nav-item[data-screen]').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-screen') === id);
    });
    var t = titles[id] || ['BodegaX', ''];
    if (topbarTitle) topbarTitle.textContent = t[0];
    if (topbarMeta) topbarMeta.textContent = t[1];
    if (sidebar) sidebar.classList.remove('open');
  }

  function playEnterAnimation(el) {
    if (!el || prefersReducedMotion) return;
    el.classList.remove('screen--enter');
    void el.offsetWidth;
    el.classList.add('screen--enter');
    el.addEventListener('animationend', function onEnd() {
      el.classList.remove('screen--enter');
      el.removeEventListener('animationend', onEnd);
    });
  }

  function syncHash(id, replace) {
    if (syncingHash) return;
    syncingHash = true;
    try {
      if (replace) {
        history.replaceState({ screen: id }, '', '#' + id);
      } else {
        history.pushState({ screen: id }, '', '#' + id);
      }
    } catch (_) {
      location.hash = id;
    }
    syncingHash = false;
  }

  function showScreen(id, options) {
    options = options || {};
    if (!screens[id]) registerScreens();
    if (!screens[id]) return;
    if (id === currentScreenId && !options.force) return;

    var next = screens[id];
    var prev = currentScreenId ? screens[currentScreenId] : null;

    if (prev && prev !== next) {
      prev.classList.remove('active', 'screen--enter');
      prev.setAttribute('aria-hidden', 'true');
    }

    Object.keys(screens).forEach(function (key) {
      var el = screens[key];
      var isActive = key === id;
      el.classList.toggle('active', isActive);
      el.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    currentScreenId = id;
    updateChrome(id);
    if (prev && prev !== next) playEnterAnimation(next);

    if (!options.skipHash) {
      syncHash(id, options.replaceHash === true);
    }

    var content = document.querySelector('.content');
    if (content) content.scrollTop = 0;
  }

  function navigate(id, options) {
    options = options || {};
    if (!id) return;
    if (!screens[id]) registerScreens();
    if (!screens[id]) return;
    showScreen(id, {
      replaceHash: options.replaceHash === true,
      skipHash: options.skipHash === true,
      force: options.force === true
    });
  }

  function onNavClick(e) {
    var screenEl = e.target.closest('[data-screen]');
    if (screenEl) {
      e.preventDefault();
      e.stopPropagation();
      navigate(screenEl.getAttribute('data-screen'));
      return;
    }
    var gotoEl = e.target.closest('[data-goto]');
    if (gotoEl && !gotoEl.disabled) {
      e.preventDefault();
      e.stopPropagation();
      navigate(gotoEl.getAttribute('data-goto'));
    }
  }

  function initRouter() {
    if (routerReady) return;
    routerReady = true;
    registerScreens();
    document.addEventListener('click', onNavClick, true);
    document.addEventListener('bodega:navigate', function (e) {
      if (e.detail && e.detail.id) navigate(e.detail.id);
    });
  }

  initRouter();
  window.BodegaShell = { navigate: navigate, showScreen: showScreen };

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
  }

  document.querySelectorAll('.action-menu').forEach(function (menu) {
    var btn = menu.querySelector('[data-action-menu]');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.querySelectorAll('.action-menu.open').forEach(function (m) {
        if (m !== menu) m.classList.remove('open');
      });
      menu.classList.toggle('open');
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.action-menu.open').forEach(function (m) {
      m.classList.remove('open');
    });
  });

  document.querySelectorAll('.qty-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement.querySelector('.input');
      if (!input || input.disabled) return;
      var val = parseInt(input.value, 10) || 0;
      input.value = btn.getAttribute('data-qty') === '+' ? val + 1 : Math.max(0, val - 1);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  document.querySelectorAll('.tab-list[data-tabs]').forEach(function (list) {
    var group = list.getAttribute('data-tabs');
    list.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabId = btn.getAttribute('data-tab');
        list.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('[data-tab-group="' + group + '"]').forEach(function (p) {
          p.classList.remove('active');
        });
        btn.classList.add('active');
        var panel = document.getElementById(tabId);
        if (panel) panel.classList.add('active');
      });
    });
  });

  window.showToast = function (msg, type) {
    if (!toastContainer) return;
    var t = document.createElement('div');
    t.className = 'toast' + (type === 'warn' ? ' toast-warn' : type === 'danger' ? ' toast-danger' : '');
    t.setAttribute('role', 'status');
    t.textContent = msg;
    toastContainer.appendChild(t);
    setTimeout(function () {
      t.classList.add('toast-out');
      setTimeout(function () { t.remove(); }, 200);
    }, 3500);
  };

  document.querySelectorAll('[data-toast]:not([data-action-loading])').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.classList.contains('btn-loading')) return;
      showToast(btn.getAttribute('data-toast'), btn.getAttribute('data-toast-type'));
    });
  });

  document.querySelectorAll('[data-confirm-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (confirmBackdrop) {
        confirmBackdrop.classList.add('open');
        var cancel = confirmBackdrop.querySelector('[data-confirm-close].btn-secondary');
        if (cancel) cancel.focus();
      }
    });
  });

  document.querySelectorAll('[data-confirm-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (confirmBackdrop) confirmBackdrop.classList.remove('open');
    });
  });

  if (confirmBackdrop) {
    confirmBackdrop.addEventListener('click', function (e) {
      if (e.target === confirmBackdrop) confirmBackdrop.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && confirmBackdrop.classList.contains('open')) {
        confirmBackdrop.classList.remove('open');
      }
    });
  }

  document.querySelectorAll('[data-action-loading]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.classList.contains('btn-loading')) return;
      btn.classList.add('btn-loading');
      btn.setAttribute('aria-busy', 'true');
      setTimeout(function () {
        btn.classList.remove('btn-loading');
        btn.removeAttribute('aria-busy');
        var toastMsg = btn.getAttribute('data-toast');
        if (toastMsg) showToast(toastMsg, btn.getAttribute('data-toast-type'));
      }, 900);
    });
  });

  function wrapTableState(html, regionEl) {
    var cols = regionEl.getAttribute('data-colspan') || '6';
    return '<tr class="table-state-row"><td colspan="' + cols + '">' + html + '</td></tr>';
  }

  function loadRegion(regionEl, loader, onRetry) {
    if (!regionEl) return Promise.resolve();
    var isTable = regionEl.tagName === 'TBODY';
    var loadingHtml = isTable
      ? wrapTableState(UI.loadingState(regionEl.getAttribute('data-loading-label')), regionEl)
      : UI.loadingState(regionEl.getAttribute('data-loading-label'));
    UI.setRegionState(regionEl, 'loading', loadingHtml);
    return loader().then(function (html) {
      var content = isTable && html.indexOf('<tr') !== 0 && html.indexOf('empty-state') !== -1
        ? wrapTableState(html, regionEl)
        : isTable && html.indexOf('error-state') !== -1
          ? wrapTableState(html, regionEl)
          : html;
      UI.setRegionState(regionEl, 'data', content);
      UI.bindRowLinks(regionEl);
    }).catch(function (err) {
      var errHtml = UI.errorState({ desc: err.message || 'Error de conexión.' });
      UI.setRegionState(regionEl, 'error', isTable ? wrapTableState(errHtml, regionEl) : errHtml);
      var retry = regionEl.querySelector('[data-retry]');
      if (retry) {
        retry.addEventListener('click', function () {
          if (onRetry) onRetry();
          else loadRegion(regionEl, loader, onRetry);
        });
      }
    });
  }

  function hydrateDashboard() {
    var activityBody = document.querySelector('[data-region="dashboard-activity"]');
    var alertsList = document.querySelector('[data-region="dashboard-alerts"]');
    var pendingBody = document.querySelector('[data-region="dashboard-pending"]');

    return API.api(API.endpoints.dashboard).then(function (data) {
      if (activityBody) {
        var rows = data.activity.map(function (m) { return UI.renderMovementRow(m, true); }).join('');
        UI.setRegionState(activityBody, 'data', rows);
        UI.bindRowLinks(activityBody);
      }
      if (alertsList) {
        alertsList.innerHTML = data.alerts.map(UI.renderAlert).join('');
      }
      if (pendingBody) {
        var docs = data.pendingDocs.map(UI.renderPendingDocRow).join('');
        UI.setRegionState(pendingBody, 'data', docs);
        UI.bindRowLinks(pendingBody);
      }
    }).catch(function (err) {
      [activityBody, pendingBody].forEach(function (el) {
        if (!el) return;
        var errHtml = wrapTableState(UI.errorState({ desc: err.message }), el);
        UI.setRegionState(el, 'error', errHtml);
        var retry = el.querySelector('[data-retry]');
        if (retry) retry.addEventListener('click', hydrateDashboard);
      });
    });
  }

  function getMovimientoFilters() {
    var screen = document.getElementById('screen-movimientos');
    if (!screen) return {};
    var search = screen.querySelector('[data-filter="q"]');
    var type = screen.querySelector('[data-filter="type"]');
    return {
      q: search ? search.value.trim() : '',
      type: type ? type.value : 'Todos'
    };
  }

  function loadMovimientos() {
    var tbody = document.querySelector('[data-region="movimientos-table"]');
    var info = document.querySelector('[data-region="movimientos-pagination"]');
    if (!tbody) return Promise.resolve();

    return loadRegion(tbody, function () {
      return API.api(API.endpoints.movements, { params: getMovimientoFilters() }).then(function (res) {
        if (!res.items.length) {
          return wrapTableState(UI.emptyState({
            title: 'Sin movimientos',
            desc: 'Ningún registro coincide con los filtros. Ajuste la búsqueda o el rango de fechas.',
            actionLabel: 'Limpiar filtros'
          }), tbody);
        }
        if (info) {
          info.textContent = UI.paginationInfo(1, res.items.length, res.total, 'movimientos');
        }
        return res.items.map(function (m) { return UI.renderMovementRow(m, false); }).join('');
      });
    }, loadMovimientos).then(function () {
      var emptyBtn = tbody.querySelector('[data-empty-action]');
      if (emptyBtn) {
        emptyBtn.addEventListener('click', function () {
          var screen = document.getElementById('screen-movimientos');
          var search = screen && screen.querySelector('[data-filter="q"]');
          var type = screen && screen.querySelector('[data-filter="type"]');
          if (search) search.value = '';
          if (type) type.value = 'Todos';
          loadMovimientos();
        });
      }
    });
  }

  function getProductoFilters() {
    var screen = document.getElementById('screen-productos');
    if (!screen) return {};
    return {
      q: (screen.querySelector('[data-filter="q"]') || {}).value || '',
      category: (screen.querySelector('[data-filter="category"]') || {}).value || 'Todas',
      stockStatus: (screen.querySelector('[data-filter="stock"]') || {}).value || 'Todos'
    };
  }

  function loadProductos() {
    var tbody = document.querySelector('[data-region="productos-table"]');
    var info = document.querySelector('[data-region="productos-pagination"]');
    if (!tbody) return Promise.resolve();

    return loadRegion(tbody, function () {
      return API.api(API.endpoints.products, { params: getProductoFilters() }).then(function (res) {
        if (!res.items.length) {
          return wrapTableState(UI.emptyState({
            title: 'Sin productos',
            desc: 'No hay artículos que coincidan con los criterios de búsqueda.',
            actionLabel: 'Limpiar filtros'
          }), tbody);
        }
        if (info) {
          info.textContent = UI.paginationInfo(1, res.items.length, res.total, 'productos');
        }
        return res.items.map(UI.renderProductRow).join('');
      });
    }, loadProductos).then(function () {
      var emptyBtn = tbody.querySelector('[data-empty-action]');
      if (emptyBtn) {
        emptyBtn.addEventListener('click', function () {
          var screen = document.getElementById('screen-productos');
          ['q', 'category', 'stock'].forEach(function (key) {
            var el = screen && screen.querySelector('[data-filter="' + key + '"]');
            if (!el) return;
            el.value = el.tagName === 'SELECT' ? el.options[0].value : '';
          });
          loadProductos();
        });
      }
    });
  }

  function bindFilters(screenId, loadFn) {
    var screen = document.getElementById('screen-' + screenId);
    if (!screen || !UI || !UI.debounce) return;
    var debounced = UI.debounce(loadFn, 320);
    screen.querySelectorAll('[data-filter]').forEach(function (el) {
      el.addEventListener('input', debounced);
      el.addEventListener('change', debounced);
    });
    var filterBtn = screen.querySelector('[data-filter-submit]');
    if (filterBtn) filterBtn.addEventListener('click', loadFn);
  }

  if (UI && UI.bindRowLinks) UI.bindRowLinks(document);

  if (API && UI) {
    bindFilters('movimientos', loadMovimientos);
    bindFilters('productos', loadProductos);
    hydrateDashboard();
    loadMovimientos();
    loadProductos();
  }

  function bootRoute() {
    registerScreens();
    var route = parseRoute();
    if (!screens[route]) route = 'dashboard';
    showScreen(route, {
      skipHash: false,
      replaceHash: true,
      force: true
    });
  }

  bootRoute();

  window.addEventListener('hashchange', function () {
    if (syncingHash) return;
    var route = parseRoute();
    if (screens[route]) showScreen(route, { skipHash: true, force: true });
  });

  window.addEventListener('popstate', function (e) {
    var route = (e.state && e.state.screen) || parseRoute();
    if (screens[route]) showScreen(route, { skipHash: true, force: true });
  });
})();
