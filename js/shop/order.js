/* Bestellbestätigung (Senior Developer 4, Payvera): pages/order.html?o=<token> */
(function () {
  'use strict';
  var root = document.getElementById('order-root');
  var token = Shop.param('o');
  var cat = null, timer = null, last = null, cleared = false, tries = 0;
  var esc = Shop.esc;

  function listOf(v) { return v == null ? [] : (Array.isArray(v) ? v : [v]); }
  function itemOf(id) { return ((cat && cat.items) || []).filter(function (i) { return i.id === id; })[0] || {}; }
  function when(iso) {
    try { return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso || ''; }
  }
  var STEP = { paid: 'Zahlung eingegangen', making: 'Wird vorbereitet', ready: 'Bereit', collected: 'Zugestellt' };
  function payLabel(c) { return /^gift ?card/i.test(c) ? 'Geschenkkarte (Demo)' : c + ' (Testkarte)'; }
  function paid(o) { return o && o.status && o.status !== 'pending' && o.status !== 'cancelled' && o.status !== 'refunded'; }
  function brand() { return (cat && cat.brand && cat.brand.name) || 'Payvera'; }

  function receipt(o) {
    var t = ['QUITTUNG (Demo: nur Testzahlung, es bewegt sich kein echtes Geld)', '', brand() + ' (fiktive Firma)',
      'Bestellnummer: ' + o.number, 'Datum: ' + when(o.placedAt), 'Name: ' + (o.name || ''), ''];
    (o.lines || []).forEach(function (l) { t.push(l.qty + ' x ' + l.name + (l.summary ? ' (' + l.summary + ')' : '') + '  ' + Shop.money(l.total, o.currency)); });
    t.push('', 'Zwischensumme: ' + Shop.money(o.subtotal, o.currency));
    if (o.discount) t.push('Rabatt ' + o.discount.code + ': -' + Shop.money(o.discount.amount, o.currency));
    if (o.giftCard) t.push('Geschenkkarte: -' + Shop.money(o.giftCard.applied, o.currency));
    t.push('Bezahlt: ' + Shop.money(o.total, o.currency));
    if (o.payment && o.payment.card) t.push('Zahlung: ' + payLabel(o.payment.card));
    t.push('', 'Dies ist eine Demo. Es wurde kein echtes Geld bewegt.');
    return t.join('\n');
  }

  function render(o) {
    last = o;
    var ok = paid(o), h = '<p class="ord__eyebrow">Bestätigung <span class="ord__badge">Demo</span></p>';
    if (ok && !cleared) { cleared = true; Shop.saveCart([]); }
    if (o.status === 'cancelled' || o.status === 'refunded') {
      h += '<h1 class="ord__title">Bestellung ' + (o.status === 'refunded' ? 'erstattet' : 'abgebrochen') + '</h1><p class="ord__muted">Es ist nichts offen. Du kannst jederzeit neu buchen.</p>' +
        '<div class="ord__actions"><a class="ord__btn" href="services.html">Zu den Angeboten</a></div>';
    } else if (!ok) {
      h += '<h1 class="ord__title">Wir warten auf deine Zahlung …</h1><p class="ord__muted"><span class="ord__spin" aria-hidden="true"></span>Diese Seite aktualisiert sich von selbst.</p>';
    } else {
      h += '<h1 class="ord__title">Danke' + (o.firstName ? ', ' + esc(o.firstName) : '') + '! Deine Zahlung ist angekommen.</h1>' +
        '<div class="ord__number"><small>Bestellnummer</small><strong>' + esc(o.number) + '</strong></div><br>';
    }
    h += '<span class="ord__test">' + esc((Shop.TEST_LABEL || 'Demo-Shop: nur Testzahlungen, es bewegt sich kein echtes Geld.')) + '</span>';
    if (ok) {
      var steps = (o.steps || []).map(function (s) { return '<li class="' + (s.at ? 'is-done' : '') + '">' + esc(STEP[s.id] || s.label) + (s.at ? ' &#10003;' : '') + '</li>'; }).join('');
      h += '<section class="ord__card" aria-labelledby="ord-b"><h2 id="ord-b">Was du bestellt hast</h2><ul class="ord__lines">' +
        (o.lines || []).map(function (l) { return '<li><span>' + esc(l.qty) + ' × ' + esc(l.name) + (l.summary ? '<small>' + esc(l.summary) + '</small>' : '') + '</span><span>' + Shop.money(l.total, o.currency) + '</span></li>'; }).join('') + '</ul>' +
        '<div class="ord__sub"><span>Zwischensumme</span><span>' + Shop.money(o.subtotal, o.currency) + '</span></div>' +
        (o.discount ? '<div class="ord__sub"><span>' + esc(o.discount.name || o.discount.code) + '</span><span>−' + Shop.money(o.discount.amount, o.currency) + '</span></div>' : '') +
        (o.giftCard ? '<div class="ord__sub"><span>Geschenkkarte</span><span>−' + Shop.money(o.giftCard.applied, o.currency) + '</span></div>' : '') +
        '<div class="ord__sum"><span>Bezahlt</span><span>' + Shop.money(o.total, o.currency) + '</span></div>' +
        (o.payment && o.payment.card ? '<p class="ord__muted">Bezahlt mit ' + esc(payLabel(o.payment.card)) + '</p>' : '') + '</section>';

      h += '<section class="ord__card" aria-labelledby="ord-n"><h2 id="ord-n">Wie es weitergeht</h2>' + (steps ? '<ol class="ord__steps">' + steps + '</ol>' : '') +
        (o.lines || []).map(function (l) {
          var it = itemOf(l.item), b = '<div class="ord__next"><h3>' + esc(l.name) + '</h3>';
          b += '<p>Das ist ein Angebot der fiktiven Firma Payvera. Diese Demo verschickt und liefert nichts; in der echten Welt würde sich das Team bei dir melden, die Einrichtung mit dir besprechen und die Lieferung abstimmen. Nenne dann einfach deine Bestellnummer ' + esc(o.number) + '.</p>';
          listOf(it.next || it.afterBuying || it.whatNext).forEach(function (n) { b += '<p>' + esc(n) + '</p>'; });
          var prep = listOf(it.prepare || it.bring);
          if (prep.length) b += '<p><strong>Halte bereit:</strong> ' + prep.map(esc).join(', ') + '.</p>';
          return b + '</div>';
        }).join('') + '</section>';
      h += '<div class="ord__actions"><button class="ord__btn" type="button" id="ord-r">Quittung herunterladen</button>' +
        '<a class="ord__btn ord__btn--ghost" href="account.html">Meine Käufe</a><a class="ord__btn ord__btn--ghost" href="services.html">Weitere Angebote</a></div>';
    }
    root.innerHTML = h;
    var r = document.getElementById('ord-r');
    if (r) r.addEventListener('click', function () { Shop.download('quittung-' + o.number + '.txt', receipt(o)); });
  }

  function fail(msg) {
    root.innerHTML = '<p class="ord__eyebrow">Bestätigung <span class="ord__badge">Demo</span></p><h1 class="ord__title">Diese Bestellung finden wir nicht</h1><div class="ord__error" role="alert">' + esc(msg) + '</div>' +
      '<span class="ord__test">' + esc((Shop.TEST_LABEL || 'Demo-Shop: nur Testzahlungen, es bewegt sich kein echtes Geld.')) + '</span><div class="ord__actions"><button class="ord__btn" type="button" id="ord-retry">Nochmal versuchen</button><a class="ord__btn ord__btn--ghost" href="account.html">Meine Käufe</a><a class="ord__btn ord__btn--ghost" href="services.html">Angebote</a></div>';
    var rt = document.getElementById('ord-retry');
    if (rt) rt.addEventListener('click', function () { tries = 0; poll(); });
  }
  function poll() {
    tries++;
    Shop.api('orders/' + encodeURIComponent(token)).then(function (res) {
      var o = res.order || res;
      if (!last || JSON.stringify(last) !== JSON.stringify(o)) render(o);
      var done = o.status === 'collected' || o.status === 'cancelled' || o.status === 'refunded' || (paid(o) && (o.status === 'ready'));
      if (!done && tries < 40) timer = setTimeout(poll, 3000);
    }, function (e) { if (!last) fail(e.message); else timer = setTimeout(poll, 5000); });
  }
  if (!token) { fail('In diesem Link fehlt die Bestellnummer. Öffne die Bestellung unter Meine Käufe.'); return; }
  Shop.addOrder(token);
  Shop.catalog().then(function (c) { cat = c; }, function () {}).then(poll);
})();
