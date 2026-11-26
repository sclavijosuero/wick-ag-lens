# Sample journeys: one test, every way in (CLI, MCP, agent-browser)

The package ships a small page and a small server so you can **run a real multi-step audit in a minute and compare, side by side, how each tool and each login method does the same thing**. Nothing here needs your own application.

**The journey** (`samples/steps-demo.html`): it uses **every step type once**: `click`, `fill`, `select`, `hover`, `press`, `wait`. Each step adds or removes a few accessibility problems, so every step of the report is a small, readable diff (new, resolved, and what stays the same).

```
click::#open-panel         opens a panel                    + an unnamed button
fill::#email::not-an-email a bad value                      + an invalid field
fill::#email::jdoe@example.com  a good value                - the invalid field is RESOLVED
select::#country::US       reveals a field                  + an unlabeled input
hover::#help               shows a tooltip                  + an empty link
press::#search::Enter      shows a result                   + an image without alt
wait::.toast               waits for a notification         + a generic link
wait::300                  waits 300 ms                     (no change)
press::active::Tab         moves the focus                  (no change)
press::active::Escape      closes the panel                 - the button and the input are RESOLVED
```

## 1. Start the sample server (only needed for the login examples)

The page also opens straight from disk, with no server: `node index.js audit "file:///.../samples/steps-demo.html" ...`. To try **logins**, start the server that ships next to it (from the package folder):

```bash
node samples/server.mjs        # http://127.0.0.1:4300  (SAMPLES_PORT=... to change it)
```

| URL | What it is |
| :-- | :-- |
| `http://127.0.0.1:4300/steps-demo.html` | the journey page, **public** |
| `http://127.0.0.1:4300/app/steps-demo.html` | the **same page**, but only after signing in |
| `http://127.0.0.1:4300/login.html` | the sign-in page. Demo credentials: `jdoe` / `Admin+123` |

The two journey URLs serve the identical page, so **the report must be the same with or without a login**; only how you got in changes. (This is exactly what the repository's tests assert.)

## 2. The same journey, every login, every tool

Below, `STEPS` is the list above written as flags, and `AUDITS` is `--audits "v-empty-buttons,v-aria-invalid,v-unlabeled-inputs,v-empty-links,v-missing-alt,v-generic-link,i-focus-order"`. Replace `$PUBLIC`/`$PROTECTED` with the URLs of section 1.

```bash
STEPS='--step click::#open-panel --step fill::#email::not-an-email --step fill::#email::jdoe@example.com
       --step select::#country::US --step hover::#help --step press::#search::Enter --step wait::.toast
       --step wait::300 --step press::active::Tab --step press::active::Escape'
```

### No login (the public page)

**CLI**
```bash
node index.js audit "$PUBLIC" $AUDITS $STEPS -s
```
**MCP**: `audit_baseline` then one `interact_and_diff` per step (the session stays open between calls)
```jsonc
{ "url": "$PUBLIC", "requestedAudits": ["v-empty-buttons", "..."] }                       // audit_baseline
{ "action": "click", "target": "#open-panel", "requestedAudits": ["v-empty-buttons", "..."] }   // interact_and_diff, then fill, select, ...
```
**agent-browser** looks first (cheap), then wick-ag-lens audits the same page:
```bash
agent-browser open "$PUBLIC"
agent-browser snapshot -i       # lists the controls, e.g. button "Open panel"
agent-browser close
# then the CLI or MCP call above
```

### Method 1: 2-field login (`-u` / `-p`)

| | |
| :-- | :-- |
| **CLI** | `node index.js audit "$PROTECTED" --login-url "http://127.0.0.1:4300/login.html" -u jdoe -p 'Admin+123' $AUDITS $STEPS -s` |
| **MCP** | `audit_baseline` with `"url": "$PROTECTED", "loginUrl": ".../login.html", "user": "jdoe", "pass": "Admin+123"`, then the same `interact_and_diff` calls |
| **agent-browser** | Not a login of its own: agent-browser hands a *session* over, see method 5. |

### Method 2: pipeline of steps (`--auth-step`)

| | |
| :-- | :-- |
| **CLI** | `node index.js audit "$PROTECTED" --login-url ".../login.html" --auth-step "fill::#user::jdoe" --auth-step "fill::#password::Admin+123" --auth-step "click::#login" $AUDITS $STEPS -s` |
| **MCP** | `audit_baseline` with `"authSteps": [ {"action":"fill","target":"#user","value":"jdoe"}, {"action":"fill","target":"#password","value":"Admin+123"}, {"action":"click","target":"#login"} ]` plus `"loginUrl"` |
| **agent-browser** | See method 5. |

### Method 3: login script (`--auth-script`)

The module `samples/login-script.mjs` logs in with the Playwright `page` it receives (6 lines: go to the login page, fill two fields, click, wait for the URL).

| | |
| :-- | :-- |
| **CLI** | `node index.js audit "$PROTECTED" --auth-script ./samples/login-script.mjs $AUDITS $STEPS -s` |
| **MCP** | `audit_baseline` with `"authScript": "/absolute/path/to/samples/login-script.mjs"` |
| **agent-browser** | See method 5. |

### Method 5: a saved session handed over (`-a` / `authState`)

This is where **agent-browser** shines: it signs in through the real page (using the accessibility snapshot to find the fields), saves the session, and wick-ag-lens loads that file; no login happens at audit time.

```bash
agent-browser open "http://127.0.0.1:4300/login.html"
agent-browser fill "#user" "jdoe"
agent-browser fill "#password" "Admin+123"
agent-browser click "#login"
agent-browser wait --url "**/app/steps-demo.html"
agent-browser state save state.json
agent-browser close
```

| | |
| :-- | :-- |
| **CLI** | `node index.js audit "$PROTECTED" -a state.json $AUDITS $STEPS -s` |
| **MCP** | `audit_baseline` with `"authState": "/absolute/path/state.json"`, then the same `interact_and_diff` calls |

(Method 4, `-i`, needs a person at a visible browser, so it has no automated example; its result is the same `state.json` used here.)

## 3. What you should see

Whatever the tool and the login, the report has **11 steps** (the page load plus the 10 above), the same findings in every step, and the same focus order. The first step's `url` is the **target page**, not the sign-in page (if a login fails, it is the sign-in page).

| Step | Action | New | Resolved |
| :-- | :-- | :-- | :-- |
| 1 | page load | none (clean page) | |
| 2 | click `#open-panel` | `v-empty-buttons` | |
| 3 | fill `#email` (bad) | `v-aria-invalid` | |
| 4 | fill `#email` (good) | | `v-aria-invalid` |
| 5 | select `#country` | `v-unlabeled-inputs` | |
| 6 | hover `#help` | `v-empty-links` | |
| 7 | press Enter in `#search` | `v-missing-alt` | |
| 8 | wait `.toast` | `v-generic-link` | |
| 9 | wait 300 ms | none | none |
| 10 | press Tab | none | none |
| 11 | press Escape | | `v-empty-buttons`, `v-unlabeled-inputs` |

Open the JSON in the [report viewer](../README.md#visual-html-report-viewer) (the `-s` flag adds a screenshot per step).

## 4. The same thing as tests, in the repository

This journey is the **short regression journey** of the repository's Playwright suite (`npm run test:journeys`). The same steps run through the CLI, MCP and agent-browser, on the public page and behind the sample login, and every run is compared with **one frozen file** with the expected findings per step:

| What | Where |
| :-- | :-- |
| The journey, in every tool, public and behind a login | `tests/regression/journeys.spec.js` (tag `@journeys`) |
| The expected findings, health and focus order per step | `tests/golden/short.json` |
| Login definitions of this sample server | `tests/helpers/sample-journeys.js` |
| The five login methods side by side, on a longer journey | `tests/regression/login-methods.spec.js` (tag `@logins`) |

For a login against your own application, see [auth-examples.md](auth-examples.md).
