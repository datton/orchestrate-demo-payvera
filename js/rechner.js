/* Gebühren- und Preisrechner (Senior Dev 5). Beispielrechnung; Preise nur aus shop/catalog.json. */
(function () {
  'use strict';
  var KEY = 'shop:payvera:rechner';
  var DEF = { umsatz: 30000, bon: 24, tische: 12, geraete: 2, qr: 35, karte: 40, ohne: 2, mit: 1.2 };
  var LIM = { umsatz: [0, 10000000], bon: [1, 10000], tische: [0, 500], geraete: [0, 20], qr: [0, 100], karte: [0, 100], ohne: [0, 10], mit: [0, 10] };
  var NAMES = { umsatz: 'Monatsumsatz', bon: 'Durchschnittlicher Bon', tische: 'Anzahl Tische', geraete: 'Anzahl Geräte', qr: 'Anteil QR', karte: 'Anteil Karte', ohne: 'Beispielgebühr ohne Paket', mit: 'Beispielgebühr mit Paket' };
  var form = document.getElementById('rc-form');
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cat = null, cur = {}, shown = {}, last = null;

  function eur(n) {
    var S = window.Shop;
    try { if (S && S.money) return S.money(Math.round(n * 100), 'EUR'); } catch (e) { /* fall through */ }
    return n.toFixed(2).replace('.', ',') + ' €';
  }
  function readNum(v) { return Number(String(v).replace(',', '.')); }

  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) Object.keys(DEF).forEach(function (k) { if (typeof s[k] === 'number') $('f-' + k).value = s[k]; }); } catch (e) { /* ignore */ }
  }
  function save(vals) { try { localStorage.setItem(KEY, JSON.stringify(vals)); } catch (e) { /* this session only */ } }

  function validate() {
    var vals = {}, ok = true;
    Object.keys(DEF).forEach(function (k) {
      var el = $('f-' + k), err = $('e-' + k), raw = el.value.trim(), n = readNum(raw), lim = LIM[k], msg = '';
      if (raw === '' || !isFinite(n)) msg = 'Bitte eine Zahl eingeben.';
      else if (n < lim[0] || n > lim[1]) msg = 'Bitte einen Wert zwischen ' + lim[0] + ' und ' + lim[1] + ' eingeben.';
      else if ((k === 'tische' || k === 'geraete') && n % 1 !== 0) msg = 'Bitte eine ganze Zahl eingeben.';
      err.textContent = msg; el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) { ok = false; el.setAttribute('aria-describedby', 'e-' + k); } else { vals[k] = n; el.removeAttribute('aria-describedby'); }
    });
    if (ok && vals.qr + vals.karte > 100) {
      $('e-karte').textContent = 'QR und Karte zusammen dürfen höchstens 100 % sein.'; $('f-karte').setAttribute('aria-invalid', 'true'); $('f-karte').setAttribute('aria-describedby', 'e-karte'); ok = false;
    }
    return ok ? vals : null;
  }

  function animate(id, to, fmt) {
    var el = $(id), from = shown[id] == null ? to : shown[id];
    shown[id] = to;
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    var t0 = performance.now(), dur = 450;
    (function tick(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1 && shown[id] === to) requestAnimationFrame(tick); else el.textContent = fmt(to);
    })(t0);
  }

  function compute(v) {
    var unbar = (v.qr + v.karte) / 100, umsatzUnbar = v.umsatz * unbar;
    var count = v.bon > 0 ? Math.round(v.umsatz / v.bon * unbar) : 0;
    var ohne = umsatzUnbar * v.ohne / 100, mit = umsatzUnbar * v.mit / 100;
    return { count: count, ohne: ohne, mit: mit, saving: ohne - mit };
  }

  /* Paket: aus dem Katalog, nach Kategorie (qr, tablets), nie im Browser gepreist */
  function pick(v) {
    if (!cat) return null;
    var items = (cat.items || []).filter(function (i) { return !i.soldOut; });
    function cheapest(c) { return items.filter(function (i) { return i.category === c; }).sort(function (a, b) { return a.price - b.price; })[0]; }
    var qr = cheapest('qr'), tab = cheapest('tablets');
    var useTab = v.geraete > 0 && tab;
    var item = useTab ? tab : (qr || tab || items[0]);
    if (!item) return null;
    var qty = useTab ? Math.max(1, Math.min(20, v.geraete)) : Math.max(1, Math.min(20, Math.ceil((v.tische || 1) / 12)));
    var opts = {};
    (item.options || []).forEach(function (k) {
      var o = cat.options && cat.options[k]; if (!o || !o.choices) return;
      var d = o.choices.filter(function (x) { return x.default; })[0] || o.choices[0];
      if (o.type === 'one') opts[k] = d.id;
    });
    return { item: item, qty: qty, opts: opts, useTab: useTab };
  }

  function render() {
    var v = validate();
    $('rc-add').disabled = true;
    if (!v) { $('rc-live').textContent = 'Bitte prüfe die markierten Felder.'; return; }
    save(v);
    $('r-bar').textContent = Math.max(0, 100 - v.qr - v.karte).toLocaleString('de-DE') + ' %';
    var r = compute(v); last = r;
    animate('r-count', r.count, function (n) { return Math.round(n).toLocaleString('de-DE'); });
    animate('r-ohne', r.ohne, eur); animate('r-mit', r.mit, eur); animate('r-saving', r.saving, eur);
    var max = Math.max(r.ohne, r.mit, 0.01);
    $('b-ohne').style.transform = 'scaleX(' + (r.ohne / max).toFixed(3) + ')';
    $('b-mit').style.transform = 'scaleX(' + (r.mit / max).toFixed(3) + ')';
    $('rc-live').textContent = 'Beispielrechnung: Gebühren ohne Paket ' + eur(r.ohne) + ', mit Paket ' + eur(r.mit) + ', Unterschied ' + eur(r.saving) + ' pro Monat.';
    var p = pick(v), pay = $('rc-pay');
    if (p) {
      var total = p.item.price * p.qty / 100;
      var txt = 'Paketpreis laut Katalog: ' + eur(total) + ' (Demo-Preis, ' + p.qty + ' × ' + p.item.name + ').';
      if (r.saving > 0) txt += ' Bei dieser Beispielersparnis wäre das nach etwa ' + Math.max(1, Math.ceil(total / r.saving)) + ' Monaten wieder drin.';
      else txt += ' Mit diesen Beispielwerten gibt es keine Ersparnis bei den Gebühren.';
      pay.textContent = txt;
      $('rc-pkg-text').textContent = 'Für ' + (p.useTab ? v.geraete + ' Gerät(e)' : v.tische + ' Tisch(e)') + ' passt: ' + p.qty + ' × ' + p.item.name + ' für ' + eur(total) + ' (Demo-Preis). Beispielrechnung, kein Angebot.';
      $('rc-add').disabled = false; $('rc-add').dataset.item = p.item.id;
      $('rc-add').onclick = function () {
        window.Shop.addToCart({ item: p.item.id, qty: p.qty, options: p.opts });
        $('rc-status').textContent = p.qty + ' × ' + p.item.name + ' liegt im Warenkorb. Zur Kasse geht es über den Warenkorb.';
      };
    } else if (cat) { pay.textContent = ''; $('rc-pkg-text').textContent = 'Zurzeit ist kein Paket verfügbar. Schau unter Pakete vorbei.'; }
  }

  function loadCat() {
    var S = window.Shop, t = $('rc-pkg-text');
    if (!S) { t.textContent = 'Die Pakete findest du unter Pakete.'; return; }
    t.textContent = 'Das Paket wird geladen …';
    S.catalog().then(function (c) { cat = c; render(); }).catch(function () {
      t.innerHTML = 'Das Paket lässt sich gerade nicht laden. <button type="button" class="rc-btn rc-btn--ghost" id="rc-retry">Noch einmal versuchen</button>';
      $('rc-retry').addEventListener('click', loadCat);
    });
  }

  form.addEventListener('input', render);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  $('rc-reset').addEventListener('click', function () {
    Object.keys(DEF).forEach(function (k) { $('f-' + k).value = DEF[k]; });
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    render();
  });
  load(); render();
  function start() { loadCat(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
