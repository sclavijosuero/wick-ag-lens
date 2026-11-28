Tier 2 was used: agent-browser to scout and log in, then the WICK-AG-Lens CLI (`node cli/index.js audit`) with `-a` auth state. No wick-ag-lens MCP tools were loaded. Scope was WCAG 2.0 and 2.1, levels A and AA, with no screenshots. The full JSON report is at c:\Personal\GitHub_Repos\wick-ag-lens\output-samples\skill-eval-2026-11-27\H-2\audit-report.json (20 trail entries: a baseline plus 19 interaction steps, including wait steps). The agent-browser session is closed and I deleted the saved auth-state file because it held live login cookies.

**Health Summary (final state, `global_summary`; counts are element instances, not issue counts)**
- Critical: 115
- Serious: 4
- Moderate: 5
- Minor: 1
- Manual: 0 (the tool reported none; a person still needs to check focus visibility and modal focus handling)

**Step-by-step delta highlights** (step 1 = baseline; wait steps are included in the numbering)
- Baseline: empty links (account icon, footer), `href="#"` "Click here" CTA, unlabeled SVGs, missing alts, empty buttons, duplicate IDs, text contrast.
- Steps 2-3 (search "tent"): results re-render. Duplicate `id="price"` (9 times) and a contrast finding appear; many home-page findings clear.
- Step 5 (open Brand): two Brand checkboxes have no accessible name (`v-unlabeled-inputs`, 2 elements).
- Step 7 (pick Northwind): the tool reports the Brand checkboxes as resolved. The live DOM still shows two unnamed checkboxes, so treat that as a likely tool artifact. New: 27 SVGs, 8 duplicate IDs.
- Step 9 (quick view): `v-aria-hidden-focus` (20 focusable controls behind the open dialog). Heading-level finding in the dialog.
- Step 11 (add to cart): the quick view closes and most findings clear, but the duplicate-ID count rises to 8.
- Step 13 (open cart drawer): new unfocusable `<span onclick>` remove control, unnamed close button, unnamed SVG, missing thumbnail alt, placeholder-only promo field, skipped heading level, generic "Learn more" link.
- Step 15 (checkout): unlabeled country `<select>`, and a 1.91:1 contrast hint ("We send the receipt here.").
- Steps 17-19 (name, email "not-an-email", Place order): the email field gets `aria-invalid="true"` with `aria-describedby="co-email-error"`, but no element with that ID exists (broken reference). Native browser validation blocked the submit, so no error text is shown on the page.

**Prioritized remediation** (Fix text from `audit_dictionary` `info.fix`, with corrected code for each snippet; "Needs confirmation" = pattern or best-effort detection)

| Severity | Audit ID | Step | Selector | Fix |
|---|---|---|---|---|
| Critical | v-empty-links | 1 | `#account-link`, footer `a[href="#facebook"]` | Snippet: `<a id="account-link" class="icon-link" href="/account.html">`. Fix: `aria-label="My account"`. Footer links need the same treatment. WCAG 2.4.4 (A). |
| Critical | v-suspicious-links (Needs confirmation) | 1 | `#main > section > div > a` | Snippet: `<a class="cta" href="#">Click here</a>`. Fix: `<button class="cta" type="button">Click here</button>`, or a real href. WCAG 4.1.2 (A). |
| Critical | v-unfocusable (Needs confirmation) | 13 | `#cart-drawer ... span.rm` | Snippet: `<span class="rm" onclick="void 0">×</span>`. Fix: `<button type="button" class="rm" aria-label="Remove item">×</button>`. WCAG 2.1.1 (A). |
| Critical | v-svg-accessible | 1, 7, 13 | `#cart-close > svg` | Snippet: `<svg viewBox="0 0 24 24">`. Fix: add `aria-hidden="true" focusable="false"` to the SVG and name the button. WCAG 1.1.1 (A). |
| Critical | v-missing-alt | 1, 13 | cart drawer `img` | Snippet: `<img src="data:image/svg+xml...">`. Fix: `alt="Ridgeline 2P Tent"` (or `alt=""` if decorative). WCAG 1.1.1 (A). |
| Critical | v-unlabeled-inputs | 5, 15 | Brand checkboxes; `#co-country` | Snippet: `<select id="co-country">`. Fix: `<label for="co-country">Country</label>` before it. For Brand: `<label><input type="checkbox"> Ridgeline</label>`. WCAG 3.3.2 (A). |
| Critical | v-empty-buttons | 13 | `#cart-close` | Snippet: `<button id="cart-close" class="icon-btn x">`. Fix: `aria-label="Close cart"`. WCAG 4.1.2 (A). |
| Critical | v-duplicate-id | 3, 7, 13 | `#price` (9 instances) | Snippet: `<span id="price" class="price">$249</span>`. Fix: remove the id, or make it unique per card (`id="price-ridgeline-2p"`). WCAG 1.3.1 (A). |
| Critical | v-broken-aria-ref | 18 | `#co-email` | Snippet: `<input id="co-email" type="email" required aria-describedby="co-email-error" aria-invalid="true">`. Fix: render `<p id="co-email-error" role="alert">Enter a valid email address.</p>` after the input. WCAG 1.3.1 (A). |
| Critical | v-aria-hidden-focus | 9, 13 | `#filter-brand`, `#sort`, etc. behind the open dialog | Snippet: focusable controls inside an `aria-hidden="true"` wrapper. Fix: use `inert` on the background wrapper while the dialog is open, not `aria-hidden`. WCAG 4.1.2 (A). |
| Critical | v-text-contrast (Needs confirmation) | 15 | `#co-email-hint` | Snippet: `<p id="co-email-hint" class="note">We send the receipt here.</p>` (1.91:1). Fix: use a text colour of at least 4.5:1, e.g. `color:#595959` on `#fff`. WCAG 1.4.3 (AA). |
| Serious | v-placeholder-label (Needs confirmation) | 13 | `#promo` | Snippet: `<input id="promo" type="text" placeholder="Promo code">`. Fix: `<label for="promo">Promo code</label>` and keep the placeholder as a hint. WCAG 4.1.2 (A). |
| Serious | v-aria-invalid | 18 | `#co-email` | Same fix as v-broken-aria-ref: the error must exist and be linked via `aria-describedby`. WCAG 3.3.1 (A). |
| Moderate | v-heading-errors (Needs confirmation) | 13 | `#cart-drawer > h6` | Snippet: `<h6>Your cart</h6>`. Fix: use `<h2 id="cart-title">Your cart</h2>` at the right level. WCAG 1.3.1 (A). |
| Moderate | v-generic-link (Needs confirmation) | 13 | `#cart-drawer a[href="#shipping"]` | Snippet: `<a href="#shipping">Learn more</a>`. Fix: `Learn more about shipping options`. WCAG 2.4.4 (A). |
| Minor | v-redundant-alt (Needs confirmation) | 7 | `#grid > li:nth-of-type(2) > img` | Snippet: `alt="image of boots"`. Fix: `alt="Trail running boots"`. WCAG 1.1.1 (A). |

**Needs manual review:** none reported by the tool. A person should still check: keyboard focus visibility at each step, focus trapping in the quick view and cart drawer, and contrast over images, since the tool cannot decide that.

**Caveats**
- The CLI reports deltas, so the element lists above are partial. The `global_summary` figures are the authoritative final counts. My per-audit reconstruction found about 40 Critical elements, so the 115 total is not fully itemised in this table.
- The `--step` runs were 19 interactions. Nothing was added to the page or cart beyond what the journey needed.
- Several audits are `best-effort` or `pattern`. They are marked "Needs confirmation" above and should be checked by hand before acting.

