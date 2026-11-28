I audited the full purchase journey and every step ran. At the end of the journey the page has **75 active issues** (64 Critical, 5 Serious, 6 Moderate), and the checkout's own error message is not connected to the email field.

**Tier:** Tier 2. No `wick-ag-lens:*` MCP tools were available, a terminal was, and the page and login were unknown. I logged in and scouted with agent-browser, saved the session, then ran the CLI fallback (`--wcag-version 2.0,2.1 --wcag-level A,AA -a ./auth-state.json`) with 10 `--step`s: fill search, press Enter, open Brand, tick "Northwind", open quick view `#qv-1`, `#qv-add`, `#cart-btn`, `#checkout-btn`, type "not-an-email" into `#co-email`, click `#co-submit`.

The full report is saved as `c:\Personal\GitHub_Repos\wick-ag-lens\output-samples\skill-eval-2026-11-27\O-3\audit-report.json`. I removed the CLI's `[Audit]` log lines so the file is pure JSON. The agent-browser session is closed, and I deleted the temporary `auth-state.json` because it held session cookies.

## Health Summary (final state, after "Place order")
| Critical | Serious | Moderate | Minor | Manual |
|---|---|---|---|---|
| 64 | 5 | 6 | 0 | 0 |

These counts are what was still active after the last step; each issue is counted once even if it lasted several steps. Issues that appeared and were then fixed (for example the quick-view dialog's issues) are not included; they are in the highlights below. Informative structure items (93) are not counted.

## Step-by-Step Delta Highlights
- **Baseline (logged-in shop):** 41 SVGs without a text alternative, 5 images with no alt, 6 empty buttons, 3 empty links, 3 unlabeled inputs (`#search`, `#sort`, `#newsletter`), 2 fields labeled only by placeholder, 8 duplicate `id="price"`, 5 broken ARIA references, 8 text-contrast failures, 4 clickable `div`s that can't be focused, a "Click here" link with `href="#"`, and 3 vague link texts.
- **Typing "tent":** a suggestions list appears with 2 images missing alt.
- **Pressing Enter (results):** the grid shrinks to 2 products, so many grid issues resolve. One new contrast failure (`$449` old price) and new duplicate `#price` ids.
- **Opening Brand:** the broken `aria-controls` on `#filter-brand` is resolved. Two new Critical issues: the Ridgeline and Cascade checkboxes have no label (only Northwind is wrapped in a `<label>`).
- **Ticking Northwind:** no change. The brand filter also doesn't change the results.
- **Quick view:** 23 new issues, including 11 controls that are `aria-hidden` but still focusable behind the modal, an icon-only close button, an unlabeled quantity field, a missing alt, broken `aria-labelledby`/`aria-describedby`, duplicate `#product-title`/`#price`, and low contrast on the price and hint.
- **Add to cart:** the dialog closes and all its issues resolve.
- **Opening the cart:** the biggest regression. The same 11 `aria-hidden`-but-focusable controls come back, `aria-labelledby="cart-title"` points to nothing, and there is an `<h6>` that skips heading levels, unlabeled `#qty`/`#promo`, an icon-only close button, an unfocusable remove "×", a positive `tabindex="2"` link in a toast, a low-contrast toast, and "Learn more"/"Click here" links.
- **Checkout:** the country `<select>` has no label, and the email hint has low contrast (1.91:1).
- **Entering "not-an-email":** the email error appears as you type, so the barriers show up at this step. `aria-invalid="true"` is set, but `aria-describedby="co-email-error"` points to an id that doesn't exist (the message's id is `co-email-err`). The error text is never announced.
- **Place order:** no further change.

## Prioritized Remediation Table
Fix text comes from `audit_dictionary`. "Needs confirmation" marks pattern or best-effort audits (notes below the table). Step numbers are the report's `audit_trail` index: 0 = baseline, 3 = Brand opened, 7 = cart opened, 8 = checkout, 9 = invalid email typed.

| Severity | Audit ID | Step | Selector | htmlSnippet | Fix |
|---|---|---|---|---|---|
| Critical | v-aria-hidden-focus | 7 | 11 background controls behind the open cart: `#main > section > div > a`, `#filter-brand`, the 3 brand checkboxes, `#filter-price`, `#sort`, `#grid > li:nth-of-type(1) > button`, `#qv-1`, `#qv-5`, li 2 "Add to cart" | `<button id="filter-brand" class="acc-btn" aria-expanded="true" aria-controls="brand-panel">Brand</button>` | Set them to `tabindex="-1"` or use `inert` on the container of a hidden dialog or closed menu, or remove `aria-hidden="true"`. Example: put `inert` on `<main>` while the drawer is open. |
| Critical | v-broken-aria-ref | 9 | `#co-email` | `<input id="co-email" type="email" required aria-describedby="co-email-error" aria-invalid="true">` | The id in the ARIA attribute must match an existing element. Example: `aria-describedby="co-email-err co-email-hint"`. |
| Critical | v-broken-aria-ref | 7 | `#cart-drawer` | `<aside id="cart-drawer" role="dialog" aria-labelledby="cart-title">` | Same fix. Example: `<h2 id="cart-title">Your cart</h2>`. |
| Critical | v-broken-aria-ref | 0 | `#menu-toggle`, `#search`, `#filter-price` | `aria-controls="cat-panel"`, `aria-describedby="search-help"`, `aria-controls="price-panel"` | Same fix: add the referenced elements, or remove the attributes. |
| Critical | v-duplicate-id | 7 | `#price` (x3) | `<span id="price" class="price">$249</span>` | Make every id unique. Example: `id="price-1"`, `id="cart-price-1"`. |
| Critical | v-empty-buttons | 0 / 7 | `#menu-toggle`, `#wishlist-btn`, `#grid > li:nth-of-type(1) > button`, `#cart-close` | `<button id="cart-close" class="icon-btn x"><svg>...</svg></button>` | Add visible text, or `aria-label` for icon-only buttons. Example: `<button id="cart-close" aria-label="Close cart"><svg aria-hidden="true">...</svg></button>`. |
| Critical | v-empty-links | 0 | `#account-link`, footer `a[href="#facebook"]`, `a[href="#instagram"]` | `<a id="account-link" href="/account.html"><svg>...</svg></a>` | Add inner text or `aria-label`. Example: `<a id="account-link" href="/account.html" aria-label="Your account">`. |
| Critical | v-missing-alt | 0 / 7 | `#main > section > img`, `#grid > li:nth-of-type(1) > img`, `#cart-drawer > div:nth-of-type(1) > img` | `<img src="data:image/svg+xml;...">` | Add a short alt for content images, or `alt=""` if decorative. Example: `<img src="..." alt="Ridgeline 2P Tent">`. |
| Critical (needs confirmation) | v-suspicious-links | 0 | `#main > section > div > a` | `<a class="cta" href="#">Click here</a>` | Use a `<button>` for on-page actions, or `role="button"`. Example: `<a class="cta" href="/sale">Shop the summer sale</a>`. |
| Critical | v-svg-accessible | 0 / 7 | 14 SVGs: header icons, li 1 and li 2 rating stars, footer social icons, `#cart-close > svg` | `<svg viewBox="0 0 24 24">...</svg>` | Add `aria-label` or `<title>` if the SVG has meaning, `aria-hidden="true"` if decorative. Example: `<svg aria-hidden="true" focusable="false">`; for stars, `<div role="img" aria-label="4 out of 5 stars">`. |
| Critical (needs confirmation) | v-text-contrast | 0 / 2 / 7 / 8 | `#main-nav > a:nth-of-type(4)` (3.87:1), `#main > section > div > p` (1.82:1), `#filters > p`, `.old` prices li 1 and li 2, footer "Read more", `#cart-drawer > p:nth-of-type(2)`, `#overlay-root > div` (3.50:1), `#co-email-hint` (1.91:1) | `<p id="co-email-hint" class="note">We send the receipt here.</p>` | Raise contrast to 4.5:1 for normal text, 3:1 for large text. Example: `.note{color:#595959}` on white. |
| Critical (needs confirmation) | v-unfocusable | 0 / 7 | `#grid > li:nth-of-type(1) > div:nth-of-type(3) > div`, `#cart-drawer > div:nth-of-type(1) > span:nth-of-type(2)` | `<div class="add" onclick="addToCart(1)">Add to cart</div>`, `<span class="rm" onclick="void 0">×</span>` | Use a native `<button>`, or add `tabindex="0"`, a role, and Enter/Space handlers. Example: `<button class="rm" aria-label="Remove Ridgeline 2P Tent">×</button>`. |
| Critical | v-unlabeled-inputs | 0 / 3 / 7 / 8 | `#search`, `#sort`, `#newsletter`, the Ridgeline and Cascade brand checkboxes, `#qty`, `#promo`, `#co-country` | `<div class="chk"><input type="checkbox"> Ridgeline</div>`, `<select id="co-country">` | Add `<label for>`, wrap the input in a label, or use `aria-label`. Example: `<label><input type="checkbox"> Ridgeline</label>`; `<label for="co-country">Country</label>`. |
| Serious | v-aria-invalid | 9 | `#co-email` | `<input id="co-email" ... aria-invalid="true">` | Link the error with `aria-errormessage` or `aria-describedby`. Example: `aria-invalid="true" aria-describedby="co-email-err"` (the error `<p>` is `id="co-email-err"`). |
| Serious (needs confirmation) | v-placeholder-label | 0 / 7 | `#search`, `#newsletter`, `#promo` | `<input id="promo" type="text" placeholder="Promo code">` | Add a persistent label. Example: `<label for="promo">Promo code</label>`. |
| Serious | v-tabindex | 7 | `#overlay-root > div > a` | `<a href="#cart" tabindex="2">Click here</a>` | Remove the positive tabindex; use DOM order or `tabindex="0"`. Example: `<a href="#cart">View cart</a>`. |
| Moderate (needs confirmation) | v-generic-link | 0 / 7 | `#main-nav > a:nth-of-type(5)`, `#main > section > div > a`, footer "Read more", `#cart-drawer > p:nth-of-type(2) > a`, toast "Click here" | `<a href="#shipping">Learn more</a>` | Make the link text describe the destination. Example: `<a href="#shipping">Learn more about shipping</a>`. |
| Moderate (needs confirmation) | v-heading-errors | 7 | `#cart-drawer > h6` | `<h6>Your cart</h6>` | Headings should go up one level at a time. Example: `<h2 id="cart-title">Your cart</h2>`. |

**Needs manual review:** none. The final state has no Manual findings.

## Detection Confidence
Most audits above use `rule` detection: aria-hidden-focus, broken-aria-ref, duplicate-id, empty-buttons/links, missing-alt, svg-accessible, unlabeled-inputs, aria-invalid, tabindex. These are the most dependable but still don't prove the page is fully accessible. The others need confirmation before acting:
- **v-text-contrast** (best-effort): "Colors are computed, but text over images or gradients cannot be decided... Overlapping elements are not modelled."
- **v-unfocusable** (best-effort): "Click handlers attached in JavaScript (addEventListener, frameworks) cannot be seen, so an empty result does not prove there are none."
- **v-generic-link** (best-effort): "Matches a fixed list of English phrases... a longer link text containing one of these words can match." For example "Click here for gift cards".
- **v-heading-errors** (best-effort): skipped levels are exact; fake headings are guessed from class names.
- **v-suspicious-links** (pattern): "Only detects links whose href is '#' or starts with 'javascript:'."
- **v-placeholder-label** (pattern): "Checks for a label[for] and ARIA names only."

For a visual report, open `node_modules/wick-ag-lens/report-template/wick-ag-lens-viewer.html` in a browser and drop the JSON file onto it.