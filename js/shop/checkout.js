/* Checkout and payment (Senior Developer 3). */
(function () {
  'use strict';
  var S = window.Shop;
  var $ = function (id) { return document.getElementById(id); };
  var state = { coupon: 'best', gift: '', quote: null, busy: false };
  var quoteSeq = 0;

  // The service answers in English for some errors: show German on this site.
  function de(msg) {
    msg = String(msg || '');
    if (/[äöüß]|\b(nicht|bitte|dein|deine|der|die|das|ein|eine)\b/i.test(msg)) return msg;   // already German
    if (/gift ?card/i.test(msg)) return 'Diesen Code der Geschenkkarte kennen wir nicht, oder er hat kein Guthaben mehr.';
    if (/coupon|promo/i.test(msg)) return 'Dieser Gutschein kann für diese Bestellung nicht verwendet werden.';
    if (/too many|slow down|rate/i.test(msg)) return 'Gerade sind zu viele Anfragen unterwegs. Bitte warte einen Moment.';
    if (/empty|no items|nothing in/i.test(msg)) return 'Dein Warenkorb ist leer.';
    if (/unavailable|sold out|not available/i.test(msg)) return 'Eines der Angebote ist gerade nicht verfügbar.';
    return 'Das hat leider nicht geklappt. Bitte versuche es noch einmal.';
  }

  function init() {
    var p = S.get('profile', {}) || {};
    $('co-name').value = p.name || '';
    $('co-email').value = p.email || '';
    $('co-coupon').addEventListener('change', function () { state.coupon = this.value; refresh(); });
    $('co-gift-apply').addEventListener('click', function () { applyGift($('co-gift').value); });
    $('co-gift').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyGift(this.value); } });
    $('co-form').addEventListener('submit', submit);
    $('co-retry').addEventListener('click', function () { $('co-retry').hidden = true; refresh(); });
    renderWallet();
    // Gift cards only when this shop sells them and the customer has one saved: nothing else could ever work.
    S.catalog().then(function (c) { if (c && c.giftCards && (S.get('wallet', []) || []).length) $('co-giftblock').hidden = false; }).catch(function () {});

    // An unpaid order whose cart was emptied (cancelled, or back button): put the cart back.
    var pend = S.get('pending-cart', null);
    if (pend && pend.token) {
      S.set('pending-cart', null);
      if (!S.cart().length && pend.lines && pend.lines.length) {
        var restore = function () { S.saveCart(pend.lines); refresh(); };
        if (S.param('cancelled') === pend.token) restore();
        else S.api('orders/' + encodeURIComponent(pend.token)).then(function (o) { if (o.status === 'pending' || (o.payment && o.payment.state !== 'paid')) restore(); }).catch(function () {});
      }
    }
    var cancelled = S.param('cancelled');
    if (cancelled) {
      $('co-banner').textContent = 'Die Zahlung wurde abgebrochen. Es wurde nichts abgebucht, dein Warenkorb ist noch da.';
      S.api('orders/' + encodeURIComponent(cancelled) + '/cancel', {}).catch(function () {});
      history.replaceState(null, '', location.pathname);
    }
    refresh();
  }

  function renderWallet() {
    var codes = S.get('wallet', []) || [], host = $('co-wallet');
    host.innerHTML = '';
    codes.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'shop-chip';
      b.textContent = (c === state.gift ? '✓ ' : '') + 'Geschenkkarte ' + String(c).slice(-4);
      b.setAttribute('aria-pressed', c === state.gift ? 'true' : 'false');
      b.addEventListener('click', function () { applyGift(c === state.gift ? '' : c); });
      host.appendChild(b);
    });
  }

  function applyGift(code) {
    code = String(code || '').trim();
    $('co-gift-err').textContent = '';
    var prev = state.gift;
    state.gift = code;
    refresh().then(function (ok) {
      if (!ok) { state.gift = prev; $('co-gift-err').textContent = state.lastError || 'Diese Geschenkkarte kann nicht verwendet werden.'; refresh(); }
      else { if (code) $('co-gift').value = ''; renderWallet(); }
    });
  }

  function body() {
    var b = { items: S.cart(), customer: S.customerId() };
    if (state.coupon) b.coupon = state.coupon;
    if (state.gift) b.giftCard = state.gift;
    return b;
  }

  function refresh() {
    var cart = S.cart(), seq = ++quoteSeq;
    $('co-empty').hidden = cart.length > 0;
    $('co-grid').hidden = cart.length === 0;
    if (!cart.length) return Promise.resolve(true);
    $('co-pay').disabled = true;
    return S.api('quote', body()).then(function (q) {
      if (seq !== quoteSeq) return true;
      state.quote = q; $('co-error').textContent = ''; state.lastError = ''; $('co-retry').hidden = true;
      render(q); return true;
    }).catch(function (e) {
      if (seq !== quoteSeq) return false;
      state.lastError = de(e.message); $('co-error').textContent = state.lastError; $('co-retry').hidden = false; return false;
    });
  }

  function render(q) {
    var cur = q.currency, m = function (c) { return S.money(c, cur); };
    $('co-lines').innerHTML = q.lines.map(function (l) {
      return '<li><span>' + S.esc(l.name) + ' × ' + l.qty + (l.summary ? '<small>' + S.esc(l.summary) + '</small>' : '') + '</span><span>' + m(l.total) + '</span></li>';
    }).join('');
    var rows = ['<div><dt>Zwischensumme</dt><dd>' + m(q.subtotal) + '</dd></div>'];
    if (q.discount) rows.push('<div class="is-saving"><dt>Gutschein ' + S.esc(q.discount.code) + '</dt><dd>−' + m(q.discount.amount) + '</dd></div>');
    if (q.giftCard) rows.push('<div class="is-saving"><dt>Geschenkkarte ' + S.esc(q.giftCard.last4) + '</dt><dd>−' + m(q.giftCard.applied) + '</dd></div>');
    rows.push('<div class="is-total"><dt>Gesamt</dt><dd>' + m(q.total) + '</dd></div>');
    $('co-totals').innerHTML = rows.join('');
    var sel = $('co-coupon'), usable = q.usable || [];
    sel.innerHTML = '<option value="best">Bester Gutschein (automatisch)</option><option value="">Kein Gutschein</option>' +
      usable.map(function (u) { return '<option value="' + S.esc(u.code) + '"' + (u.amount ? '' : ' disabled') + '>' + S.esc(u.code) + ' · ' + S.esc(u.name) + (u.amount ? ' (−' + m(u.amount) + ')' : '') + '</option>'; }).join('');
    sel.value = state.coupon;
    var hint = '';
    if (state.coupon === 'best') hint = q.discount ? 'Der beste Gutschein ist angewendet: ' + q.discount.name + '.' : 'Für diese Bestellung gilt kein Gutschein.';
    else if (state.coupon) { var u = usable.filter(function (x) { return x.code === state.coupon; })[0]; hint = u && u.why ? u.why : ''; }
    $('co-coupon-hint').textContent = hint;
    $('co-pay').textContent = q.total > 0 ? 'Bezahlen: ' + m(q.total) : 'Bestellung abschließen';
    $('co-pay').disabled = false;
  }

  function validate() {
    var ok = true, name = $('co-name').value.trim(), email = $('co-email').value.trim();
    $('co-name-err').textContent = name ? '' : 'Bitte gib deinen Namen ein.';
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    $('co-email-err').textContent = emailOk ? '' : 'Bitte gib eine gültige E-Mail-Adresse ein.';
    if (!name) { $('co-name').focus(); ok = false; }
    else if (!emailOk) { $('co-email').focus(); ok = false; }
    return ok;
  }

  function submit(e) {
    e.preventDefault();
    if (state.busy || !validate()) return;
    var name = $('co-name').value.trim(), email = $('co-email').value.trim(), note = $('co-note').value.trim();
    S.set('profile', Object.assign({}, S.get('profile', {}), { name: name, email: email }));
    var b = body();
    b.name = name;
    b.note = note.slice(0, 300);   // the email stays in this browser (profile); the service gets name and note only
    S.catalog().then(function (c) {
      var st = S.get('store', null) || (c.stores && c.stores[0] && c.stores[0].id);
      if (st) b.store = st;
    }).catch(function () {}).then(function () {
      state.busy = true; $('co-pay').disabled = true; $('co-pay').textContent = 'Einen Moment …';
      return S.api('orders', b);
    }).then(function (r) {
      S.addOrder(r.order.token);
      // The order exists: empty the cart, but keep a copy until the payment is done, so cancelling brings it back.
      S.set('pending-cart', { token: r.order.token, lines: S.cart() });
      S.saveCart([]);
      if (r.pay && r.pay.url) { location.href = r.pay.url; }
      else { S.set('pending-cart', null); location.href = S.url('pages/order.html?o=' + encodeURIComponent(r.order.token)); }
    }).catch(function (err) {
      state.busy = false; var m = de(err.message); $('co-error').textContent = m; S.toast(m, 'error');
      if (state.quote) render(state.quote);
    });
  }

  window.addEventListener('shop:cart', function () { refresh(); });
  if (S) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init(); }
})();
