// THE BENCHMARK JOURNEY: one definition used by the spec that keeps the page honest, and by every benchmark run
// (agent-browser, Playwright MCP, CLI, MCP, ...), so that all of them do exactly the same work. See README.md.
//
// The page is tests/fixtures/pages/bench-shop.html (a realistic outdoor-gear store, deliberately full of accessibility
// problems), served behind a login by tests/fixtures/server.js.

const SHOP_PATH = '/app/bench-shop.html';                 // protected: needs the session cookie
const LOGIN_PATH = '/bench-login.html';
const CREDENTIALS = { user: 'jdoe', password: 'Admin+123' };   // demo credentials of the fixture server, not real secrets

// 15 violation / warning audits
const VIOLATION_AUDITS = [
  'v-missing-alt', 'v-empty-buttons', 'v-empty-links', 'v-generic-link', 'v-unlabeled-inputs',
  'v-placeholder-label', 'v-aria-invalid', 'v-broken-aria-ref', 'v-duplicate-id', 'v-heading-errors',
  'v-unfocusable', 'v-tabindex', 'v-aria-hidden-focus', 'v-text-contrast', 'v-svg-accessible',
];

// 15 structural / informative audits (one of them is the focus order)
const STRUCTURE_AUDITS = [
  'i-focus-order', 'i-landmarks', 'i-valid-headings', 'i-image-alts', 'i-aria-roles',
  'i-accessible-name', 'i-aria-expanded', 'i-aria-controls', 'i-aria-live', 'i-required-fields',
  'i-field-desc', 'i-fieldsets', 'i-touch-targets', 'i-tabindex-all', 'i-aria-pressed',
];

const AUDITS = [...VIOLATION_AUDITS, ...STRUCTURE_AUDITS];

// 15 interactions, "action::target[::value]" exactly as written on the command line (all six action types)
const STEPS = [
  'click::#menu-toggle',            //  1 open the category panel (hamburger)
  'hover::#nav-shop',               //  2 mega menu on hover
  'click::#menu-toggle',            //  3 close the category panel (the mouse leaves the menu: the mega menu closes too)
  'fill::#search::tent',            //  4 type a search: suggestions appear
  'press::#search::Enter',          //  5 submit the search: results list
  'select::#sort::price-asc',       //  6 sort the results
  'click::#filter-brand',           //  7 open a filter accordion
  'click::#qv-1',                   //  8 open the quick-view dialog of the first product
  'fill::#qv-qty::0',               //  9 an invalid quantity
  'click::#qv-add',                 // 10 add to cart: the dialog closes, the toast mounts a moment later
  'wait::.toast',                   // 11 wait for the toast
  'click::#cart-btn',               // 12 open the cart drawer
  'click::#checkout-btn',           // 13 open the checkout form
  'fill::#co-email::not-an-email',  // 14 an invalid e-mail
  'press::active::Escape',          // 15 close the drawer with the keyboard
];

module.exports = { SHOP_PATH, LOGIN_PATH, CREDENTIALS, VIOLATION_AUDITS, STRUCTURE_AUDITS, AUDITS, STEPS };
