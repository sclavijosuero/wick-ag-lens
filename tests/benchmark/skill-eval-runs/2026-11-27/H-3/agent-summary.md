## WICK-AG-Lens audit: Northwind Outfitters shop (purchase journey)

**Tier:** Tier 2 (agent-browser scouting and login, then the CLI fallback). No `wick-ag-lens:*` MCP tools are in this session.
**Scope:** WCAG 2.0 and 2.1, levels A and AA. Viewport 1280x800.
**Report:** `c:/Personal/GitHub_Repos/wick-ag-lens/output-samples/skill-eval-2026-11-27/H-3/audit-report.json` (full JSON, log preamble stripped).
**Journey (one CLI run, 11 audit points):** 0 baseline after login; 1-2 search "tent" (fill + Enter); 3 Brand filter opened; 4 "Northwind" picked; 5 quick view of first product (Ridgeline 2P Tent); 6 add to cart; 7 cart opened; 8 Checkout; 9 email set to `not-an-email`; 10 Place order.
**Session:** agent-browser closed. The temporary auth-state file in the scratchpad was deleted.

### Health Summary (final state, from `global_summary`)
- Critical: 64
- Serious: 5
- Moderate: 6
- Minor: 0
- Manual: 0

These are the issues still active at step 10. Issues that appeared and were fixed earlier are not counted; they are covered in the delta highlights. Informative items (93) describe structure and are not counted.

Caveat: the per-step delta logs under-report element counts. The table below lists each active audit ID with the elements the delta logs show, so its element counts can be lower than the 64 Critical total.

### Step-by-Step Delta Highlights
- **0 Baseline (shop page, logged in):** 13 violation audits appear, including empty links (`#account-link`, footer links), inline SVG and images, unlabeled controls, empty buttons, and `href="#"` links.
- **1-2 Search "tent":** new missing-alt and duplicate-id findings; pressing Enter resolves several earlier findings.
- **3 Brand open:** `v-unlabeled-inputs` on the brand filter; fieldset info.
- **4 Brand pick (Northwind):** no new or resolved findings.
- **5 Quick view open:** `v-aria-hidden-focus` (11 elements): focusable controls sit under `aria-hidden` while the dialog is open.
- **6 Add to cart:** dialog closes on add; a new duplicate-id finding appears.
- **7 Cart opened (largest change):** SVG close icon, cart image without alt, empty close button, non-button remove control (`<span onclick>`), positive `tabindex="2"`, placeholder-only promo field, "Click here"/"Learn more" links, and a skipped heading (h6 "Your cart").
- **8 Checkout:** `#co-country` select has no label; new low-contrast note text (`#co-email-hint`).
- **9 Invalid email entered:** `#co-email` has `aria-invalid="true"` and `aria-describedby="co-email-error"`, but no element with that id exists. I confirmed this in the DOM after submitting: no error element, and the status line is empty. The error text is never shown.
- **10 Place order:** no new or resolved findings reported. The invalid email issue from step 9 remains.

### Prioritized Remediation Table
Items marked "Needs confirmation" come from `pattern` or `best-effort` audits, which the tool cannot fully decide. Confirm them before acting.

| Severity | Audit ID | Step | Selector | Fix | Confidence |
|---|---|---|---|---|---|
| Critical | v-empty-links | 0 | `#account-link`; footer `a[href="#facebook"]`, `a[href="#instagram"]` | Give each link visible text, or an `aria-label` / sr-only text. | Rule |
| Critical | v-suspicious-links | 0 | `#main > section > div > a` (`href="#"`) | Use a `<button>` for on-page actions. | Needs confirmation (only `href="#"` / `javascript:` detected) |
| Critical | v-svg-accessible | 7 | `#cart-close > svg` | Decorative: `aria-hidden="true" focusable="false"`. Informative: `role="img"` + `aria-label`. | Rule |
| Critical | v-missing-alt | 7 | `#cart-drawer img` | Add a meaningful `alt`, or `alt=""` if decorative. | Rule |
| Critical | v-unlabeled-inputs | 8 | `#co-country` | Add `<label for="co-country">Country</label>`. | Rule |
| Critical | v-empty-buttons | 7 | `#cart-close` | Add `aria-label="Close cart"`. | Rule |
| Critical | v-unfocusable | 7 | `#cart-drawer span.rm` (onclick) | Use `<button type="button" aria-label="Remove item">`. | Needs confirmation (JS-attached handlers not visible) |
| Critical | v-aria-hidden-focus | 7 | `#main a.cta`, `#filter-brand`, `#brand-panel input` (11 elements) | Put `inert` or `tabindex="-1"` on hidden containers; drop `aria-hidden` from focusable controls. | Rule |
| Critical | v-text-contrast | 8 | `#co-email-hint` | Darken the note text to at least 4.5:1 (e.g., `#595959` on white is about 7:1). | Needs confirmation (background images and overlaps not modelled) |
| Critical | v-broken-aria-ref | 9 | `#co-email` (`aria-describedby="co-email-error"`) | Render the error element with that id, or remove the reference. Verified in DOM. | Rule |
| Serious | v-placeholder-label | 7 | `#promo` | Add `<label for="promo">Promo code</label>`; keep the placeholder as a hint only. | Needs confirmation (only `label[for]` / ARIA names checked) |
| Serious | v-tabindex | 7 | `#overlay-root a[tabindex="2"]` | Remove `tabindex="2"`. | Rule |
| Serious | v-aria-invalid | 9 | `#co-email` | Link a visible error message: `<p id="co-email-error">Enter an email address like name@example.com.</p>`. Same fix as v-broken-aria-ref. | Rule |
| Moderate | v-generic-link | 7 | `#cart-drawer a` ("Learn more") | Make the text descriptive, e.g., "Learn more about shipping". | Needs confirmation (fixed English phrase list) |
| Moderate | v-heading-errors | 7 | `#cart-drawer > h6` ("Your cart") | Use a heading level that follows the page outline, e.g., `<h2>Your cart</h2>`. | Needs confirmation (fake headings guessed from class names) |

**Corrected snippets for each finding (illustrative, from the htmlSnippet shown in the report):**
- `#account-link`: `<a id="account-link" class="icon-link" href="/account.html"><span class="sr-only">My account</span> ...icon...</a>`
- `#main > section > div > a`: `<button type="button" class="cta">Describe the action</button>`
- `#cart-close > svg`: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">`, and on the button `aria-label="Close cart"`
- `#cart-drawer img`: `<img src="..." alt="Product name">` (or `alt=""` if decorative)
- `#co-country`: `<label for="co-country">Country</label><select id="co-country">`
- `#cart-close`: `<button id="cart-close" class="icon-btn x" aria-label="Close cart">`
- `span.rm`: `<button type="button" class="rm" aria-label="Remove item">&times;</button>`
- hidden containers: `<div id="brand-panel" inert>` while closed
- `#co-email-hint`: `.note { color: #595959; }` on a white background
- `#co-email`: add `<p id="co-email-error">Enter an email address like name@example.com.</p>` after the input, and keep `aria-describedby="co-email-error"`
- `#promo`: `<label for="promo">Promo code</label><input id="promo" type="text" placeholder="e.g. SUMMER20">`
- `#overlay-root a`: `<a href="#cart">Click here</a>` (no tabindex), with descriptive text
- `#cart-drawer > h6`: `<h2>Your cart</h2>`

### Needs manual review
None. The Manual count is 0. The invalid-email finding (step 9) is a confirmed failure: the error message is not rendered, which the DOM check verified. A keyboard and screen-reader pass of the checkout error flow would still be useful, since the tool does not verify focus handling after a failed submit.