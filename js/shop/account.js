/* Meine Käufe (Senior Developer 4, Payvera): pages/account.html. Demo-Sperre im Browser, kein echter Schutz. */
(function () {
  'use strict';
  var root = document.getElementById('account-root');
  var esc = Shop.esc;
  function paid(o) { return o.status && o.status !== 'pending' && o.status !== 'cancelled' && o.status !== 'refunded'; }
  function day(iso) { try { return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return ''; } }

  function render(orders) {
    var good = orders.filter(paid);
    if (!good.length) {
      root.innerHTML = '<div class="ord__card ord__empty"><h2>Noch nichts hier</h2><p class="ord__muted" style="margin-inline:auto">Was du in diesem Browser bezahlst, erscheint hier, samt dem Stand jeder Bestellung.</p>' +
        '<div class="ord__actions" style="justify-content:center"><a class="ord__btn" href="services.html">Angebote ansehen</a></div></div>';
      return;
    }
    var h = '<section class="ord__card" aria-labelledby="acc-o"><h2 id="acc-o">Deine Bestellungen</h2><ul class="ord__list">' + good.map(function (o) {
      return '<li><span><strong>Bestellung ' + esc(o.number) + '</strong> · ' + esc(day(o.placedAt)) + '<br><span class="ord__muted">' +
        (o.lines || []).map(function (l) { return esc(l.qty + ' × ' + l.name); }).join(', ') + '</span></span>' +
        '<span>' + Shop.money(o.total, o.currency) + ' · <a href="order.html?o=' + encodeURIComponent(o.token) + '">Bestellung ansehen</a></span></li>';
    }).join('') + '</ul></section>';
    root.innerHTML = h;
  }
  function fail(msg) {
    root.innerHTML = '<div class="ord__error" role="alert">' + esc(msg || 'Deine Käufe konnten nicht geladen werden.') + '</div><div class="ord__actions acc-retry"><button class="ord__btn" type="button" id="acc-retry">Nochmal versuchen</button></div>';
    document.getElementById('acc-retry').addEventListener('click', function () { root.innerHTML = '<p class="ord__muted">Wir laden deine Käufe …</p>'; load(); });
  }
  var tokens = Shop.orders();
  function load() {
  return Promise.resolve().then(function () {
    if (!tokens.length) return render([]);
    return Shop.api('orders/lookup', { tokens: tokens.slice(0, 30) }).then(function (r) { render(r.orders || []); },
      function (e) { fail(e.message); });
  });
  }
  load();
})();
