Tier: Tier 2, using the CLI fallback. A terminal was available, the page and its login were unknown, and no wick-ag-lens MCP tools were present. I scouted and logged in with agent-browser to find the ids, then ran `node cli/index.js audit` with WCAG 2.0 and 2.1, levels A and AA, and no screenshots.

Report saved: c:\Personal\GitHub_Repos\wick-ag-lens\output-samples\skill-eval-2026-11-27\S-2\audit-report.json (pure JSON, with the log lines stripped). The agent-browser session is closed.

The audit ran 11 steps: the initial load plus the 10 actions below.
1. Search: fill #search "tent", then press Enter.
2. Brand filter: click #filter-brand, then click the first brand checkbox ("Northwind").
3. Quick view: click #qv-1, then #qv-add.
4. Cart and checkout: click #cart-btn, then #checkout-btn.
5. Invalid form: fill #co-email "not-an-email", then click #co-submit.

## Health Summary (final state, from global_summary)
| Severity | Count |
|---|---|
| Critical | 64 |
| Serious | 5 |
| Moderate | 6 |
| Minor | 0 |
| Manual | 0 |

These counts describe the state when the last step finished. Issues that appeared and were fixed earlier are not in them; they are covered in the delta highlights. Informative items (93) are page structure, not issues, so they are not counted.

## Step-by-Step Delta Highlights
- **Step 1, page load:** Baseline of 84 Critical, 2 Serious, 3 Moderate, 1 Minor. It includes:
  - 41 SVGs with no accessible name.
  - 5 images with no alt.
  - Icon-only buttons and links with no name.
  - Unlabeled #search, #sort and #newsletter.
  - Placeholder used as the label.
  - A broken `aria-controls` or `aria-describedby` on #menu-toggle, #search, #cart-btn, #filter-brand and #filter-price.
  - Duplicate `id="price"` (8 times).
  - "Add to cart" divs with `onclick` that cannot take focus.
  - Low text contrast.
  - Vague "Click here" and "Read more" links.
- **Step 2, fill "tent":** Two search-suggestion images with no alt appeared.
- **Step 3, press Enter:** The grid was filtered to 2 products, so about 45 findings from the removed products were resolved. Critical dropped from 86 to 40. Nothing serious was introduced.
- **Step 4, open Brand:** Two brand checkboxes with no label appeared. The broken `aria-controls` on #filter-brand was resolved.
- **Step 5, pick brand:** No change.
- **Step 6, quick view:** Critical rose from 41 to 63. New issues:
  - Close button with no name.
  - Unlabeled quantity input #qv-qty.
  - Broken ARIA references on #qv and #qv-qty.
  - Product image with no alt.
  - Low contrast on the price and hint text.
  - Duplicate ids.
  - 11 focusable controls behind the dialog that are still `aria-hidden` (`v-aria-hidden-focus`).
- **Step 7, add to cart:** The modal closed and all of those findings were resolved. Only a duplicate #price remained.
- **Step 8, open cart:** New issues:
  - Cart drawer image with no alt.
  - Close button with no name.
  - Unlabeled #qty and #promo.
  - A non-focusable "×" remove span.
  - Heading skip: `<h6>` "Your cart".
  - `tabindex="2"` on a link.
  - Another `aria-hidden-focus` group of 11.
  - Vague link text.
  - Broken ARIA reference on #cart-drawer.
- **Step 9, checkout:** #co-country has no label, and #co-email-hint has low contrast.
- **Step 10, malformed email:** `v-aria-invalid` fired on #co-email, and `v-broken-aria-ref` fired on the same field.
- **Step 11, Place order:** No new findings.

## Prioritized Remediation Table (final-state issues, grouped)
Fixes are taken from the report's `audit_dictionary` `info.fix`. Detection is `rule` unless marked **Needs confirmation**.

### Critical
| Severity | Audit ID | Step | Selector | Fix |
|---|---|---|---|---|
| Critical | v-aria-hidden-focus (11 elements) | 6, 8 | #main > section > div > a, #filter-brand, #filter-price, #sort, brand checkboxes, #qv-1 and others | Set `tabindex="-1"` or `inert` on the hidden container, or remove `aria-hidden`. Example: `<main inert>` while the dialog is open. |
| Critical | v-svg-accessible (15 still active) | 1, 6, 8 | #menu-toggle > svg, #wishlist-btn > svg, #account-link > svg, #cart-close > svg | Add `aria-hidden="true"` for decorative SVGs, or `aria-label` if they convey meaning. Snippet: `<svg viewBox="0 0 24 24">…</svg>` becomes `<svg aria-hidden="true" viewBox="0 0 24 24">…</svg>`. |
| Critical | v-unlabeled-inputs (8) | 1, 4, 8, 9 | #search, #sort, #newsletter, #qty, #promo, #co-country, brand checkboxes | Add a `<label for>` or `aria-label`. Snippet: `<input id="newsletter" type="text" placeholder="Your email address">` becomes `<label for="newsletter">Email address</label><input id="newsletter" type="email">`. |
| Critical | v-empty-buttons (4) | 1, 8 | #menu-toggle, #wishlist-btn, .wish-card buttons, #cart-close | Add `aria-label`. Snippet: `<button id="menu-toggle" class="icon-btn" aria-expanded="false" aria-controls="cat-panel">…</button>` gets `aria-label="Menu"`. |
| Critical | v-empty-links (3) | 1 | #account-link, footer links `#facebook` and `#instagram` | Add `aria-label`. Snippet: `<a id="account-link" class="icon-link" href="/account.html">…</a>` gets `aria-label="My account"`. |
| Critical | v-missing-alt (3) | 1, 8 | #main > section > img, #grid > li:nth-of-type(1) > img, #cart-drawer > div:nth-of-type(1) > img | Add `alt` text, or `alt=""` for decorative images. Snippet: `<img src="data:image/svg+xml…">` gets `alt="Ridgeline 2P Tent"`. |
| Critical | v-broken-aria-ref (5) | 1, 10 | #menu-toggle, #search, #filter-price, #co-email and others | Make the referenced id exist. Snippet: `aria-controls="cat-panel"` and `aria-describedby="search-help"` point to ids that are missing. Add the elements, or remove the attributes. |
| Critical | v-duplicate-id | 1, 3, 6, 8 | #price (repeated across product cards); #product-title in the dialog | Make ids unique, for example `id="price-1"`. |
| Critical | v-suspicious-links, **Needs confirmation** (pattern) | 1 | #main > section > div > a | Detection note: it only detects `href="#"` or `javascript:`. Fix: if the link performs an action, convert it to a `<button>`. Snippet: `<a class="cta" href="#">Click here</a>` becomes `<button class="cta">View the sale</button>`. |
| Critical | v-unfocusable, **Needs confirmation** (best-effort) | 1, 8 | .add divs in the grid, e.g. `<div class="add" onclick="addToCart(1)">Add to cart</div>`; cart `<span class="rm" onclick="void 0">×</span>` | Detection note: it only finds div, span and section elements with an `onclick` attribute, so click handlers added in JavaScript are missed. Fix: use `<button type="button" onclick="addToCart(1)">Add to cart</button>`, and `aria-label="Remove item"` for the remove control. |
| Critical | v-text-contrast, **Needs confirmation** (best-effort) | 1, 6, 8, 9 | #main-nav > a.sale, #main > section > div > p, #filters > p, #price, #qv-qty-hint, #co-email-hint and others | Detection note: colors are computed, but text over images or gradients is not decided. Fix: reach 4.5:1 for normal text (3:1 for large text) by darkening the text or changing the background. |

### Serious
| Severity | Audit ID | Step | Selector | Fix |
|---|---|---|---|---|
| Serious | v-placeholder-label, **Needs confirmation** (pattern) | 1, 8 | #search, #newsletter, #promo | Detection note: it only checks `label[for]` and ARIA names. Fix: add a persistent label. Snippet: `<input id="promo" type="text" placeholder="Promo code">` gets `<label for="promo">Promo code</label>`. |
| Serious | v-tabindex | 8 | #overlay-root > div > a | Remove the positive tabindex. Snippet: `<a href="#cart" tabindex="2">Click here</a>` becomes `<a href="#cart">Go to cart</a>`. |
| Serious | v-aria-invalid | 10 | #co-email | Link a real error message to the field. Snippet: `<input id="co-email" type="email" required aria-describedby="co-email-error" aria-invalid="true">`. The `#co-email-error` element must exist and contain the error text, for example "Enter a valid email address". |

### Moderate
| Severity | Audit ID | Step | Selector | Fix |
|---|---|---|---|---|
| Moderate | v-generic-link, **Needs confirmation** (best-effort) | 1, 8 | #main-nav gift-card link, #main > section > div > a, footer "Read more", cart "Click here" and "Learn more" | Detection note: it matches a fixed list of English phrases. Fix: use descriptive text. Snippet: `<a href="#gift-cards">Click here for gift cards</a>` becomes `<a href="#gift-cards">Gift cards</a>`. |
| Moderate | v-heading-errors, **Needs confirmation** (best-effort) | 8 | #cart-drawer > h6 | Detection note: skipped levels are exact, but fake headings are guessed. Fix: change `<h6>Your cart</h6>` to the correct next level (for example `<h2>`). |

### Needs manual review
None. The report has 0 Manual findings. The contrast findings flagged above should still be checked by a person where text sits over images.

## Detection Confidence
- Most findings come from `rule` audits, which are the most dependable.
- The following are `pattern` or `best-effort` audits and are marked "Needs confirmation" above: `v-suspicious-links`, `v-unfocusable`, `v-text-contrast`, `v-placeholder-label`, `v-generic-link` and `v-heading-errors`.
- An empty result from these audits is not proof that the page is clean.
- A clean result does not prove the page is fully accessible either.

## Notes
- The validation step was a malformed email only. Step 11 (Place order) produced no new findings, but the tool flagged the invalid-field markup on #co-email.
- Selector `#filters input >> nth=0` worked for the unlabeled brand checkbox.