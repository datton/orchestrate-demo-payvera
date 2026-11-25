# payvera.demo.orchestrate.ca

Payvera, ein fiktives Unternehmen für Kassen- und Bezahllösungen (QR-Codes für Tisch und Bezahlen, Tablets, digitale
Speisekarten), live gebaut vom Orchestrate-Solutions-Agententeam in einer Orchestrate-Demonstration. Statische Seite:
HTML, CSS und JavaScript. Deutsch (`html lang="de"`). Firma, Preise und Händler sind frei erfunden.

**Demo-Shop: nur Testzahlungen, es bewegt sich kein echtes Geld.** (Services-Seite: `"brand": {"kind": "services"}` in
`shop/catalog.json`, keine Stores, Währung EUR, Zeitzone Europe/Berlin.) Vorschau: `http://127.0.0.1:8796/s/payvera/`.
Sandbox-Karte 4242 4242 4242 4242 zahlt.

## Seiten und Zuständige
| Datei | Zuständig |
|---|---|
| `index.html`, `js/app.js` | Full-Stack |
| `pages/services.html` (Anker `#qr #tablets #menus #zubehoer`, Karten-ID = Artikel-ID), `shop/catalog.json`, `js/shop/services.js` | senior1 |
| Warenkorb `js/shop/cart.js` | senior2 |
| `pages/checkout.html` | senior3 |
| `pages/order.html`, `pages/account.html` | senior4 |
| `pages/rechner.html` (Gebühren- und Preisrechner) | senior5 |
| `pages/demo-termin.html` (Demo-Anfrage, Kalender) | senior6 |
| `pages/haendler.html` (Händlerseite) | senior7 |
| `pages/so-funktioniert.html` (QR-Bezahlen in Schritten, Mini-Demo) | senior8 |
| `css/tokens.css` | Designer |
| `css/layout.css`, `js/nav.js`, `js/motion.js` | UI/UX |
| `README.md`, `css/site.css`, `js/shop/core.js`, `css/shop/core.css` | Lead Developer |

## Gemeinsamer Vertrag
- `window.Shop` (`js/shop/core.js`): `api`, `catalog`, `cart/saveCart/addToCart/cartCount`, `money`, `toast`,
  `orders/addOrder`, `customerId`, `get/set` (Schlüssel `shop:payvera:`), `url`, `esc`, `download`, `TEST_LABEL`,
  `owns/owned`. Preise kommen nur aus `shop/catalog.json` (EUR, Demo-Preise). Mengen 1 bis 20.
- Rechner-Sätze, Gebühren und Demo-Einträge sind Beispielzahlen, als solche beschriftet. Keine echten Gebührensätze,
  keine Aussagen über Zulassungen oder Zahlungsdienstleister, keine genannten Banken oder Kartenmarken-Logos.
- **Eigenständiges Aussehen:** rotes und weißes Farbspiel, aber keine Marke, kein Logo, kein Schriftzug und keine
  Schreibschrift eines echten Unternehmens. Keine Bilder. QR-Codes auf der Seite sind erkennbar Beispiele
  (nicht scannbar oder auf Demo-Texte zeigend), nie echte Zahlungslinks.
- Demo-Termine, Rechnerwerte und Eingaben bleiben im Browser; Bestätigungen sagen das. Nichts wird gesendet.
- Keine erfundenen Telefonnummern, E-Mail-Adressen oder Anschriften.
- Bewegung: Attribute für `js/motion.js`. Nie `data-reveal` auf per JS eingefügten Inhalt; ein Ladefehler des Katalogs
  zeigt eine Wiederholen-Schaltfläche.
- Fußzeilensatz: "Fiktives Demo-Unternehmen. Preise und Leistungen sind Beispiele, keine Angebote."
