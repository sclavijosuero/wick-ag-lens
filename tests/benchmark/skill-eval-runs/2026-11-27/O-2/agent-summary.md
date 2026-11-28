Approach: **Tier 2.** There were no `wick-ag-lens:*` MCP tools, a terminal was available, and both the page and its login were new to me. I logged in and scouted the whole journey with agent-browser, saved the session, and ran the audit with the CLI (`node cli/index.js audit ... -a <state> --wcag-version 2.0,2.1 --wcag-level A,AA` with 10 `--step`s). Every step ran, and the audit stayed logged in on `/app/bench-shop.html`. The agent-browser session is closed and the temporary auth-state file is deleted.

Full report: `c:\Personal\GitHub_Repos\wick-ag-lens\output-samples\skill-eval-2026-11-27\O-2\audit-report.json` (clean JSON, without the `[Audit]` log lines).

Steps audited: 1 page load (logged in) · 2 type "tent" in `#search` · 3 press Enter · 4 open Brand (`#filter-brand`) · 5 tick "Northwind" · 6 Quick view of the first product (`#qv-1`) · 7 Add to cart (`#qv-add`) · 8 open the cart (`#cart-btn`) · 9 Checkout (`#checkout-btn`) · 10 type "not-an-email" in `#co-email` · 11 Place order (`#co-submit`).

## Health Summary
These counts are the issues still active after the last step (Place order). Issues that appeared and were fixed earlier, such as the whole quick-view dialog, are not in them; the delta highlights cover those.

| Critical | Serious | Moderate | Minor | Manual |
|---|---|---|---|---|
| 64 | 5 | 6 | 0 | 0 |

The 93 Informative items (page structure) are not counted. I rebuilt these counts from the step deltas and they match `global_summary`.

## Step-by-Step Delta Highlights
- **Step 1, page load:** 41 SVGs with no name or `aria-hidden`; 6 empty buttons and 3 empty links (icon-only header, wishlist and social links); `#search`, `#sort` and `#newsletter` have no label; `div onclick` "Add to cart" controls that keyboards cannot reach; 8 elements share `id="price"`; 5 broken ARIA references; 8 text-contrast failures (1.8:1 to 3.9:1); a `href="#"` link used as a button; "Click here" and "Read more" links.
- **Step 2, typing "tent":** the suggestions list adds 2 images with no alt. Step 3 removes them again.
- **Step 3, Enter (results):** filtering to 2 products removes many grid issues (27 SVG, 5 missing-alt, 3 empty-button, 3 unfocusable). The rest stay on the 2 remaining cards.
- **Step 4, Brand open:** 2 brand checkboxes (Ridgeline, Cascade) have no label because they sit in a `div`, not a `label`. The `aria-controls="brand-panel"` reference now resolves.
- **Step 5, Northwind ticked:** no change. The product list also did not change (still 2 tents).
- **Step 6, Quick view:** the dialog brings in a close button with no name, an image with no alt, an unlabeled `#qv-qty`, broken `aria-labelledby="qv-heading"` and `aria-describedby="qv-qty-note"`, a duplicate `#product-title`, a low-contrast `#price` and `#qv-qty-hint`, and 11 focusable elements behind `aria-hidden`. **Step 7 (Add to cart) closes the dialog and removes all of them.**
- **Step 8, cart drawer:** the biggest regression. The page behind the drawer is `aria-hidden` but its 11 controls can still take focus. Also new: `role="dialog"` with a broken `aria-labelledby="cart-title"`, an `<h6>` that skips heading levels, a close button with no name, an image with no alt, unlabeled `#qty` and `#promo` (placeholder only), a "×" remove control that is a `span onclick`, a toast link with `tabindex="2"` and the text "Click here", and 2 contrast failures. `#cart-btn`'s `aria-controls` now resolves.
- **Step 9, checkout:** `#co-country` has no label, and the email hint has low contrast.
- **Step 10, malformed email:** the error shows as soon as the field is filled. `#co-email` gets `aria-invalid="true"`, but its `aria-describedby="co-email-error"` points to an id that does not exist (the message's id is `co-email-err`). Screen readers are told the field is invalid but not why.
- **Step 11, Place order:** no further change.

## Prioritized Remediation Table
The Fix text comes from `audit_dictionary` `info.fix`. Rows marked **Needs confirmation** come from `pattern` or `best-effort` audits; the note after the table says what to verify.

### Critical
| Severity | Audit ID | Step | Selector | Fix |
|---|---|---|---|---|
| Critical | v-unlabeled-inputs | 1 | `#search`, `#sort`, `#newsletter` | Add a `<label for="input-id">` that targets the input's ID, nest the input inside a `<label>`, or provide a descriptive aria-label. |
| Critical | v-unlabeled-inputs | 4 | `#brand-panel > fieldset > div:nth-of-type(1\|2) > input` | same |
| Critical | v-unlabeled-inputs | 8 | `#qty`, `#promo` | same |
| Critical | v-unlabeled-inputs | 9 | `#co-country` | same |
| Critical | v-broken-aria-ref | 1 | `#menu-toggle` (cat-panel), `#search` (search-help), `#filter-price` (price-panel) | Make the ID in the ARIA attribute exactly match the id of an element that exists in the DOM. |
| Critical | v-broken-aria-ref | 8 | `#cart-drawer` (cart-title) | same |
| Critical | v-broken-aria-ref | 10 | `#co-email` (co-email-error) | same |
| Critical | v-aria-hidden-focus | 8 | 11 controls behind the drawer: `#filter-brand`, `#filter-price`, `#sort`, `#qv-1`, `#qv-5`, the brand checkboxes, the CTA, the wishlist and Add to cart | If the element is in a hidden dialog or closed menu, set tabindex="-1" or put `inert` on its container; or remove aria-hidden="true" if the control should be active. |
| Critical | v-empty-buttons | 1 / 8 | `#menu-toggle`, `#wishlist-btn`, `#grid > li:nth-of-type(1) > button`, `#cart-close` | Provide visible text inside the button; for icon-only buttons add aria-label="Action Description". |
| Critical | v-empty-links | 1 | `#account-link`, `footer a[href="#facebook"]`, `footer a[href="#instagram"]` | Provide visible inner text; for icon-only links add an aria-label or visually hidden text describing the destination. |
| Critical | v-svg-accessible | 1 / 8 | 15 SVGs (`#menu-toggle > svg`, `#wishlist-btn > svg`, `#account-link > svg`, the rating stars in `#grid li div:nth-of-type(2) > svg`, the footer icons, `#cart-close > svg`) | If the SVG conveys meaning, add aria-label or a `<title>` referenced by aria-labelledby; if it is decorative, add aria-hidden="true". |
| Critical | v-missing-alt | 1 / 8 | `#main > section > img`, `#grid > li:nth-of-type(1) > img`, `#cart-drawer > div:nth-of-type(1) > img` | Add an alt attribute: a brief description for content images, `alt=""` for decorative ones. |
| Critical | v-duplicate-id | 8 | `#price` (x3) | Make every id on the page unique; append a suffix to ids in reused components. |
| Critical | v-unfocusable (Needs confirmation) | 1 / 8 | `#grid > li:nth-of-type(1) > div:nth-of-type(3) > div`, `#cart-drawer .line > span.rm` | Change it to a native `<button>`; or add tabindex="0", role="button" and Enter/Space key handling. |
| Critical | v-suspicious-links (Needs confirmation) | 1 | `#main > section > div > a` | If it performs an on-page action, make it a `<button>`; otherwise add role="button". |
| Critical | v-text-contrast (Needs confirmation) | 1 | `#main-nav a.sale` (3.87:1), hero `p` (1.82:1), `#filters > p` (1.84:1), `span.old` $299 (1.83:1), footer "Read more" (1.87:1) | Increase the contrast: 4.5:1 for normal text and 3:1 for large text (AA). |
| Critical | v-text-contrast (Needs confirmation) | 3 / 8 / 9 | `span.old` $449, `#cart-drawer > p.note` (1.91:1), toast `#overlay-root > div` (3.50:1), `#co-email-hint` (1.91:1) | same |

Snippets and corrected code (one per pattern):
- `<input id="search" type="search" placeholder="Search tents, boots, packs..." aria-describedby="search-help">` → `<label for="search" class="sr-only">Search products</label><input id="search" type="search" placeholder="Search tents, boots, packs..." aria-describedby="search-help"><p id="search-help" class="sr-only">Press Enter to search</p>` (this also fixes the broken ref and the placeholder-label finding).
- `<select id="sort">` → `<label for="sort">Sort by</label><select id="sort">`. Do the same for `<select id="co-country">` with `<label for="co-country">Country</label>`.
- `<input id="newsletter" type="text" placeholder="Your email address">` → `<label for="newsletter">Email address</label><input id="newsletter" type="email" autocomplete="email">`.
- `<div class="chk"><input type="checkbox"> Ridgeline</div>` → `<label><input type="checkbox"> Ridgeline</label>`.
- `<input id="qty" type="number" value="1" min="1">` → `<label for="qty">Quantity</label><input id="qty" type="number" value="1" min="1">`. For `#promo`, add `<label for="promo">Promo code</label>`.
- `<button id="menu-toggle" class="icon-btn" aria-expanded="false" aria-controls="cat-panel"><svg>…</svg></button>` → `<button id="menu-toggle" class="icon-btn" aria-label="Categories" aria-expanded="false" aria-controls="cat-panel"><svg aria-hidden="true" focusable="false">…</svg></button>`, and render an element with `id="cat-panel"`. Use the same pattern for `#wishlist-btn` (`aria-label="Wishlist"`), the card wishlist buttons (`aria-label="Add Ridgeline 2P Tent to wishlist"`) and `#cart-close` (`aria-label="Close cart"`).
- `<a id="account-link" class="icon-link" href="/account.html"><svg>…</svg></a>` → `<a id="account-link" class="icon-link" href="/account.html" aria-label="Your account"><svg aria-hidden="true">…</svg></a>`. For the footer links use `aria-label="Facebook"` and `aria-label="Instagram"`.
- Rating stars `<svg viewBox="0 0 24 24">…</svg>` x4 → `<span class="sr-only">Rated 4 out of 5</span><svg aria-hidden="true">…</svg>…`.
- `<img src="data:image/svg+xml…">` → `<img src="…" alt="Ridgeline 2P Tent">`, or `alt=""` if it is decorative.
- `<aside id="cart-drawer" class="drawer" role="dialog" aria-labelledby="cart-title"><h6>Your cart</h6>` → `<aside id="cart-drawer" class="drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title"><h2 id="cart-title">Your cart</h2>`. While it is open, put `inert` on `<main>` and the header instead of only `aria-hidden`; this clears the 11 aria-hidden-focus findings.
- `<span id="price" class="price">$249</span>` (repeated) → `<span class="price" id="price-1">$249</span>`, unique per card and per cart line.
- `<div class="add" onclick="addToCart(1)">Add to cart</div>` → `<button type="button" class="add" onclick="addToCart(1)">Add to cart</button>`. And `<span class="rm" onclick="void 0">×</span>` → `<button type="button" class="rm" aria-label="Remove Ridgeline 2P Tent">×</button>`.
- `<a class="cta" href="#">Click here</a>` → `<a class="cta" href="/sale">Shop the Summer Sale</a>`, or a `<button>` if it opens something on the page.
- `<p id="co-email-hint" class="note">We send the receipt here.</p>` (1.91:1) → set `.note` to a colour of at least 4.5:1 on its background, for example `color:#4a5550` on white. Apply the same to `span.old`, the `.sale` link, the hero text and the toast.
- `<input id="co-email" … aria-describedby="co-email-error" aria-invalid="true"><p id="co-email-err">` → `<input id="co-email" type="email" required aria-invalid="true" aria-describedby="co-email-err co-email-hint">`, which points to the real error id (and keeps the hint).

### Serious
| Severity | Audit ID | Step | Selector | Fix |
|---|---|---|---|---|
| Serious | v-placeholder-label (Needs confirmation) | 1 / 8 | `#search`, `#newsletter`, `#promo` | Provide a persistent, programmatic label (`<label for>` or aria-label) instead of relying only on the placeholder. |
| Serious | v-tabindex | 8 | `#overlay-root > div > a` — `<a href="#cart" tabindex="2">Click here</a>` | Remove the positive tabindex; rely on DOM order, or use tabindex="0". → `<a href="#cart">View cart</a>` |
| Serious | v-aria-invalid | 10 | `#co-email` | Link an accessible error message to the invalid field with aria-errormessage or aria-describedby. (Fixed by the corrected `#co-email` code above.) |

### Moderate
| Severity | Audit ID | Step | Selector | Fix |
|---|---|---|---|---|
| Moderate | v-generic-link (Needs confirmation) | 1 | `#main-nav > a:nth-of-type(5)` "Click here for gift cards", hero "Click here", footer "Read more" | Rewrite the link text to describe the destination. → "Gift cards", "Shop the Summer Sale", "Careers at Northwind" |
| Moderate | v-generic-link (Needs confirmation) | 8 | `#cart-drawer > p:nth-of-type(2) > a` "Learn more", toast "Click here" | same → "Shipping details", "View cart" |
| Moderate | v-heading-errors (Needs confirmation) | 8 | `#cart-drawer > h6` — `<h6>Your cart</h6>` | Headings should go up one level at a time. → `<h2 id="cart-title">Your cart</h2>` |

**Needs manual review:** none (0 Manual findings).

## Detection Confidence
Most findings come from `rule` audits, which are the most dependable: unlabeled inputs, broken ARIA references, aria-hidden-focus, empty buttons and links, SVG, missing alt, duplicate ids, tabindex and aria-invalid. Even so, a clean result from them does not prove the page is fully accessible. The other audits have known limits, quoted from the report:
- **v-text-contrast (best-effort):** "Colors are computed, but text over images or gradients cannot be decided and is flagged for manual review. Overlapping elements are not modelled." Check the toast and the hero text visually.
- **v-unfocusable (best-effort):** "Only finds div, span and section elements with an onclick attribute. Click handlers attached in JavaScript … cannot be seen, so an empty result does not prove there are none."
- **v-generic-link (best-effort):** "Matches a fixed list of English phrases … a longer link text containing one of these words can match." "Click here for gift cards" is such a case.
- **v-heading-errors (best-effort):** "Skipped levels are exact. 'Fake headings' are guessed from class names." The h6 finding is a skipped level, so it is exact.
- **v-suspicious-links (pattern):** "Only detects links whose href is '#' or starts with 'javascript:'."
- **v-placeholder-label (pattern):** "Checks for a label[for] and ARIA names only."

Two things the audit itself did not flag:
- The Brand filter did not change the result list (still 2 tents after ticking "Northwind").
- The checkout error appears on input, not only on Place order. Its text lives in `#co-email-err`, which is not announced because of the broken reference.

For a visual report, open `node_modules/wick-ag-lens/report-template/wick-ag-lens-viewer.html` and drop the JSON file onto it.