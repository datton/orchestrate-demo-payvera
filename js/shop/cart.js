/* Warenkorb (Senior Developer 2), deutsch, Du-Form. A cart button in the header and a drawer on every shop page.
   Lines live in Shop.cart(); prices come only from the service's quote. Opens on 'shop:cart-open'. */
(function () {
  'use strict';
  var S = window.Shop;
  if (!S) return;
  var drawer, backdrop, body, foot, btn, countEl, opener, quoteSeq = 0, quote = null, lastFocus = null;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function build() {
    backdrop = el('div', 'shop-sheet-backdrop cart-backdrop');
    drawer = el('aside', 'shop-sheet cart-drawer');
    drawer.id = 'cart-drawer';
    drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); drawer.setAttribute('aria-labelledby', 'cart-title');
    drawer.setAttribute('aria-hidden', 'true'); drawer.hidden = true;
    drawer.innerHTML = '<header class="cart-head"><h2 id="cart-title">Dein Warenkorb</h2>' +
      '<button type="button" class="cart-close" aria-label="Warenkorb schließen">&times;</button></header>' +
      '<div class="cart-body" aria-live="polite"></div><footer class="cart-foot"></footer>';
    document.body.appendChild(backdrop); document.body.appendChild(drawer);
    body = drawer.querySelector('.cart-body'); foot = drawer.querySelector('.cart-foot');
    drawer.querySelector('.cart-close').addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('is-open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        var f = drawer.querySelectorAll('button:not([disabled]), a[href], input, select');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    body.addEventListener('click', onBodyClick);
  }

  function mountButton() {
    btn = el('button', 'cart-button');
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-controls', 'cart-drawer');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L19 8H6.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="19" r="1.4" fill="currentColor"/><circle cx="17" cy="19" r="1.4" fill="currentColor"/></svg>' +
      '<span class="cart-button-label">Warenkorb</span><span class="cart-count" aria-hidden="true">0</span>';
    countEl = btn.querySelector('.cart-count');
    btn.addEventListener('click', open);
    place();
    // nav.js adds the header after load; retry briefly, otherwise stay as a floating button.
    var t = setInterval(function () { if (place() || ++tries > 20) clearInterval(t); }, 150);
  }
  var tries = 0;
  function floatIt() { if (!btn.parentNode) { btn.classList.add('cart-button--float'); document.body.appendChild(btn); } }
  function place() {
    var host = document.getElementById('site-actions') || document.querySelector('header .site-nav, header nav, .site-header nav, header');
    if (host && btn.parentNode !== host) {
      // keep retrying until #site-actions exists, so we do not settle in a collapsing nav
      if (host.id !== 'site-actions' && tries < 10) { floatIt(); return false; }
      btn.classList.remove('cart-button--float');
      host.appendChild(btn);
      return true;
    }
    floatIt();
    return !!host && host.id === 'site-actions';
  }

  function open() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add('is-open'); backdrop.classList.add('is-open'); });
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('cart-lock');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    render();
    setTimeout(function () { var c = drawer.querySelector('.cart-close'); if (c) c.focus(); }, 60);
  }
  function close() {
    drawer.classList.remove('is-open'); backdrop.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('cart-lock');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    setTimeout(function () { if (!drawer.classList.contains('is-open')) drawer.hidden = true; }, 350);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function updateCount() {
    var n = S.cartCount();
    if (countEl) { countEl.textContent = n > 99 ? '99+' : n; countEl.hidden = n === 0; }
    if (btn) btn.setAttribute('aria-label', 'Warenkorb, ' + n + ' Artikel');
  }

  // A guide is one download that unlocks under "Purchases": never more than one copy in the cart.
  var guideIds = {}, names = {};
  function itemLabel(id) { return S.itemName ? S.itemName(id, names[id] || id) : (names[id] || id); }
  function isGuide(line) { return !!(line && (guideIds[line.item] || /^guide-/.test(String(line.item)))); }
  function clampGuides() {
    var lines = S.cart(), changed = false;
    lines.forEach(function (l) { if (isGuide(l) && l.qty > 1) { l.qty = 1; changed = true; } });
    if (changed) S.saveCart(lines);
    return changed;
  }
  S.catalog().then(function (c) {
    var items = (c && (c.items || c.services)) || [];
    items.forEach(function (i) { if (!i) return; names[i.id] = i.name; if (i.guide) guideIds[i.id] = true; });
    if (clampGuides()) return;
    if (drawer && drawer.classList.contains('is-open')) render();
  }).catch(function () {});

  function render() {
    if (clampGuides()) return; // saveCart fires shop:cart, which draws again
    updateCount();
    var lines = S.cart();
    if (!lines.length) {
      quote = null;
      body.innerHTML = '<div class="cart-empty"><p class="cart-empty-title">Dein Warenkorb ist leer</p><p>Such dir ein Angebot oder einen Ratgeber aus, er wartet hier auf dich.</p>' +
        '<a class="shop-btn" href="' + S.esc(S.url('pages/services.html')) + '">Angebote ansehen</a></div>';
      foot.innerHTML = '<p class="shop-testlabel">' + S.esc(S.TEST_LABEL) + '</p>';
      return;
    }
    var seq = ++quoteSeq;
    paint(lines, quote && quote.lines && quote.lines.length === lines.length ? quote : null, true);
    S.api('quote', { items: lines, coupon: 'best', customer: S.customerId() }).then(function (q) {
      if (seq !== quoteSeq) return;
      quote = q; paint(S.cart(), q, false);
    }).catch(function (err) {
      if (seq !== quoteSeq) return;
      paint(S.cart(), null, false, err.message, !!(err && (err.name === 'TypeError' || /failed to fetch|networkerror|load failed|network request/i.test(err.message || ''))));
    });
  }

  function paint(lines, q, loading, error, offline) {
    var bad = -1, msg = '';
    if (offline) msg = 'Die Preise konnten gerade nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.';
    else if (error) {
      var m = /line\s+(\d+)\s*:?\s*(.*)/i.exec(error);
      if (m && lines[+m[1] - 1]) {
        bad = +m[1] - 1;
        msg = '"' + itemLabel(lines[bad].item) + '" lässt sich nicht berechnen: ' + (/quantity/i.test(m[2]) ? 'die Menge muss zwischen 1 und 20 liegen' : m[2].replace(/\.$/, '')) + '. Ändere die Menge mit \u2212 und + oder entferne die Position.';
      } else msg = error;
    }
    var html = '<ul class="cart-lines">';
    lines.forEach(function (l, i) {
      var ql = q && q.lines && q.lines[i];
      var name = (ql && ql.name) || itemLabel(l.item);
      var meta = ql && ql.summary ? ql.summary : '';
      var price = ql ? S.money(ql.total, q.currency) : (loading ? '…' : '');
      html += '<li class="cart-line' + (i === bad ? ' cart-line--bad' : '') + '" data-i="' + i + '"' + (i === bad ? ' aria-invalid="true"' : '') + '><div class="cart-line-main"><p class="cart-line-name">' + S.esc(name) + '</p>' +
        (meta ? '<p class="cart-line-meta">' + S.esc(meta) + '</p>' : '') +
        (l.note ? '<p class="cart-line-meta">Notiz: ' + S.esc(l.note) + '</p>' : '') + '</div>' +
        '<p class="cart-line-price">' + price + '</p>' +
        (isGuide(l) ? '<p class="cart-single">Einzelner Download</p>' :
        '<div class="shop-stepper cart-stepper" role="group" aria-label="Menge von ' + S.esc(name) + '">' +
        '<button type="button" data-act="dec" aria-label="Eine weniger">&minus;</button><output>' + l.qty + '</output>' +
        '<button type="button" data-act="inc" aria-label="Eine mehr">+</button></div>') +
        '<button type="button" class="cart-remove" data-act="rm" aria-label="Entfernen: ' + S.esc(name) + '">Entfernen</button></li>';
    });
    html += '</ul>';
    if (error) html += '<p class="cart-error" role="alert">' + S.esc(msg) + '</p>' + (offline ? '<button type="button" class="shop-btn cart-retry" data-act="retry">Erneut versuchen</button>' : '');
    body.innerHTML = html;

    var f = '';
    if (q) {
      f += '<dl class="cart-sums"><div><dt>Zwischensumme</dt><dd>' + S.money(q.subtotal, q.currency) + '</dd></div>';
      if (q.discount) f += '<div class="cart-discount"><dt>' + S.esc(q.discount.name || q.discount.code) + '</dt><dd>&minus;' + S.money(q.discount.amount, q.currency) + '</dd></div>';
      f += '<div class="cart-total"><dt>Gesamt</dt><dd>' + S.money(q.total, q.currency) + '</dd></div></dl>';
    } else if (loading) f += '<p class="cart-loading">Preise werden geprüft …</p>';
    f += '<a class="shop-btn cart-checkout" href="' + S.esc(S.url('pages/checkout.html')) + '"' + (q ? '' : ' aria-disabled="true"') + '>Zur Kasse</a>' +
      '<p class="shop-testlabel">' + S.esc(S.TEST_LABEL) + '</p>';
    foot.innerHTML = f;
    var co = foot.querySelector('.cart-checkout');
    if (co) co.addEventListener('click', function (e) { if (co.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
    if (bad >= 0) { var b = body.querySelector('.cart-line--bad .cart-stepper button, .cart-line--bad .cart-remove'); if (b && !body.contains(document.activeElement)) b.focus({ preventScroll: false }); }
  }

  function onBodyClick(e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    if (b.dataset.act === 'retry') { render(); return; }
    var li = b.closest('.cart-line'), i = +li.dataset.i, lines = S.cart().slice();
    if (!lines[i]) return;
    var act = b.dataset.act;
    if (act === 'inc') lines[i].qty = isGuide(lines[i]) ? 1 : Math.min(20, lines[i].qty + 1);
    else if (act === 'dec') { lines[i].qty -= 1; if (lines[i].qty < 1) lines.splice(i, 1); }
    else if (act === 'rm') lines.splice(i, 1);
    quote = null;
    S.saveCart(lines);
  }

  function init() {
    build(); mountButton(); updateCount();
    window.addEventListener('shop:cart', function () { updateCount(); if (drawer.classList.contains('is-open')) render(); });
    window.addEventListener('shop:cart-open', open);
    window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf(S.PREFIX + 'cart') === 0) { updateCount(); if (drawer.classList.contains('is-open')) render(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
