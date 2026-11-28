Accessibility audit of Northwind Outfitters shop (http://127.0.0.1:4700/app/bench-shop.html), WCAG 2.0 and 2.1, levels A and AA.

Tier: Tier 2 (no wick-ag-lens MCP tools available, so the CLI fallback). I scouted the login and journey with agent-browser (logged in as jdoe), saved the session, then ran `node cli/index.js audit` with the 11 journey steps as --step selectors. Full JSON report saved to: C:\Personal\GitHub_Repos\wick-ag-lens\output-samples\skill-eval-2026-11-27\H-1\audit-report.json (valid JSON; the [Audit] progress lines were cut). The agent-browser session is closed and the session cookie file was deleted.

Journey steps audited (12 trail entries: baseline + 11 interactions): search "tent" (fill #search, press Enter); open Brand (#filter-brand); tick Northwind; quick view first product (#qv-1); add to cart (#qv-add); open cart (#cart-btn); Checkout (#checkout-btn); fill name; fill email "not-an-email"; Place order (#co-submit).

## Health Summary (final state, from global_summary)
- Critical: 64
- Serious: 5
- Moderate: 6
- Minor: 0
- Manual: 0
(Informative items, 93, excluded. Counts describe the final state after Place order. Earlier-fixed issues are in the delta highlights.)

## Step-by-Step Delta Highlights
- Baseline (post-login shop): +27 issues. Unnamed SVG icons, missing alt, empty links and buttons, unlabeled search and sort inputs, duplicate #price ids, broken aria-controls refs, low-contrast text.
- Fill "tent": +3 (missing alt on autocomplete suggestion thumbnails).
- Press Enter (search results): +5 / -12. Suggestion list and the baseline product-grid issues resolved as the results grid re-rendered. New: duplicate #price ids on results, low-contrast sale price.
- Open Brand filter: +4. New: two unlabeled brand checkboxes (Critical). Fixed: broken aria-controls on #filter-brand.
- Tick Northwind: no change.
- Quick view (#qv-1): +14 / -1. Modal adds unnamed close SVG and button, missing product image alt, unlabeled quantity input, duplicate #product-title and #price, broken aria refs, low-contrast price. 11 page elements behind the modal remain focusable while aria-hidden (v-aria-hidden-focus).
- Add to cart: +2 / -14. Modal issues cleared on close. New: duplicate #price.
- Open cart: +21 / -3. Drawer adds unnamed close button, unlabeled qty and promo inputs, promo placeholder-only label (Serious), tabindex="2" on a link (Serious), a div-style "Add to cart" that is not keyboard-operable (Critical), and an h6 heading (Moderate).
- Checkout: +10. Unlabeled country select, low-contrast email hint, and checkout form fieldsets/required markers (informative).
- Fill name: no change.
- Fill invalid email: +2. The email field is aria-invalid (Serious) and its aria-describedby="co-email-error" points to nothing; the error paragraph has id "co-email-err" (Critical broken-aria-ref).
- Place order: no new or resolved items. The "Enter a valid email address." error appears, but the link to the field is still broken from the previous step.

## Prioritized Remediation Table
Rows are grouped by audit ID (one row per audit, listing its selectors) instead of one row per element, to keep the table readable. Step = first step where it appeared (1 = baseline, 2 = fill tent, 3 = Enter, 4 = Brand, 6 = quick view, 8 = cart, 9 = checkout, 11 = invalid email). Fix text is from audit_dictionary, tags stripped. Items marked "Needs confirmation" come from pattern or best-effort detection.

| Severity | Audit ID | Step | Selector(s) | Fix |
|---|---|---|---|---|
| Critical | v-svg-accessible (15) | 1, 8 | #menu-toggle > svg, #wishlist-btn > svg, #account-link > svg, #grid li button svgs, #qv-close > svg, #cart-close > svg, ... | Add aria-label or title to informative SVGs; add aria-hidden="true" to decorative ones |
| Critical | v-missing-alt (3) | 1, 8 | #main > section > img, #grid li:nth-of-type(1) > img, #cart-drawer > div:nth-of-type(1) > img | Add alt text (or alt="" for decorative images) |
| Critical | v-empty-links (3) | 1 | #account-link, two footer links | Add visible text or aria-label / sr-only text |
| Critical | v-unlabeled-inputs (8) | 1, 4, 8, 9 | #search, #sort, #newsletter, brand checkboxes, #qty, #promo, #co-country, #qv-qty | Add a label for= the input, wrap it in a label, or add aria-label |
| Critical | v-empty-buttons (4) | 1, 8 | #menu-toggle, #wishlist-btn, product card button, #cart-close | Add visible text or aria-label |
| Critical | v-unfocusable (2) — Needs confirmation (best-effort: only finds onclick on div/span/section) | 1, 8 | product "Add to cart" div (onclick), drawer span | Use a native button, or add tabindex="0", role="button" and Enter/Space handling |
| Critical | v-broken-aria-ref (5) | 1, 8, 11 | #menu-toggle, #search, #filter-price, #cart-drawer, #co-email (aria-describedby="co-email-error") | Make the aria-describedby/aria-controls ID match an element present in the DOM |
| Critical | v-text-contrast (9) — Needs confirmation (best-effort: text over images/gradients and overlaps not modelled) | 1, 3, 8, 9 | nav "Sale" link, #main p, #filters p, product price spans, #co-email-hint, #price, #qv-qty-hint | Raise contrast to at least 4.5:1 for normal text (3:1 for large text) |
| Critical | v-duplicate-id (3) | 8 | #price (x3 in drawer) | Make each id unique (for example per-item suffix) |
| Critical | v-aria-hidden-focus (11) | 8 | #main > section > div > a, #filter-brand, brand inputs and labels (behind open overlay) | Set tabindex="-1" or inert on the hidden background, or remove aria-hidden if the control should be active |
| Critical | v-suspicious-links (1) — Needs confirmation (pattern: only href="#" or javascript:) | 1 | #main > section > div > a (href="#") | Use a button element for on-page actions |
| Serious | v-placeholder-label (3) — Needs confirmation (pattern: label[for] and ARIA names only) | 1, 8 | #search, #newsletter, #promo | Add a persistent programmatic label |
| Serious | v-tabindex (1) | 8 | #overlay-root > div > a (tabindex="2") | Remove the positive tabindex |
| Serious | v-aria-invalid (1) | 11 | #co-email (aria-invalid="true") | Link the error message with aria-describedby or aria-errormessage pointing at the real error id (co-email-err) |
| Moderate | v-generic-link (5) — Needs confirmation (best-effort: fixed English phrase list) | 1, 8 | "Click here for gift cards", footer and cart links | Rewrite link text to describe the destination |
| Moderate | v-heading-errors (1) — Needs confirmation (best-effort: skipped levels are exact; fake headings are guessed) | 8 | #cart-drawer > h6 | Use heading levels in sequence (h2 after h1, etc.) |

Corrected example for the htmlSnippet of the highest-impact items (first instance of each):
- v-svg-accessible: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">` for decorative icons; for meaningful icons add `role="img" aria-label="Menu"`.
- v-empty-links: `<a id="account-link" class="icon-link" href="/account.html" aria-label="My account">...</a>`.
- v-unlabeled-inputs: `<label for="search" class="sr-only">Search</label><input id="search" type="search" ...>`.
- v-broken-aria-ref / v-aria-invalid (checkout): change `aria-describedby="co-email-error"` to `aria-describedby="co-email-err"` (or rename the paragraph id), keep `aria-invalid="true"`.
- v-duplicate-id: `<span id="price-1" class="price">$249</span>` with unique ids per product.
- v-unfocusable: replace `<div class="add" onclick="addToCart(1)">Add to cart</div>` with `<button type="button" class="add" onclick="addToCart(1)">Add to cart</button>`.
- v-tabindex: `<a href="#cart">Click here</a>` (drop tabindex="2").

## Needs manual review
- Text contrast over images and gradients (v-text-contrast): confirm visually.
- Focus order and focus visibility in the quick view and cart drawer: the 11 aria-hidden focusable elements behind the overlay need a keyboard check (Tab/Shift+Tab with the overlay open).
- The inline error text on Place order: confirm screen readers announce it (co-status is aria-live; the field link is broken).
- Brand checkbox labels (step 4): confirm the screen reader name after the fix.

Detection confidence: rule-based findings (svg, missing-alt, empty-links, unlabeled-inputs, empty-buttons, broken-aria-ref, duplicate-id, aria-hidden-focus, tabindex, aria-invalid) are the most reliable. Needs-confirmation items are marked above.

Notes: the step "Tick Northwind" was run by the CLI as a label click and produced no delta. Step 12 (Place order) produced no delta because the error issue from step 11 persisted. The audit ran with WCAG 2.0 and 2.1, levels A and AA; the dictionary tags for some audits also list 2.2 and AAA variants, but the findings reported are the A/AA ones.