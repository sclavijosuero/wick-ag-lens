You are one run of a benchmark that compares two ways of driving a browser. Do the task below exactly and efficiently, and stay on the tool path stated in the TOOLS section. Do not edit any file in the repository, and do not read any file of the repository other than what the wick-ag-lens command itself needs: the selectors must be discovered ONLY by browsing the running page with the browsing tool stated in the TOOLS section. In particular, do not open the page's source code, the folders `tests/`, `samples/` or `extension/`, or any file that mentions the shop or its journey.

## TASK

A web shop runs at {BASE_URL} (already started). Its shop page is {BASE_URL}/app/bench-shop.html and it requires a login: the sign-in page is {BASE_URL}/bench-login.html (demo credentials: user `jdoe`, password `Admin+123`).

Produce a per-step accessibility report of the following user journey on the shop page, after signing in. The journey is given as actions in plain words. You are NOT given CSS selectors: discover them by browsing the page (some elements only exist after the previous actions have been done, for example the quick-view dialog, the cart drawer and the checkout form).

 1. Open the "shop by category" panel with the menu (hamburger) button in the header.
 2. Hover the "Shop" item of the main navigation (it shows a menu).
 3. Close the category panel with the same menu button.
 4. Type "tent" in the search box.
 5. Press Enter in the search box.
 6. Sort the results by price, low to high.
 7. Open the "Brand" filter in the sidebar.
 8. Open the quick view of the first product in the list.
 9. In the quick view, enter 0 as the quantity.
10. Click "Add to cart" in the quick view.
11. Wait for the notification that confirms the product was added (it appears a few seconds after the click).
12. Open the cart with the cart icon in the header.
13. Click "Checkout" in the cart.
14. In the checkout form, type "not-an-email" in the Email field.
15. Press the Escape key to close the cart.

## THE ACCESSIBILITY AUDITS

Use the wick-ag-lens CLI. It runs its own browser, logs in, performs the steps you give it and audits the page after the page load and after every step, reporting only what changed (NEW findings and RESOLVED findings). Run exactly these 30 audits (pass them with `--audits`):

v-missing-alt,v-empty-buttons,v-empty-links,v-generic-link,v-unlabeled-inputs,v-placeholder-label,v-aria-invalid,v-broken-aria-ref,v-duplicate-id,v-heading-errors,v-unfocusable,v-tabindex,v-aria-hidden-focus,v-text-contrast,v-svg-accessible,i-focus-order,i-landmarks,i-valid-headings,i-image-alts,i-aria-roles,i-accessible-name,i-aria-expanded,i-aria-controls,i-aria-live,i-required-fields,i-field-desc,i-fieldsets,i-touch-targets,i-tabindex-all,i-aria-pressed

Command (run from c:/Personal/GitHub_Repos/wick-ag-lens/cli): `node index.js audit "<page url>" --audits "<list>" --step "action::target[::value]" --step ... <login options>`
- Step grammar: `click::<selector>`, `hover::<selector>`, `fill::<selector>::<text>`, `select::<selector>::<option value>`, `press::<selector>::<Key>` (use `press::active::<Key>` to press a key on the element that currently has focus), `wait::<selector>` or `wait::<milliseconds>`. One `--step` per action of the journey, in order.
- The JSON output is large: redirect it to a file and never print it whole. Read only a compact summary, for example with a short `node -e` script that prints, for every entry of `audit_trail`, the audit ids with the number of elements in `new_findings` and in `resolved_findings` (tabs > categories > audits[] > `elements`).
- Put temporary files in {SCRATCH_DIR} (create it).

## TOOLS (this section differs between the two runs)

{TOOLS}

## FINAL ANSWER (strict format, nothing else)

A markdown table with one row for the page load (step 0) and one row per journey step (steps 1 to 15), with the columns:

| Step | Action | New (audit:elements) | Resolved (audit:elements) |

where each of the last two columns lists `audit-id:number-of-elements` separated by commas, or `-` when empty. Then two lines:
`STEPS: <the exact --step arguments you used, in order>`
`Tool calls: <number of tool calls you made>`
