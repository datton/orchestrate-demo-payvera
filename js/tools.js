/* Demo-Anfrage mit Kalender (senior6). Beispiel-Termine relativ zu heute. Nichts wird gesendet. */
(function () {
  'use strict';
  if (!document.body.hasAttribute('data-booking')) return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var KEY = 'bookings', LS = 'shop:payvera:bookings';
  function load() {
    try { if (window.Shop) { var v = Shop.get(KEY, []); return Array.isArray(v) ? v : []; } var r = JSON.parse(localStorage.getItem(LS) || '[]'); return Array.isArray(r) ? r : []; } catch (e) { return []; }
  }
  function save(a) { try { if (window.Shop) Shop.set(KEY, a); else localStorage.setItem(LS, JSON.stringify(a)); } catch (e) {} }

  var SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00'];
  var WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var first = addDays(today, 2);                 // Termine ab übermorgen
  var last = new Date(today.getFullYear(), today.getMonth() + 3, 0);   // bis Ende des übernächsten Monats
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function key(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function fromKey(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function bookable(d) { var w = d.getDay(); return w !== 0 && w !== 6 && d >= first && d <= last; }
  function mineAt(k, t) { return load().some(function (b) { return b.date === k && b.time === t; }); }
  // Beispiel-Belegung: je Tag und Uhrzeit fest aus dem Datum abgeleitet.
  function taken(k, t) { return (hash(k + t) % 100) < 35 || mineAt(k, t); }
  function free(k) { return SLOTS.filter(function (t) { return !taken(k, t); }); }
  function dayLabel(d) { return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }

  var view = new Date(first.getFullYear(), first.getMonth(), 1), focusKey = key(first), selDate = '', selTime = '';
  var grid = $('bk-grid');

  function renderCal(focusAfter) {
    $('bk-cal-h').textContent = view.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    $('bk-prev').disabled = view.getFullYear() * 12 + view.getMonth() <= today.getFullYear() * 12 + today.getMonth();
    $('bk-next').disabled = view.getFullYear() * 12 + view.getMonth() >= last.getFullYear() * 12 + last.getMonth();
    var h = WD.map(function (w) { return '<div class="bk__wd" aria-hidden="true">' + w + '</div>'; }).join('');
    var lead = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7;
    for (var i = 0; i < lead; i++) h += '<div aria-hidden="true"></div>';
    var n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (var d = 1; d <= n; d++) {
      var dt = new Date(view.getFullYear(), view.getMonth(), d), k = key(dt), ok = bookable(dt), f = ok ? free(k).length : 0;
      var cls = 'bk__d' + (ok && f ? ' is-free' : ' is-off') + (k === key(today) ? ' is-today' : '') + (k === selDate ? ' is-sel' : '');
      var lab = dayLabel(dt) + (k === key(today) ? ', heute' : '') + (ok ? (f ? ', ' + f + ' Beispiel-Zeiten frei' : ', ausgebucht') : ', kein Termin');
      h += '<button type="button" class="' + cls + '" data-k="' + k + '" tabindex="' + (k === focusKey ? 0 : -1) + '" aria-label="' + esc(lab) + '"' + (k === selDate ? ' aria-pressed="true"' : ' aria-pressed="false"') + (ok && f ? '' : ' aria-disabled="true"') + '>' + d + (ok && f ? '<small>' + f + ' frei</small>' : '') + '</button>';
    }
    grid.innerHTML = h;
    if (focusAfter) { var b = grid.querySelector('[data-k="' + focusKey + '"]'); if (b) b.focus(); }
  }
  function moveFocus(delta) {
    var d = addDays(fromKey(focusKey), delta);
    if (d < today) d = today; if (d > last) d = last;
    focusKey = key(d);
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) view = new Date(d.getFullYear(), d.getMonth(), 1);
    renderCal(true);
  }
  grid.addEventListener('keydown', function (e) {
    var m = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (m) { e.preventDefault(); moveFocus(m); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); moveFocus(e.key === 'Home' ? -(((fromKey(focusKey).getDay() + 6) % 7)) : 6 - ((fromKey(focusKey).getDay() + 6) % 7)); }
  });
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (!b) return;
    focusKey = b.getAttribute('data-k');
    if (b.getAttribute('aria-disabled') === 'true') { return; }
    selDate = focusKey; selTime = ''; $('bk-when').value = '';
    renderCal(true); renderSlots();
  });
  $('bk-prev').addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); focusKey = key(new Date(Math.max(+today, +view))); renderCal(); });
  $('bk-next').addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); focusKey = key(view); renderCal(); });

  function renderSlots() {
    var box = $('bk-slots');
    if (!selDate) { box.innerHTML = '<p class="bk__muted">Wähle zuerst einen Tag.</p>'; return; }
    $('bk-slots-h').textContent = 'Uhrzeiten am ' + fromKey(selDate).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    box.innerHTML = SLOTS.map(function (t, i) {
      var tk = taken(selDate, t);
      return '<label class="bk__slot' + (tk ? ' is-taken' : '') + '"><input type="radio" name="bk-time" value="' + t + '"' + (tk ? ' disabled' : '') + '><span>' + t + ' Uhr' + (tk ? ' (belegt)' : '') + '</span></label>';
    }).join('');
  }
  $('bk-slots').addEventListener('change', function (e) {
    if (e.target.name !== 'bk-time') return;
    selTime = e.target.value;
    $('bk-when').value = dayLabel(fromKey(selDate)) + ', ' + selTime + ' Uhr';
    $('bk-when').removeAttribute('aria-invalid');
  });

  function ics(b) {
    var d = b.date.replace(/-/g, ''), t = b.time.replace(':', '') + '00';
    var s = new Date(+b.date.slice(0, 4), +b.date.slice(5, 7) - 1, +b.date.slice(8, 10), +b.time.slice(0, 2), +b.time.slice(3, 5) + 30);
    var end = s.getFullYear() + p2(s.getMonth() + 1) + p2(s.getDate()) + 'T' + p2(s.getHours()) + p2(s.getMinutes()) + '00';
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Payvera Demo//DE', 'BEGIN:VEVENT', 'UID:' + b.id + '@payvera.demo', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'DTSTART:' + d + 'T' + t, 'DTEND:' + end, 'SUMMARY:Payvera Demo (Beispieltermin)', 'DESCRIPTION:Beispieltermin aus der Payvera-Demo. Es wurde nichts gesendet.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  function download(b) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics(b)], { type: 'text/calendar' }));
    a.download = 'payvera-demo-' + b.date + '.ics'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function validate() {
    var errs = [], first = null;
    function bad(el, msg) { el.setAttribute('aria-invalid', 'true'); errs.push(msg); if (!first) first = el; }
    ['bk-name', 'bk-biz', 'bk-ind', 'bk-when'].forEach(function (id) { $(id).removeAttribute('aria-invalid'); });
    if (!$('bk-name').value.trim()) bad($('bk-name'), 'Bitte gib deinen Namen an.');
    if (!$('bk-biz').value.trim()) bad($('bk-biz'), 'Bitte gib den Namen deines Betriebs an.');
    if (!$('bk-ind').value) bad($('bk-ind'), 'Bitte wähle eine Branche.');
    if (!document.querySelectorAll('input[name=bk-int]:checked').length) { errs.push('Bitte wähle mindestens ein Interesse.'); if (!first) first = document.querySelector('input[name=bk-int]'); }
    if (!selDate || !selTime) { errs.push('Bitte wähle im Kalender einen Tag und eine Uhrzeit.'); $('bk-when').setAttribute('aria-invalid', 'true'); if (!first) first = grid.querySelector('[tabindex="0"]'); }
    else if (taken(selDate, selTime)) { errs.push('Diese Zeit ist leider schon belegt. Bitte wähle eine andere.'); }
    var box = $('bk-error'); box.hidden = !errs.length; box.textContent = errs.join(' ');
    if (first) first.focus();
    return !errs.length;
  }

  $('bk-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    var b = { id: 'b' + Date.now().toString(36), name: $('bk-name').value.trim(), biz: $('bk-biz').value.trim(), industry: $('bk-ind').value,
      interest: Array.prototype.map.call(document.querySelectorAll('input[name=bk-int]:checked'), function (c) { return c.value; }), date: selDate, time: selTime, created: new Date().toISOString() };
    var all = load(); all.unshift(b); save(all.slice(0, 20));
    var done = $('bk-done');
    done.hidden = false;
    done.innerHTML = '<h2>Danke, ' + esc(b.name) + '. Deine Anfrage ist vorgemerkt.</h2><p>' + esc(dayLabel(fromKey(b.date))) + ', ' + b.time + ' Uhr (Beispieltermin)</p><p>Interesse: ' + esc(b.interest.join(', ') ) + '</p><p>Es wurde nichts gesendet. Die Anfrage liegt nur in diesem Browser.</p><button type="button" class="bk__ghost" id="bk-ics">Termin als .ics laden</button>';
    $('bk-ics').addEventListener('click', function () { download(b); });
    done.focus(); done.scrollIntoView({ block: 'nearest' });
    $('bk-form').reset(); selDate = ''; selTime = ''; $('bk-when').value = '';
    renderCal(); renderSlots(); renderMine();
  });

  function renderMine() {
    var all = load(), ul = $('bk-mine');
    $('bk-mine-wrap').hidden = !all.length;
    ul.innerHTML = all.map(function (b) {
      return '<li><span>' + esc(dayLabel(fromKey(b.date))) + ', ' + esc(b.time) + ' Uhr, ' + esc(b.biz) + '</span><span><button type="button" data-ics="' + esc(b.id) + '">.ics</button><button type="button" data-del="' + esc(b.id) + '">Entfernen</button></span></li>';
    }).join('');
  }
  $('bk-mine').addEventListener('click', function (e) {
    var id = e.target.getAttribute('data-del') || e.target.getAttribute('data-ics'); if (!id) return;
    var all = load();
    if (e.target.hasAttribute('data-del')) { save(all.filter(function (b) { return b.id !== id; })); renderCal(); renderSlots(); renderMine(); }
    else { var b = all.filter(function (x) { return x.id === id; })[0]; if (b) download(b); }
  });

  renderCal(); renderSlots(); renderMine();
})();
