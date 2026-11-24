// Tiny static server for the fixture pages (no dependencies), plus a fake cookie login used by the auth tests.
//
//   POST /login        user + password (+ optional company) -> sets the session cookie, redirects to /account.html
//   GET  /account.html protected: without the session cookie it redirects to /login-2field.html?denied=1
//   everything else    served as a static file from ./pages
//
// Demo credentials (fixtures only, never real secrets): jdoe / Admin+123, company Northwind.
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'pages');
const port = Number(process.env.FIXTURE_PORT || 4173);

const SESSION_COOKIE = 'wick_session';
const SESSION_VALUE = 'ok';
const VALID = { user: 'jdoe', password: 'Admin+123', company: 'Northwind' };

const redirect = (res, location, headers = {}) => res.writeHead(302, { Location: location, ...headers }).end();
const hasSession = (req) => (req.headers.cookie || '').split(/;\s*/).includes(`${SESSION_COOKIE}=${SESSION_VALUE}`);

function readForm(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(body))));
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const name = path.basename(url.pathname) || 'good.html';

  if (req.method === 'POST' && url.pathname === '/login') {
    const f = await readForm(req);
    const companyOk = f.company === undefined || f.company === VALID.company; // 2-field forms send no company
    if (f.user === VALID.user && f.password === VALID.password && companyOk) {
      return redirect(res, '/account.html', { 'Set-Cookie': `${SESSION_COOKIE}=${SESSION_VALUE}; Path=/; HttpOnly; SameSite=Lax` });
    }
    return redirect(res, '/login-failed.html');
  }

  if (name === 'account.html' && !hasSession(req)) return redirect(res, '/login-2field.html?denied=1');

  const file = path.join(root, name);
  if (!file.startsWith(root) || !fs.existsSync(file)) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`fixtures on :${port}`));
