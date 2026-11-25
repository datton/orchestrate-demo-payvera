/* Mini-Demo "QR-Bezahlen": fünf Bildschirme, Beispieldaten, nichts wird gesendet. */
(function () {
  var MENU = [['Filterkaffee', 320], ['Flat White', 390], ['Rhabarberschorle', 350], ['Käsekuchen', 410], ['Focaccia', 520]];
  var cart = {}, step = 0;
  var fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function lines() { return MENU.map(function (m, i) { return { n: m[0], p: m[1], q: cart[i] || 0 }; }).filter(function (l) { return l.q; }); }
  function sum() { return lines().reduce(function (s, l) { return s + l.p * l.q; }, 0) / 100; }
  function count() { return lines().reduce(function (s, l) { return s + l.q; }, 0); }
  function drawMenu() {
    $('so-menu').innerHTML = MENU.map(function (m, i) {
      return '<li><span>' + esc(m[0]) + (cart[i] ? ' <b>× ' + cart[i] + '</b>' : '') + '</span><span class="p">' + fmt.format(m[1] / 100) + '</span><button type="button" data-add="' + i + '" aria-label="' + esc(m[0]) + ' hinzufügen">+</button></li>';
    }).join('');
    var n = count();
    $('so-count').textContent = n ? n + (n === 1 ? ' Position' : ' Positionen') + ', ' + fmt.format(sum()) + ' (Beispiel)' : 'Noch nichts gewählt.';
    $('so-to-order').disabled = !n;
  }
  function drawLines() {
    var h = lines().map(function (l) { return '<li><span>' + l.q + ' × ' + esc(l.n) + '</span><span>' + fmt.format(l.p * l.q / 100) + '</span></li>'; }).join('');
    $('so-lines').innerHTML = h; $('so-rlines').innerHTML = h;
    ['so-sum', 'so-sum2', 'so-sum3'].forEach(function (id) { $(id).textContent = fmt.format(sum()); });
  }
  function show(n) {
    if (n > 1 && !count()) n = 1;
    step = Math.max(0, Math.min(4, n));
    [].forEach.call(document.querySelectorAll('.so-screen'), function (s) { s.hidden = Number(s.getAttribute('data-screen')) !== step; });
    [].forEach.call(document.querySelectorAll('#so-steps button'), function (b) {
      if (Number(b.getAttribute('data-go')) === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    drawLines();
    var f = document.querySelector('.so-screen[data-screen="' + step + '"] .so-btn:not([disabled])'); if (f && document.body.getAttribute('data-so-used')) f.focus({ preventScroll: true });
  }
  function init() {
    var ph = $('so-phone'); if (!ph) return;
    ph.classList.add('so-js'); document.documentElement.classList.add('so-js');
    drawMenu();
    ph.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      document.body.setAttribute('data-so-used', '1');
      if (t.hasAttribute('data-add')) { var i = t.getAttribute('data-add'); cart[i] = (cart[i] || 0) + 1; drawMenu(); var nb = document.querySelector('[data-add="' + i + '"]'); if (nb) nb.focus(); return; }
      if (t.hasAttribute('data-next')) show(step + 1);
      else if (t.hasAttribute('data-prev')) show(step - 1);
      else if (t.hasAttribute('data-restart')) { cart = {}; drawMenu(); show(0); }
    });
    $('so-steps').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-go]'); if (!b) return;
      document.body.setAttribute('data-so-used', '1');
      show(Number(b.getAttribute('data-go')));
    });
    show(0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
