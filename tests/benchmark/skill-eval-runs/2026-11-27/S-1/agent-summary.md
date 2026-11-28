Tier chosen: Tier 2. A terminal was available and the page and login were unknown. I scouted and logged in with agent-browser, saved the session, then audited with the CLI because the wick-ag-lens MCP tools were not available. Scope was WCAG 2.0 and 2.1, levels A and AA, with no screenshots.

Full JSON report: c:\Personal\GitHub_Repos\wick-ag-lens\output-samples\skill-eval-2026-11-27\S-1\audit-report.json (JSON only, the leading log lines are stripped).

Steps run (the report has 11 trail entries, one per step):
1. Baseline after login
2. Fill search "tent"
3. Press Enter (results filter to 2 tents)
4. Click `#filter-brand`
5. Tick the first brand checkbox (Northwind)
6. Open quick view `#qv-1`
7. Click `#qv-add`
8. Click `#cart-btn`
9. Click `#checkout-btn`
10. Fill `#co-email` with "not-an-email"
11. Click `#co-submit` (Place order)

## Health Summary (final state, from `global_summary`)
| Critical | Serious | Moderate | Minor | Manual |
|---|---|---|---|---|
| 64 | 5 | 6 | 0 | 0 |

- Informative items (93) are page-structure context and are not counted as issues.
- These counts are the issues still active after the last step, each counted once. Issues that appeared and were fixed earlier are not included. They are covered in the delta highlights below.

## Step-by-Step Delta Highlights
- **Step 1 (baseline):**
  - Header, grid and footer already have many barriers: 41 inaccessible SVGs, missing alt, empty links and buttons, and unlabeled inputs (`#search`, `#sort`, `#newsletter`).
  - Also present: a fake button link (`href="#"`), 8 duplicate IDs, 5 broken ARIA references, 8 contrast failures and 4 unfocusable clickable elements.
- **Step 2 (type "tent"):** 2 more images missing alt.
- **Step 3 (Enter):** the filtered list resolved most of the product-card issues (27 SVG, 5 alt, 3 empty buttons, 3 unfocusable, 8 duplicate IDs, 3 contrast). The tent cards add 2 duplicate IDs and 1 contrast failure.
- **Step 4 (open Brand):** adds 2 unlabeled checkboxes. They sit in a `div` and a `label` with no accessible name.
- **Step 5 (pick a brand):** no change.
- **Step 6 (quick view opens):**
  - Adds 1 inaccessible SVG (the close icon), 1 missing alt, 1 empty button, an unlabeled input (`#qv-qty`), duplicate `#price` and 2 contrast failures.
  - Adds a broken `aria-describedby="qv-qty-note"`.
  - Adds 11 `v-aria-hidden-focus` findings: focusable controls behind the modal sit inside an aria-hidden region.
- **Step 7 (add to cart):** closes the quick view, which resolves all of those. The toast adds 2 duplicate IDs.
- **Step 8 (cart opens):**
  - Adds 11 `v-aria-hidden-focus`. The cart `role="dialog"` has no valid name (`aria-labelledby="cart-title"` is broken).
  - Other new items: an `h6` heading that skips levels, a close button with no name, unlabeled `#qty`, a promo field that uses only a placeholder, a "Learn more" link, a `×` span with `onclick` that cannot be focused, and `tabindex="2"` on the toast link. Also new: a missing alt, duplicate IDs and 2 contrast failures.
- **Step 9 (checkout form appears):** adds an unlabeled input (`#co-name` or `#co-country`) and 1 contrast failure.
- **Step 10 (malformed email, Place order):** adds 1 `v-aria-invalid` (Serious). `#co-email` has `aria-invalid="true"` and `aria-describedby="co-email-error"`, but that element does not exist, so the error message is never announced.
- **Step 11:** no change.

## Prioritized Remediation Table
Fix text is from the report's `audit_dictionary`. "Step" is where the finding first appeared. Many rows stand for several elements, so I show a representative selector and the total count. Three audits are `pattern` or `best-effort`; their rows are marked **Needs confirmation** and carry the tool's note. Those are `v-suspicious-links`, `v-generic-link` and `v-placeholder-label`, and the best-effort ones are `v-unfocusable`, `v-text-contrast` and `v-heading-errors`.

| Severity | Audit ID | Step | Selector | Fix |
|---|---|---|---|---|
| Critical | v-aria-hidden-focus (11) | 8 (also 6) | `#filter-brand`, `#brand-panel input`, `.cta` and others | Make the hidden container `inert` or set `tabindex="-1"` on its controls, or remove `aria-hidden` if they should stay active. Snippet: `<button id="filter-brand" class="acc-btn" aria-expanded="true" aria-controls="brand-panel">Brand</button>`. Fix: set `inert` on the page content while a dialog is open and do not use `aria-hidden` on focusable regions. |
| Critical | v-svg-accessible (15) | 1, 8 | `#menu-toggle > svg`, `#wishlist-btn > svg`, `#account-link > svg` | Add `aria-hidden="true"` if decorative, or `aria-label` or a `<title>` if it conveys meaning. Snippet: `<svg viewBox="0 0 24 24"> ... </svg>`. Fix: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">` (the parent button gets the name). |
| Critical | v-unlabeled-inputs (8) | 1, 4, 8, 9 | `#search`, `#sort`, `#newsletter`, `#brand-panel input` (checkboxes), `#qty`, checkout field | Add a `<label for>`, wrap the input in a label, or add `aria-label`. Snippet: `<input type="checkbox">` in `.chk`. Fix: `<label><input type="checkbox"> Ridgeline</label>`. For search: `<input id="search" type="search" aria-label="Search products" ...>`. |
| Critical | v-empty-buttons (4) | 1, 8 | `#menu-toggle`, `#wishlist-btn`, `#grid > li > button`, `#cart-close` | Add text or `aria-label`. Snippet: `<button id="cart-close" class="icon-btn x"> ... </button>`. Fix: `<button id="cart-close" class="icon-btn x" aria-label="Close cart">`. |
| Critical | v-empty-links (3) | 1 | `#account-link`, footer Facebook and Instagram links | Add visible text or `aria-label`. Snippet: `<a id="account-link" class="icon-link" href="/account.html"> ... </a>`. Fix: add `aria-label="My account"`. |
| Critical | v-missing-alt (3) | 1, 2, 8 | `#main > section > img`, `#grid > li > img`, `#cart-drawer ... > img` | Add `alt` (empty `alt=""` if decorative). Snippet: `<img src="data:image/svg+xml;...">`. Fix: `<img src="..." alt="Ridgeline 2P Tent">` in cards and the cart line, `alt=""` for the banner if decorative. |
| Critical | v-broken-aria-ref (5) | 1, 6, 8, 10 | `#menu-toggle` (`aria-controls="cat-panel"`), `#search` (`aria-describedby="search-help"`), `#filter-price`, `#cart-drawer` (`aria-labelledby="cart-title"`), `#co-email` (`aria-describedby="co-email-error"`) | Point the attribute at an id that exists. Fix for the cart: give the heading `<h2 id="cart-title">Your cart</h2>`. For the email, create `<p id="co-email-error">`. |
| Critical | v-duplicate-id (1 active in the final state, 15 occurrences over the journey) | 3, 6, 7, 8 | `#price` (3 on the page: 2 in the grid, the quick view and the cart) | Make ids unique. Snippet: `<span id="price" class="price">$249</span>`. Fix: use a class, or `id="cart-price-1"`. |
| Critical | v-text-contrast (9 active) | 1, 3, 6, 8, 9 | `#main-nav > a.sale` (3.87:1), hero `p` (1.82:1), `#filters > p.note` (1.84:1), `span.old` (1.83:1), `#price` in quick view | Raise to at least 4.5:1 (3:1 for large text). Snippet: `<p class="note">Prices include VAT where applicable.</p>`. Fix: darken the note colour to about #595959 or darker. **Needs confirmation:** best-effort. Colours are computed, but text over images or gradients cannot be decided. |
| Critical | v-suspicious-links (1) | 1 | `#main > section > div > a` | Convert to a `<button>` or add `role="button"`. Snippet: `<a class="cta" href="#">Click here</a>`. Fix: use a real destination, for example `<a class="cta" href="/sale">Shop the summer sale</a>`. **Needs confirmation:** pattern, and it only finds links with `href="#"` or `javascript:`. |
| Critical | v-unfocusable (2 active) | 1, 8 | `#grid > li:nth-of-type(1) > div:nth-of-type(3) > div` ("Add to cart"), `#cart-drawer ... span.rm` (×) | Use a native `<button>`. Snippets: `<div class="add" onclick="addToCart(1)">Add to cart</div>`, `<span class="rm" onclick="void 0">×</span>`. Fixes: `<button type="button" class="add" onclick="addToCart(1)">Add to cart</button>`, `<button type="button" class="rm" aria-label="Remove Ridgeline 2P Tent">×</button>`. **Needs confirmation:** best-effort, and it only sees `onclick` attributes. |
| Serious | v-aria-invalid (1) | 10 | `#co-email` | Link a real error message with `aria-describedby` or `aria-errormessage`. Snippet: `<input id="co-email" type="email" required aria-describedby="co-email-error" aria-invalid="true">`. Fix: render `<p id="co-email-error" role="alert">Enter a valid email address, e.g. name@example.com</p>` and keep `aria-describedby="co-email-hint co-email-error"`. |
| Serious | v-tabindex (1) | 8 | `#overlay-root > div > a` (toast link) | Remove the positive tabindex. Snippet: `<a href="#cart" tabindex="2">Click here</a>`. Fix: `<a href="#cart">View cart</a>`. |
| Serious | v-placeholder-label (3) | 1, 8 | `#search`, `#newsletter`, `#promo` | Add a persistent label. Snippet: `<input id="promo" type="text" placeholder="Promo code">`. Fix: `<label for="promo">Promo code</label><input id="promo" ...>`. **Needs confirmation:** pattern. It checks only `label[for]` and ARIA names, so other valid naming methods are not considered. |
| Moderate | v-generic-link (5) | 1, 8 | `#main-nav > a:nth-of-type(5)` ("Click here for gift cards"), hero "Click here", footer "Read more", cart "Learn more", toast "Click here" | Use descriptive link text. Snippet: `<a href="#gift-cards">Click here for gift cards</a>`. Fix: `<a href="#gift-cards">Gift cards</a>`. **Needs confirmation:** best-effort. It matches a fixed list of English phrases, and a longer link text containing one of those words can match. |
| Moderate | v-heading-errors (1) | 8 | `#cart-drawer > h6` | Do not skip heading levels. Snippet: `<h6>Your cart</h6>`. Fix: `<h2 id="cart-title">Your cart</h2>`. **Needs confirmation:** best-effort. Skipped levels are exact, but fake-heading detection can give false positives. |

Counts: the totals above are `global_summary`, which is authoritative. My own per-audit tally while reading the trail came to 73 active items against the summary's 75. The difference comes from how I keyed elements by selector, not from the report. Duplicate IDs also span several steps, which is why that row shows one active but 15 occurrences over the journey.

## Needs manual review
No Manual-severity findings (Manual = 0). The text-contrast and unfocusable results are best-effort (see above), so a person should confirm them before acting. Also check by hand that focus moves into and stays inside the quick view and cart dialogs, and that the "Place order" error is actually announced to a screen reader.

## Detection Confidence
- **Rule audits (most dependable):** v-aria-hidden-focus, v-svg-accessible, v-unlabeled-inputs, v-empty-buttons, v-empty-links, v-missing-alt, v-broken-aria-ref, v-duplicate-id, v-aria-invalid, v-tabindex.
- **Pattern and best-effort audits** (marked Needs confirmation above): v-suspicious-links, v-unfocusable, v-text-contrast, v-placeholder-label, v-generic-link, v-heading-errors. An empty result from these does not prove the page is clean.

The agent-browser session is closed. I deleted the temporary `auth-state.json` (it held the logged-in session) and my raw and parse helper files, so `audit-report.json` is the only file left in the S-1 folder. I did not read anything under tests/ or the existing output-samples/.