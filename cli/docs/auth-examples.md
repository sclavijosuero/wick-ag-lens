# Same audit, every login method (side by side)

This page shows **one scenario implemented once per login method**, so you can compare them without any noise and copy the one that fits your application. Everything else (the audits, the interaction, the result) is identical; **only the login changes**.

**The scenario**

1. Log in to an application.
2. Audit its protected page `https://app.example.com/account`.
3. Click `#open-settings` and read what that interaction added.

The audits are the same everywhere: `--audits "v-missing-alt,v-empty-buttons"`. Replace the URLs, selectors and credentials with your own. (Never put real passwords in files you commit; use environment variables or a secret store.)

| # | Method | CLI | MCP (`audit_baseline`) | Use it when |
| :-- | :-- | :-- | :-- | :-- |
| 1 | [Standard 2-field login](#1-standard-2-field-login) | `--login-url` `-u` `-p` | `loginUrl` `user` `pass` | One page with a user, a password and a submit button. |
| 2 | [Pipeline of steps](#2-pipeline-of-steps-multi-field-and-sso) | `--login-url` `--auth-step` (repeated) | `loginUrl` `authSteps` | Several fields, two-screen sign-ins, or a redirect to an identity provider (Okta, Entra ID). |
| 3 | [Custom script](#3-custom-login-script) | `--auth-script` | `authScript` | Anything else: MFA helpers, API tokens, unusual widgets. |
| 4 | [Interactive capture](#4-interactive-capture-a-person-signs-in-once) | `-i` with `-a` | not available (needs a visible browser) | CAPTCHA or MFA that only a person can pass; the result is a state file for method 5. |
| 5 | [Saved session](#5-saved-session-handed-over) | `-a state.json` | `authState` | A session saved earlier by Playwright, `agent-browser`, or any method above. |

> The login happens **before** the baseline step and is never part of the audit trail. The trail always starts at your target URL, already logged in.

---

## 1. Standard 2-field login

**CLI**
```bash
node index.js audit "https://app.example.com/account" \
  --login-url "https://app.example.com/login" -u "jdoe" -p "$APP_PASSWORD" \
  --audits "v-missing-alt,v-empty-buttons" \
  --step "click::#open-settings"
```

**MCP**
```jsonc
// 1. audit_baseline
{ "url": "https://app.example.com/account",
  "loginUrl": "https://app.example.com/login", "user": "jdoe", "pass": "<password>",
  "requestedAudits": ["v-missing-alt", "v-empty-buttons"] }
// 2. interact_and_diff  (the session stays open between calls)
{ "action": "click", "target": "#open-settings", "requestedAudits": ["v-missing-alt", "v-empty-buttons"] }
```

The shorthand fills the first text/email input, the password input, and presses the submit button.

---

## 2. Pipeline of steps (multi-field and SSO)

**CLI: three fields (company, user, password)**
```bash
node index.js audit "https://app.example.com/account" \
  --login-url "https://app.example.com/login" \
  --auth-step "fill::#company::Northwind" \
  --auth-step "fill::#user::jdoe" \
  --auth-step "fill::#password::$APP_PASSWORD" \
  --auth-step "click::#btn-login" \
  --audits "v-missing-alt,v-empty-buttons" \
  --step "click::#open-settings"
```

**MCP**
```jsonc
{ "url": "https://app.example.com/account", "loginUrl": "https://app.example.com/login",
  "authSteps": [
    { "action": "fill",  "target": "#company",   "value": "Northwind" },
    { "action": "fill",  "target": "#user",      "value": "jdoe" },
    { "action": "fill",  "target": "#password",  "value": "<password>" },
    { "action": "click", "target": "#btn-login" } ],
  "requestedAudits": ["v-missing-alt", "v-empty-buttons"] }
// then interact_and_diff exactly as in method 1
```

**CLI: single sign-on.** Point `--login-url` at the **protected page itself**, so the browser is redirected to the identity provider exactly as a user's would be. The steps then run on the provider's pages (user name first, password after it appears) and end back on your application:
```bash
node index.js audit "https://app.example.com/account" \
  --login-url "https://app.example.com/account" \
  --auth-step "fill::#idp-user::jdoe" \
  --auth-step "click::#idp-next" \
  --auth-step "wait::#idp-password" \
  --auth-step "fill::#idp-password::$APP_PASSWORD" \
  --auth-step "click::#idp-signin" \
  --auth-step "wait::#welcome" \
  --audits "v-missing-alt,v-empty-buttons" \
  --step "click::#open-settings"
```
The MCP form is the same list of steps in `authSteps`. `wait::<selector>` pauses until the element appears; `wait::1500` pauses 1.5 seconds.

---

## 3. Custom login script

A JavaScript module whose default export receives the Playwright `page`:
```js
// login.mjs
export default async function login(page) {
  await page.goto('https://app.example.com/login');
  await page.fill('#company', 'Northwind');
  await page.fill('#user', 'jdoe');
  await page.fill('#password', process.env.APP_PASSWORD);
  await page.click('#btn-login');
  await page.waitForURL('**/account');
}
```

**CLI**
```bash
node index.js audit "https://app.example.com/account" \
  --auth-script ./login.mjs \
  --audits "v-missing-alt,v-empty-buttons" \
  --step "click::#open-settings"
```

**MCP**
```jsonc
{ "url": "https://app.example.com/account", "authScript": "/absolute/path/to/login.mjs",
  "requestedAudits": ["v-missing-alt", "v-empty-buttons"] }
```
A path that does not exist is reported as a tool error before anything runs.

---

## 4. Interactive capture (a person signs in once)

For CAPTCHA or MFA. A visible browser opens for 30 seconds; sign in by hand, and the session is written to the file given with `-a`:
```bash
node index.js audit "https://app.example.com/account" --interactive -a account-state.json
```
This step is manual by nature, so it is not part of the automated suite. Its output is a state file, used exactly like method 5.

---

## 5. Saved session handed over

No login happens at audit time: the cookies and local storage saved earlier are loaded.

**Record the file** with whichever tool you prefer; the format is the standard Playwright `storageState`:
```bash
# agent-browser
agent-browser open https://app.example.com/login
agent-browser fill "#user" "jdoe"
agent-browser fill "#password" "$APP_PASSWORD"
agent-browser click "button[type=submit]"
agent-browser wait --url "**/account"
agent-browser state save account-state.json
```
```js
// or Playwright
await context.storageState({ path: 'account-state.json' });
```
```bash
# or let wick-ag-lens save the session of any of the methods above
node index.js audit "https://app.example.com/account" --login-url ... -u ... -p ... -a account-state.json
```

**CLI**
```bash
node index.js audit "https://app.example.com/account" \
  -a account-state.json \
  --audits "v-missing-alt,v-empty-buttons" \
  --step "click::#open-settings"
```

**MCP**
```jsonc
{ "url": "https://app.example.com/account", "authState": "/absolute/path/account-state.json",
  "requestedAudits": ["v-missing-alt", "v-empty-buttons"] }
```
`-a` / `authState` on its own only **loads** the file; it never creates or changes it. The file holds live session cookies in plaintext: keep it out of version control.

---

## What you get back (the same for every method)

```jsonc
{ "audit_trail": [
    { "step": 1, "interaction": { "action": "navigate", "selector": "Initial Page Load" },
      "url": "https://app.example.com/account",              // logged in: the protected page, not the sign-in page
      "new_findings": { /* what the page had on load */ } },
    { "step": 2, "interaction": { "action": "click", "selector": "#open-settings" },
      "new_findings":      { /* only what the click added   */ },
      "resolved_findings": { /* only what the click removed */ } } ],
  "global_summary": { "Critical": 1, /* ... */ } }
```
If the login failed, step 1 reports the **sign-in page** instead of yours (look at `audit_trail[0].url`).

## See it running, and compare

The repository's Playwright suite runs one accessibility journey through **every method above**, with the CLI and with MCP, and asserts that the findings of each step (how many, which type, new and resolved) and the focus order are **identical** whatever the login:

| What | Where (repository) |
| :-- | :-- |
| Login method definitions, side by side | `tests/helpers/login-matrix.js` |
| The CLI and MCP versions | `tests/cli/a11y-auth.spec.js`, `tests/mcp/a11y-auth.spec.js` (tag `@a11y-auth`) |
| The same journey with no login | `tests/cli/journey.spec.js`, `tests/mcp/journey.spec.js`, `tests/agent-browser/journey-public.spec.js` |
| The same journey with a session recorded by `agent-browser` | `tests/agent-browser/journey.spec.js` |
| Authentication only, no accessibility | `tests/cli/auth.spec.js`, `tests/mcp/auth.spec.js`, the SSO specs (tag `@auth`) |

To practise without any login, open the sample pages shipped with the package (see [Sample pages](../README.md#sample-pages-try-it-without-a-server)).
