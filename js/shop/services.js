/* Angebotsseite (Senior Developer 1). Zeigt shop/catalog.json; der Shop-Service berechnet jede echte Bestellung. */
(function () {
  'use strict';
  var root = document.getElementById('svc-root'), tabs = document.getElementById('svc-tabs');
  if (!root) return;
  var esc = function (s) { return window.Shop ? Shop.esc(s) : String(s); };

  function fail() {
    root.innerHTML = '<div class="svc-fail" role="alert"><p>Die Angebote konnten nicht geladen werden.</p><button type="button" class="btn svc-retry">Erneut versuchen</button></div>';
    root.querySelector('.svc-retry').addEventListener('click', function () { root.innerHTML = '<p class="svc-loading">Angebote werden geladen …</p>'; start(); });
  }
  function ready(fn) {
    if (window.Shop) return fn();
    window.addEventListener('load', function () { window.Shop ? fn() : fail(); });
  }

  function defaults(item, cat) {
    var o = {};
    (item.options || []).forEach(function (g) {
      var grp = cat.options[g]; if (!grp) return;
      var ch = allowed(item, g, grp);
      if (grp.type === 'one') { var d = ch.filter(function (c) { return c.default; })[0] || ch[0]; if (d) o[g] = d.id; }
      else o[g] = [];
    });
    return o;
  }
  function allowed(item, g, grp) {
    var ids = item.choices && item.choices[g];
    return grp.choices.filter(function (c) { return !c.soldOut && (!ids || ids.indexOf(c.id) > -1); });
  }
  function estimate(item, cat, opts, qty) {
    var t = item.price;
    (item.options || []).forEach(function (g) {
      var grp = cat.options[g], v = opts[g]; if (!grp) return;
      grp.choices.forEach(function (c) { if (grp.type === 'one' ? v === c.id : (v || []).indexOf(c.id) > -1) t += c.price; });
    });
    return t * qty;
  }
  function optLabel(p) { return p === 0 ? '' : ' (' + (p > 0 ? '+' : '−') + Shop.money(Math.abs(p)) + ')'; }

  function card(item, cat) {
    var el = document.createElement('article');
    el.className = 'svc-card'; el.id = item.id;
    var opts = defaults(item, cat), qty = 1;
    var inc = (item.includes || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    var groups = (item.options || []).map(function (g) {
      var grp = cat.options[g]; if (!grp) return '';
      var type = grp.type === 'one' ? 'radio' : 'checkbox';
      var rows = allowed(item, g, grp).map(function (c) {
        var checked = grp.type === 'one' ? opts[g] === c.id : false;
        return '<label class="svc-opt"><input type="' + type + '" name="' + item.id + '-' + g + '" value="' + esc(c.id) + '"' + (checked ? ' checked' : '') + '><span>' + esc(c.name) + esc(optLabel(c.price)) + '</span></label>';
      }).join('');
      return '<fieldset class="svc-group" data-g="' + g + '"><legend>' + esc(grp.name) + '</legend>' + rows + '</fieldset>';
    }).join('');
    el.innerHTML =
      '<div class="svc-card__head"><h3>' + esc(item.name) + '</h3>' + (item.badge ? '<span class="shop-chip shop-chip--accent">' + esc(item.badge) + '</span>' : '') + '</div>' +
      '<p class="svc-price"><span class="svc-from">' + (groups ? 'ab ' : '') + '</span>' + Shop.money(item.price) + (item.perPerson ? '<span class="svc-from"> pro ' + esc(item.unit || 'Person') + '</span>' : '') + '</p>' +
      '<p class="svc-desc">' + esc(item.desc) + '</p>' +
      (inc ? '<h4 class="svc-sub">Das ist enthalten</h4><ul class="svc-inc">' + inc + '</ul>' : '') +
      '<form class="svc-form">' + groups +
      '<div class="svc-buy">' + (item.perPerson ? '<div class="svc-qty" role="group" aria-label="Menge"><button type="button" data-d="-1" aria-label="Weniger">−</button><output aria-live="polite">1</output><button type="button" data-d="1" aria-label="Mehr">+</button></div>' : '') +
      '<p class="svc-total">' + 'Gesamt (Schätzung) <strong></strong></p><button class="btn" type="submit">In den Warenkorb</button></div></form>';
    var form = el.querySelector('form'), out = el.querySelector('output'), tot = el.querySelector('.svc-total strong');
    function read() {
      (item.options || []).forEach(function (g) {
        var grp = cat.options[g]; if (!grp) return;
        var inputs = form.querySelectorAll('[name="' + item.id + '-' + g + '"]');
        if (grp.type === 'one') { inputs.forEach(function (i) { if (i.checked) opts[g] = i.value; }); }
        else {
          var sel = []; inputs.forEach(function (i) { if (i.checked) sel.push(i.value); });
          if (grp.max && sel.length > grp.max) { var last = document.activeElement; if (last && last.checked) last.checked = false; sel = sel.slice(0, grp.max); Shop.toast('Du kannst bis zu ' + grp.max + ' Extras wählen.'); }
          opts[g] = sel;
        }
      });
      tot.textContent = Shop.money(estimate(item, cat, opts, qty));
    }
    form.addEventListener('change', read);
    (el.querySelectorAll('.svc-qty button') || []).forEach(function (b) {
      b.addEventListener('click', function () { qty = Math.min(20, Math.max(1, qty + Number(b.dataset.d))); out.textContent = qty; read(); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); read();
      Shop.addToCart({ item: item.id, qty: qty, options: JSON.parse(JSON.stringify(opts)) });
      Shop.toast(item.name + ' liegt im Warenkorb.');
      Shop.openCart();
    });
    read();
    return el;
  }

  function start() { ready(function () {
    Shop.catalog().then(function (cat) {
      root.innerHTML = '';
      var links = [];
      cat.categories.forEach(function (c) {
        var items = cat.items.filter(function (i) { return i.category === c.id && !i.soldOut; });
        if (!items.length) return;
        var sec = document.createElement('div'); sec.className = 'svc-cat'; sec.id = c.id;
        sec.innerHTML = '<h2>' + esc(c.name) + '</h2><p class="svc-blurb">' + esc(c.blurb || '') + '</p>';
        var grid = document.createElement('div'); grid.className = 'svc-grid';
        items.forEach(function (i) { grid.appendChild(card(i, cat)); });
        sec.appendChild(grid); root.appendChild(sec);
        links.push('<a href="#' + c.id + '" class="shop-chip">' + esc(c.name) + '</a>');
      });
      if (tabs) tabs.innerHTML = links.join('');
      if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
    }).catch(fail);
  }); }
  start();
})();
