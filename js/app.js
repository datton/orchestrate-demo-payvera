/* Startseite (Full-Stack): Angebote aus dem Katalog, Start-Paket-Planer, Angebots-Finder. Preise nur aus dem Katalog. */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var sc = $('service-cards'), items = [];
  function reveal(box) { box.querySelectorAll('[data-reveal]').forEach(function (e) { e.classList.add('is-in'); }); }
  function byId(id) { return items.filter(function (i) { return i.id === id; })[0]; }
  function pr(id) { var i = byId(id); return i ? i.price : 0; }
  function first(s) { var p = String(s || '').split('. '); return p[0].replace(/\.?$/, '.'); }
  function from(i) { return (i.options && i.options.length) ? 'ab ' : ''; }
  function unitOf(i) { return i.id === 'bezahl-qr' ? 'pro Standort und Monat' : i.id === 'digitale-speisekarte' ? 'pro Monat' : i.unit ? 'pro ' + i.unit : 'einmalig'; }
  function card(i) {
    return '<li class="h-card" data-reveal><h3>' + esc(i.name) + '</h3><p>' + esc(first(i.desc)) + '</p>' +
      '<div class="h-price"><small>' + from(i) + '</small>' + esc(Shop.money(i.price)) + ' <small>' + esc(unitOf(i)) + '</small></div>' +
      '<a class="more" href="pages/services.html#' + encodeURIComponent(i.id) + '">Details und Optionen<span class="visually-hidden">: ' + esc(i.name) + '</span></a></li>';
  }

  // Finder: Häkchen -> Katalog-Angebote
  var MAP = { menu: ['digitale-speisekarte', 'speisekarte-einrichtung', 'tisch-qr-set'], pay: ['bezahl-qr', 'tisch-qr-set'], till: ['tablet-kasse'], team: ['schulung'], stand: ['aufsteller'] };
  var form = $('pick');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var out = $('pick-out'), picked = [].slice.call(form.querySelectorAll('input:checked')).map(function (i) { return i.value; });
    if (!picked.length) { out.textContent = 'Kreuze an, was zutrifft, dann zeigen wir passende Angebote.'; return; }
    var ids = [];
    picked.forEach(function (p) { MAP[p].forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); });
    var rows = ids.map(byId).filter(Boolean);
    if (!rows.length) { out.innerHTML = 'Alle Angebote findest du <a href="pages/services.html">hier</a>.'; return; }
    out.innerHTML = 'Das passt zu dir:<ul>' + rows.map(function (i) {
      return '<li><a href="pages/services.html#' + encodeURIComponent(i.id) + '">' + esc(i.name) + '</a>, ' + from(i) + esc(Shop.money(i.price)) + ' ' + esc(unitOf(i)) + '</li>';
    }).join('') + '</ul><p class="h-note">Vorschläge, kein Angebot. Im <a href="pages/rechner.html">Preisrechner</a> kannst du genauer rechnen.</p>';
  });

  // Start-Paket-Planer: Tische -> Sets (12 pro Set), Tablets, Extras; einmalig und monatlich getrennt
  function num(id, max) { var f = $(id), v = parseInt(f.value, 10); if (isNaN(v) || v < 0) v = 0; if (v > max) { v = max; f.value = max; } return v; }
  function plan() {
    if (!$('plan') || !items.length) return;
    var tables = num('pl-t', 240), tabs = num('pl-k', 20), sets = Math.ceil(tables / 12);
    var once = [], month = [];
    if (sets) once.push(['Tisch-QR-Set (' + sets + ' x ' + Shop.money(pr('tisch-qr-set')) + ')', sets * pr('tisch-qr-set')]);
    if (tabs) once.push(['Tablet-Kasse (' + tabs + ' x ' + Shop.money(pr('tablet-kasse')) + ')', tabs * pr('tablet-kasse')]);
    if ($('pl-e').checked) once.push(['Einrichtung der Speisekarte', pr('speisekarte-einrichtung')]);
    if ($('pl-s').checked) once.push(['Team-Schulung', pr('schulung')]);
    if ($('pl-b').checked) month.push(['Bezahl-QR, ein Standort', pr('bezahl-qr')]);
    if ($('pl-m').checked) month.push(['Digitale Speisekarte', pr('digitale-speisekarte')]);
    function sum(a) { return a.reduce(function (s, r) { return s + r[1]; }, 0); }
    $('pl-once').textContent = Shop.money(sum(once));
    $('pl-month').textContent = Shop.money(sum(month));
    $('pl-lines').innerHTML = once.map(function (r) { return '<li><span>' + esc(r[0]) + '</span><span>' + esc(Shop.money(r[1])) + '</span></li>'; }).join('') +
      month.map(function (r) { return '<li><span>' + esc(r[0]) + ' (pro Monat)</span><span>' + esc(Shop.money(r[1])) + '</span></li>'; }).join('');
  }
  var pf = $('plan');
  if (pf) { pf.addEventListener('input', plan); pf.addEventListener('change', plan); pf.addEventListener('submit', function (e) { e.preventDefault(); }); }

  function load() {
    if (!window.Shop || !Shop.catalog) return;
    Shop.catalog().then(function (c) {
      items = c.items || [];
      if (sc && items.length) { sc.innerHTML = items.map(card).join(''); reveal(sc); }
      plan();
    }).catch(function () { /* die feste Karte mit Link bleibt */ });
  }
  if (window.Shop) load(); else window.addEventListener('load', load);
})();
