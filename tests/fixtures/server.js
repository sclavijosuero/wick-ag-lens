// Tiny static server for the fixture pages (no dependencies), plus fake logins used by the auth tests.
//
// APP origin   http://127.0.0.1:<FIXTURE_PORT>      (default 4173)
//   POST /login           user + password (+ optional company) -> sets the session cookie, redirects to /account.html
//   GET  /account.html    protected: without the session cookie it redirects to /login-2field.html?denied=1
//   GET  /sso/account.html  protected, SSO flavour: without the session cookie it redirects to the IdP (below)
//   GET  /sso/callback    the IdP sends the user back here with ?code=...; a valid code sets the session cookie
//   everything else       served as a static file from ./pages
//
// IDP origin   http://localhost:<FIXTURE_PORT + 1>   (a different host AND port: a real cross-origin redirect)
//   GET  /authorize       two-screen sign-in page (user name, then password)
//   POST /idp/login       valid credentials -> sets the IdP's own cookie and redirects back to the app with a code
//
// Demo credentials (fixtures only, never real secrets): jdoe / Admin+123, company Northwind.
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'pages');
const port = Number(process.env.FIXTURE_PORT || 4173);
const idpPort = port + 1;
const APP = `http://127.0.0.1:${port}`;
const IDP = `http://localhost:${idpPort}`;

const SESSION_COOKIE = 'wick_session';
const SESSION_VALUE = 'ok';
const IDP_COOKIE = 'idp_session';
const AUTH_CODE = 'idp-code-123'; // what the IdP hands to the app after a successful sign-in
const VALID = { user: 'jdoe', password: 'Admin+123', company: 'Northwind' };

const redirect = (res, location, headers = {}) => res.writeHead(302, { Location: location, ...headers }).end();
const hasCookie = (req, name, value) => (req.headers.cookie || '').split(/;\s*/).includes(`${name}=${value}`);
const hasSession = (req) => hasCookie(req, SESSION_COOKIE, SESSION_VALUE);
const cookie = (name, value) => `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`;

function sendFile(res, file) {
  if (!file.startsWith(root) || !fs.existsSync(file)) return res.writeHead(404).end('Not found');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(file).pipe(res);
}

function readForm(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(body))));
  });
}

// ---- The application ----
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const name = path.basename(url.pathname) || 'good.html';

  // Readiness probe used by playwright.config.js. Bump FIXTURE_SERVER_VERSION whenever routes are added: a stale server
  // (e.g. left running by an open Playwright UI) does not answer here, so the run fails loudly instead of using old routes.
  if (url.pathname === '/__fixture-server') return res.writeHead(200, { 'Content-Type': 'text/plain' }).end('fixture-server v2');

  if (req.method === 'POST' && url.pathname === '/login') {
    const f = await readForm(req);
    const companyOk = f.company === undefined || f.company === VALID.company; // 2-field forms send no company
    if (f.user === VALID.user && f.password === VALID.password && companyOk) {
      return redirect(res, '/account.html', { 'Set-Cookie': cookie(SESSION_COOKIE, SESSION_VALUE) });
    }
    return redirect(res, '/login-failed.html');
  }

  // SSO: no app session -> send the browser to the identity provider, which sends it back to /sso/callback
  if (url.pathname === '/sso/account.html') {
    if (hasSession(req)) return sendFile(res, path.join(root, 'account.html'));
    const authorize = new URL('/authorize', IDP);
    authorize.search = new URLSearchParams({ client_id: 'wick-app', redirect_uri: `${APP}/sso/callback`, state: 'xyz' }).toString();
    return redirect(res, authorize.toString());
  }
  if (url.pathname === '/sso/callback') {
    if (url.searchParams.get('code') !== AUTH_CODE) return res.writeHead(403).end('Invalid authorization code');
    return redirect(res, '/sso/account.html', { 'Set-Cookie': cookie(SESSION_COOKIE, SESSION_VALUE) });
  }

  if (name === 'account.html' && !hasSession(req)) return redirect(res, '/login-2field.html?denied=1');

  // Protected copy of the multi-step journey page (journey.html): same page, but only with the session cookie.
  // Lets the agent-browser tests prove a handed-over session survives a whole multi-step audit (and a navigation).
  if (url.pathname === '/app/journey.html') {
    if (!hasSession(req)) return redirect(res, '/login-2field.html?denied=1');
    return sendFile(res, path.join(root, 'journey.html'));
  }

  sendFile(res, path.join(root, name));
}).listen(port, '127.0.0.1', () => console.log(`fixtures on ${APP}`));

// ---- The identity provider (another origin) ----
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');

  if (req.method === 'GET' && url.pathname === '/authorize') return sendFile(res, path.join(root, 'idp-login.html'));

  if (req.method === 'POST' && url.pathname === '/idp/login') {
    const f = await readForm(req);
    const back = new URL(f.redirect_uri || '', APP);
    if (back.origin !== APP) return res.writeHead(400).end('Unknown redirect_uri'); // only our own app is a valid client
    if (f.user === VALID.user && f.password === VALID.password) {
      back.search = new URLSearchParams({ code: AUTH_CODE, state: f.state || '' }).toString();
      return redirect(res, back.toString(), { 'Set-Cookie': cookie(IDP_COOKIE, 'ok') });
    }
    const retry = new URL('/authorize', IDP);
    retry.search = new URLSearchParams({ error: 'invalid_credentials', redirect_uri: f.redirect_uri || '', state: f.state || '' }).toString();
    return redirect(res, retry.toString());
  }

  res.writeHead(404).end('Not found');
}).listen(idpPort, '127.0.0.1', () => console.log(`fixture identity provider on ${IDP}`));
