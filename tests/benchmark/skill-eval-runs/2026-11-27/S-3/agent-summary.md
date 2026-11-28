**Tier chosen:** Tier 2. A terminal was available, there were no `wick-ag-lens:*` MCP tools, and the page and its login were unknown. I scouted and logged in with agent-browser, saved the session, and audited with the CLI fallback using `-a ./auth-state.json`, WCAG 2.0 and 2.1, levels A and AA, with no screenshots.

The full JSON report is at `c:\Personal\GitHub_Repos\wick-ag-lens\output-samples\skill-eval-2026-11-27\S-3\audit-report.json`. I closed the agent-browser session. I did not read anything under tests/ or output-samples/.

The report has 10 entries: the baseline after login, then the 9 journey steps in order:
1. fill `#search` with "tent"
2. click `#filter-brand`
3. click the first brand checkbox (Northwind)
4. click `#qv-1`
5. click `#qv-add`
6. click `#cart-btn`
7. click `#checkout-btn`
8. fill `#co-email` with "not-an-email"
9. click `#co-submit`

## Health Summary
These are the issues still active after the last step. Issues that appeared and were fixed earlier are not counted, and Informative items are not counted.

| Critical | Serious | Moderate | Minor | Manual |
|---|---|---|---|---|
| 122 | 5 | 6 | 1 | 0 |

The Critical count is per element. It includes 42 inaccessible SVGs, 23 `aria-hidden` focusables and 11 `#price` duplicate IDs.

## Step-by-Step Delta Highlights
- **Baseline (home page after login):**
  - Most of the 113 other issues come from here and persist to the end.
  - SVG icons have no accessible name, images have no alt text, and the search, sort and newsletter fields are unlabeled.
  - The `Click here` links are generic, and the `Add to cart` divs can't be reached by keyboard.
  - `#price` is a duplicate ID, and some aria references point to nothing.
  - Text contrast fails.
- **Search "tent":** the suggestion images have no alt text.
- **Brand filter:** the filter button's broken aria reference is resolved. The two other brand checkboxes have no labels.
- **Brand checkbox:** no change.
- **Quick view opens:**
  - A modal appears with a duplicate `product-title` ID, a close button with no name, and a quantity field with no label.
  - `aria-labelledby="qv-heading"` and `aria-describedby="qv-qty-note"` point to IDs that don't exist.
  - The page behind the modal still has focusable elements inside an `aria-hidden` area.
  - The `#price` and quantity-hint text fails contrast.
- **Add to cart:** the modal closes and all of its issues are resolved.
- **Cart opens:**
  - The drawer has an `h6` heading that skips levels, a close button with no name, and a quantity field and promo code field with no labels.
  - `aria-labelledby="cart-title"` points to nothing.
  - A link has `tabindex="2"`.
  - `#cart-drawer` text fails contrast.
  - Focusable elements remain inside an `aria-hidden` area.
- **Checkout appears:** the country select has no label, and the email hint fails contrast.
- **Typing "not-an-email":** the audit found no new issues.
- **Place order:** `#co-email` gets `aria-invalid="true"` and `aria-describedby="co-email-error"`, but no element has that ID. The error message is not announced, so the user never learns what is wrong. This is a new Serious issue and a new Critical broken reference.

## Prioritized Remediation Table
Fix text comes from `audit_dictionary`. Confidence is `rule` unless marked "Needs confirmation". Where a finding spans many elements, one example is shown.

| Severity | Audit ID | Step | Selector | Fix |
|---|---|---|---|---|
| Critical | v-aria-hidden-focus | 4 and 6 | `#filter-brand`, `#main > section > div > a`, brand checkboxes (23 elements) | Use `inert` or `tabindex="-1"` on the hidden container, or remove `aria-hidden`. |
| Critical | v-svg-accessible | 0 | `#menu-toggle > svg` (42 elements) | Add `aria-hidden="true"` to decorative SVGs, or `aria-label`. |
| Critical | v-missing-alt | 0, 1, 4 | `#grid > li:nth-of-type(1) > img` (8 elements) | Add alt text, or `alt=""` for decorative images. |
| Critical | v-empty-links | 0 | `#account-link`, footer social links | Add an `aria-label` or hidden text. |
| Critical | v-empty-buttons | 0, 4, 6 | `#menu-toggle`, `#wishlist-btn`, `#qv-close`, `#cart-close` (7 elements) | Add `aria-label`. |
| Critical | v-unlabeled-inputs | 0, 2, 4, 6, 7 | `#search`, `#sort`, `#newsletter`, `#qv-qty`, `#qty`, `#promo`, `#co-country`, brand checkboxes (8 elements) | Add `<label for>` or `aria-label`. |
| Critical | v-duplicate-id | 0, 4, 6 | `#price` (11 elements), `#product-title` | Make every ID unique. |
| Critical | v-broken-aria-ref | 0, 4, 6, 8 | `#cat-panel`, `#search-help`, `#cart-drawer`, `#qv-heading`, `#qv-qty-note`, `#cart-title`, `#co-email-error` (5 elements active) | Point each reference at an element that exists. |
| Critical | v-text-contrast | 0, 4, 6, 7 | `#main > section > div > p` | Reach 4.5:1 for normal text. |
| Critical | v-unfocusable | 0 | `#grid > li:nth-of-type(1) > div:nth-of-type(3) > div` (5 elements) | Use a native `<button>`. |
| Critical | v-suspicious-links | 0 | `#main > section > div > a` | Convert to a `<button>` or add `role="button"`. |
| Serious | v-aria-invalid | 9 | `#co-email` | Link a real, visible error message with `aria-describedby` or `aria-errormessage`. |
| Serious | v-tabindex | 6 | `#overlay-root > div > a` | Remove `tabindex="2"`. |
| Serious | v-placeholder-label | 0, 6 | `#search`, `#newsletter`, `#promo` | Add a persistent label. |
| Moderate | v-heading-errors | 4 (resolved), 6 | `#cart-drawer > h6` | Use a heading level that doesn't skip. |
| Moderate | v-generic-link | 0, 6 | `#main-nav > a:nth-of-type(5)`, `#main > section > div > a` (5 elements) | Rewrite the link text. |
| Minor | v-redundant-alt | 0 | `#grid > li:nth-of-type(2) > img` | Remove "image of" from the alt text. |

Example snippets and corrected code:
- **v-aria-hidden-focus:** `<button id="filter-brand" class="acc-btn" aria-expanded="true" aria-controls="brand-panel">Brand</button>` sits inside an `aria-hidden` area. Add `inert` to the hidden background, or remove `aria-hidden`.
- **v-svg-accessible:** `<svg viewBox="0 0 24 24">…` becomes `<svg aria-hidden="true" …>`.
- **v-missing-alt:** `<img src="…">` becomes `<img src="…" alt="Ridgeline 2P Tent">`.
- **v-empty-links:** `<a id="account-link" class="icon-link" href="/account.html">…</a>` becomes the same link with `aria-label="My account"`.
- **v-empty-buttons:** `<button id="menu-toggle" class="icon-btn" aria-expanded="false" aria-controls="cat-panel">` becomes the same button with `aria-label="Menu"` and `aria-controls` pointing to a real ID.
- **v-unlabeled-inputs:** `<input id="search" type="search" placeholder="Search tents, boots, packs..." …>` gets `<label for="search">Search</label>` or `aria-label="Search"`.
- **v-duplicate-id:** `<span id="price" class="price">$249</span>` becomes `<span class="price">$249</span>`, or gets a per-product ID such as `price-1`.
- **v-broken-aria-ref:** `<input id="search" … aria-describedby="search-help">` needs an element with `id="search-help"`.
- **v-text-contrast:** `<p>Free shipping on orders over $75. Offer ends Sunday.</p>` measured 1.82:1. Darken the text colour to at least 4.5:1.
- **v-unfocusable:** `<div class="add" onclick="addToCart(1)">Add to cart</div>` becomes `<button class="add" onclick="addToCart(1)">Add to cart</button>`.
- **v-suspicious-links:** `<a class="cta" href="#">Click here</a>` becomes `<button class="cta">Browse the sale</button>`.
- **v-aria-invalid:** `<input id="co-email" type="email" required aria-describedby="co-email-error" aria-invalid="true">` needs `<div id="co-email-error" role="alert">Enter a valid email, for example name@example.com</div>`.
- **v-tabindex:** `<a href="#cart" tabindex="2">Click here</a>` becomes `<a href="#cart">View your cart</a>`.
- **v-placeholder-label:** `<input id="promo" type="text" placeholder="Promo code">` gets `<label for="promo">Promo code</label>`.
- **v-heading-errors:** `<h6>Your cart</h6>` becomes `<h2 id="cart-title">Your cart</h2>`.
- **v-generic-link:** `<a href="#gift-cards">Click here for gift cards</a>` becomes `<a href="#gift-cards">Gift cards</a>`.
- **v-redundant-alt:** `alt="image of boots"` becomes `alt="Summit Trail Boots"`.

### Detection Confidence
- **Needs confirmation (`pattern`):**
  - v-suspicious-links finds only `href="#"` or `javascript:` links.
  - v-placeholder-label checks only `label[for]` and ARIA names, so other valid ways of naming a field are not considered.
- **Needs confirmation (`best-effort`):**
  - v-generic-link matches a fixed list of English phrases.
  - v-redundant-alt matches the English words "image", "photo" and similar.
  - v-heading-errors guesses fake headings from class names.
  - v-text-contrast cannot decide text over images or gradients, and does not model overlapping elements.
  - v-unfocusable only sees `onclick` attributes on div, span and section, not handlers added in JavaScript.
- **Rule-based:** the other audits above are `rule` and the most dependable.

### Needs manual review
There are no Manual findings (the count is 0). Even so, a person should check these:
- Focus is trapped and returned correctly in the quick-view modal and the cart drawer.
- Contrast of text that sits over images.
- Whether the form validation message is actually shown to users.