I audited the whole journey (login, then 10 audited steps). In the final state, after the invalid Place order submit, there are 64 Critical, 5 Serious and 6 Moderate issues still active. The full report is saved and the agent-browser session is closed.

**Tier:** Tier 2. I didn't know the page or its login, a terminal was available, and no `wick-ag-lens:*` MCP tools were loaded. So I scouted and logged in with agent-browser, saved the session with `state save`, then audited with the CLI (`-a auth-state.json`, `--wcag-version 2.0,2.1 --wcag-level A,AA`, 10 `--step`s). I deleted `auth-state.json` afterwards, since it holds session cookies.

**Report:** `c:\Personal\GitHub_Repos\wick-ag-lens\output-samples\skill-eval-2026-11-27\O-1\audit-report.json` (I removed the leading `[Audit]` log lines, so it is plain JSON).

## Health Summary (`global_summary`, final state)
| Critical | Serious | Moderate | Minor | Manual |
|---|---|---|---|---|
| 64 | 5 | 6 | 0 | 0 |

These counts describe the page when the last step finished. Issues that appeared and were fixed earlier in the journey are not in them; the delta highlights below cover those. The 93 Informative items are page structure, not issues, and are not counted.

## Step-by-Step Delta Highlights
1. **Initial load (logged in):** The page started with many barriers:
   - 41 inaccessible SVGs, images without alt, and empty icon links and buttons.
   - Unlabeled `#search`, `#sort` and `#newsletter`, and placeholders used as labels.
   - Clickable "Add to cart" `<div>`s that can't take keyboard focus.
   - 8 elements with the same id `#price`.
   - Broken `aria-controls` / `aria-describedby` references.
   - 8 text contrast failures.
2. **Fill search "tent":** 2 suggestion images with no alt appeared.
3. **Press Enter (results for "tent"):** The grid shrank to 2 products, which resolved most grid SVG, alt, button and duplicate-id findings. One new contrast failure appeared on the `$449` old price.
4. **Open Brand filter:** The `#filter-brand` broken reference was resolved. 2 unlabeled checkboxes appeared (Ridgeline and Cascade use `<div class="chk">`, not `<label>`).
5. **Pick brand (Northwind):** No change. The grid also did not filter visibly when the brand was ticked.
6. **Open Quick view:** This brought the most new barriers:
   - The close button has no name.
   - The image has no alt, and the quantity field is unlabeled.
   - The ids `#product-title` and `#price` are duplicated.
   - There are broken references on `#qv` and `#qv-qty`.
   - There are contrast failures on the price and the hint.
   - 11 focusable elements sit behind `aria-hidden`.
7. **Add to cart:** The dialog closed and all of its findings were resolved.
8. **Open cart:** The drawer reintroduced the `aria-hidden` focusable leak (11 elements) and brought these:
   - An `h6` that skips heading levels.
   - An unnamed close button and an image with no alt.
   - Unlabeled `#qty` and `#promo`.
   - A clickable `×` span that can't take focus.
   - `aria-labelledby="cart-title"` pointing to an id that doesn't exist.
   - A toast link with `tabindex="2"`.
   - Generic link text and 2 contrast failures.
9. **Checkout:** `#co-country` is unlabeled, and the email hint fails contrast.
10. **Fill malformed email:** Validation already fires on input. `#co-email` gets `aria-invalid="true"`, but its `aria-describedby="co-email-error"` points to an id that doesn't exist (the message is `#co-email-err`). So the error is not linked to the field.
11. **Place order:** No further change. The error state above remains.

## Prioritized Remediation Table
The Fix text comes from `audit_dictionary` `info.fix`. Detection type: `rule` unless marked **Needs confirmation**.

### Critical
| Severity | Audit ID | Step | Selector | Fix |
|---|---|---|---|---|
| Critical | v-svg-accessible | 1, 8 | `#menu-toggle > svg`, `#wishlist-btn > svg`, `#account-link > svg`, grid card SVGs (rating stars and wish icons, 12), footer social SVGs (2), `#cart-close > svg` (15 total) | If the SVG conveys meaning, add aria-label or a `<title>` referenced by aria-labelledby; if decorative, add `aria-hidden="true"`. Snippet: `<svg viewBox="0 0 24 24">…</svg>` becomes `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>` |
| Critical | v-missing-alt | 1, 8 | `#main > section > img`, `#grid > li:nth-of-type(1) > img`, `#cart-drawer > div:nth-of-type(1) > img` | Add an alt attribute: a description for content images, `alt=""` for decorative ones. Snippet: `<img src="data:…">` becomes `<img src="…" alt="Ridgeline 2P Tent">` |
| Critical | v-empty-links | 1 | `#account-link`, footer `a[href="#facebook"]`, `a[href="#instagram"]` | Give the link text or an aria-label. Snippet: `<a id="account-link" class="icon-link" href="/account.html">…</a>` becomes `<a id="account-link" class="icon-link" href="/account.html" aria-label="My account">…</a>` |
| Critical | v-suspicious-links (**Needs confirmation**: "Only detects links whose href is '#' or starts with 'javascript:'") | 1 | `#main > section > div > a` | If it performs an on-page action, use a `<button>`. Snippet: `<a class="cta" href="#">Click here</a>` becomes `<a class="cta" href="/sale">Shop the summer sale</a>` (or a `<button>` if it is an action) |
| Critical | v-unlabeled-inputs | 1, 4, 8, 9 | `#search`, `#sort`, `#newsletter`, `#brand-panel .chk input` (2), `#qty`, `#promo`, `#co-country` (8 total) | Add a `<label for>`, wrap the input in a label, or add aria-label. Snippets: `<input id="search" type="search" placeholder="Search tents, boots, packs...">` gets `<label for="search">Search products</label>`; `<div class="chk"><input type="checkbox"> Ridgeline</div>` becomes `<label><input type="checkbox"> Ridgeline</label>`; `<select id="co-country">` gets `<label for="co-country">Country</label>` |
| Critical | v-empty-buttons | 1, 8 | `#menu-toggle`, `#wishlist-btn`, `#grid > li:nth-of-type(1) > button`, `#cart-close` | Add an aria-label to icon-only buttons. Snippet: `<button id="cart-close" class="icon-btn x">…</button>` becomes `<button id="cart-close" class="icon-btn x" aria-label="Close cart">…</button>`; `#menu-toggle` gets `aria-label="Categories"`, `#wishlist-btn` gets `aria-label="Wishlist"` |
| Critical | v-unfocusable (**Needs confirmation**: "Only finds div, span and section elements with an onclick attribute; click handlers attached in JavaScript cannot be seen") | 1, 8 | `#grid > li:nth-of-type(1) > div:nth-of-type(3) > div`, `#cart-drawer > div:nth-of-type(1) > span:nth-of-type(2)` | Use a native `<button>`. Snippets: `<div class="add" onclick="addToCart(1)">Add to cart</div>` becomes `<button class="add" onclick="addToCart(1)">Add to cart</button>`; `<span class="rm" onclick="void 0">×</span>` becomes `<button class="rm" aria-label="Remove Ridgeline 2P Tent">×</button>` |
| Critical | v-broken-aria-ref | 1, 8, 10 | `#menu-toggle` (`aria-controls="cat-panel"`), `#search` (`aria-describedby="search-help"`), `#filter-price` (`aria-controls="price-panel"`), `#cart-drawer` (`aria-labelledby="cart-title"`), `#co-email` (`aria-describedby="co-email-error"`) | Make the referenced id match an element in the DOM. Snippets: `<h6>Your cart</h6>` becomes `<h2 id="cart-title">Your cart</h2>`; `<input id="co-email" … aria-describedby="co-email-error" aria-invalid="true">` becomes `aria-describedby="co-email-err co-email-hint"` |
| Critical | v-text-contrast (**Needs confirmation**: "text over images or gradients cannot be decided; overlapping elements are not modelled") | 1, 3, 8, 9 | `#main-nav a.sale` (3.87:1), hero `p` (1.82:1), `#filters > p` (1.84:1), `span.old` $299 / $449 (1.83:1), footer "Read more" (1.87:1), `#cart-drawer > p:nth-of-type(2)` (1.91:1), `#overlay-root > div` toast (3.50:1), `#co-email-hint` (1.91:1) | Raise contrast to at least 4.5:1 for normal text (3:1 for large text). Snippet: `<p class="note">Prices include VAT…</p>` with a `.note` colour of #595959 or darker on white |
| Critical | v-duplicate-id | 8 | `#price` (×3, in the cart drawer and grid) | Make every id unique. Snippet: `<span id="price" class="price">$249</span>` becomes `<span id="price-1" class="price">$249</span>` (or use a class only) |
| Critical | v-aria-hidden-focus | 8 | `#main > section > div > a`, `#filter-brand`, brand checkboxes (3), `#filter-price`, `#sort`, `#grid > li:nth-of-type(1) > button`, `#qv-1`, `#qv-5`, grid "Add to cart" button | Put `inert` on the hidden background while the drawer is open (or remove `aria-hidden`). Example: `<main id="main" aria-hidden="true">` becomes `<main id="main" inert>` |

### Serious
| Severity | Audit ID | Step | Selector | Fix |
|---|---|---|---|---|
| Serious | v-placeholder-label (**Needs confirmation**: "Checks for a label[for] and ARIA names only") | 1, 8 | `#search`, `#newsletter`, `#promo` | Provide a persistent label instead of relying on the placeholder. Snippet: `<input id="promo" type="text" placeholder="Promo code">` becomes `<label for="promo">Promo code</label><input id="promo" type="text">` |
| Serious | v-tabindex | 8 | `#overlay-root > div > a` | Remove the positive tabindex. Snippet: `<a href="#cart" tabindex="2">Click here</a>` becomes `<a href="#cart">View cart</a>` |
| Serious | v-aria-invalid | 10 | `#co-email` | Link an error message with aria-describedby or aria-errormessage. Snippet: `<input id="co-email" type="email" required aria-describedby="co-email-error" aria-invalid="true">` becomes `<input id="co-email" type="email" required aria-invalid="true" aria-describedby="co-email-err co-email-hint">` (message `<p id="co-email-err" class="err">Enter a valid email address.</p>`) |

### Moderate
| Severity | Audit ID | Step | Selector | Fix |
|---|---|---|---|---|
| Moderate | v-generic-link (**Needs confirmation**: "Matches a fixed list of English phrases; a longer text containing them can match") | 1, 8 | `#main-nav > a:nth-of-type(5)` ("Click here for gift cards"), hero `a.cta` ("Click here"), footer "Read more", `#cart-drawer` "Learn more", toast "Click here" | Rewrite the link text to describe the destination. Snippet: `<a href="#shipping">Learn more</a>` becomes `<a href="#shipping">Shipping details</a>`; `<a href="#gift-cards">Click here for gift cards</a>` becomes `<a href="#gift-cards">Gift cards</a>` |
| Moderate | v-heading-errors (**Needs confirmation** for fake headings; skipped levels are exact) | 8 | `#cart-drawer > h6` | Headings should go down one level at a time. Snippet: `<h6>Your cart</h6>` becomes `<h2 id="cart-title">Your cart</h2>` |

**Needs manual review:** none (0 Manual findings).

## Detection Confidence
- **`rule` audits (most dependable):** v-svg-accessible, v-missing-alt, v-empty-links, v-unlabeled-inputs, v-empty-buttons, v-broken-aria-ref, v-duplicate-id, v-aria-hidden-focus, v-tabindex, v-aria-invalid.
- **`pattern` audits:** v-suspicious-links and v-placeholder-label. They are marked Needs confirmation above, with their `detection_note` quoted.
- **`best-effort` audits:** v-unfocusable, v-text-contrast, v-generic-link and v-heading-errors. Also marked Needs confirmation.
- **Empty results are not proof:** an empty result from these audits doesn't mean the page is clean. For example, v-unfocusable cannot see click handlers added in JavaScript.

**Things a person should check:**
- **Unclosed dialogs:** the quick view and cart were never dismissed with Escape or the close button, so that path was not audited.
- **Dialog focus:** the tool cannot check whether focus moves into the dialogs or is kept inside them.
- **Brand filter:** ticking Northwind did not change the results list, so it may not work at all.