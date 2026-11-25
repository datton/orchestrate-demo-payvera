/* Händlerseite (Senior Dev 7): Filter nach Branche und Preise der passenden Pakete aus dem Katalog. */
(function () {
  'use strict';
  var chips = [].slice.call(document.querySelectorAll('.hd-chip')), stories = [].slice.call(document.querySelectorAll('.hd-story'));
  var count = document.getElementById('hd-count'), empty = document.getElementById('hd-empty');
  if (!chips.length) return;

  function apply(f, push) {
    var n = 0;
    stories.forEach(function (s) { var show = f === 'alle' || s.getAttribute('data-b') === f; s.hidden = !show; if (show) n++; });
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-f') === f ? 'true' : 'false'); });
    count.textContent = n + ' von ' + stories.length + ' Geschichten';
    empty.hidden = n !== 0;
    if (push) { try { history.replaceState(null, '', f === 'alle' ? location.pathname : '#' + f); } catch (e) {} }
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { apply(c.getAttribute('data-f'), true); }); });

  var h = (location.hash || '').slice(1);
  if (h && chips.some(function (c) { return c.getAttribute('data-f') === h; })) apply(h, false);

  // Preise der Pakete nur aus dem Katalog; ohne Katalog bleiben die Links ohne Preis stehen.
  if (window.Shop && Shop.catalog) {
    Shop.catalog().then(function (c) {
      var by = {}; ((c && c.items) || []).forEach(function (it) { by[it.id] = it; });
      [].forEach.call(document.querySelectorAll('a[data-item]'), function (a) {
        var it = by[a.getAttribute('data-item')]; if (!it) return;
        a.textContent = it.name + ' · ' + (it.price ? Shop.money(it.price) : '');
      });
    }).catch(function () {});
  }
})();
