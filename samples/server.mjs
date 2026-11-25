// Sample server: run it to try wick-ag-lens on a page that needs a LOGIN. No dependencies.
//
//   node server.mjs                 (from this folder; PORT with SAMPLES_PORT, default 4300)
//
//   http://127.0.0.1:4300/steps-demo.html        public:    the same page, no login needed
//   http://127.0.0.1:4300/app/steps-demo.html    protected: redirects to /login.html unless you are signed in
//   http://127.0.0.1:4300/login.html             sign in with  jdoe / Admin+123   (demo credentials, not real secrets)
//
// Both URLs serve the very same page (steps-demo.html), so an audit with a login and one without give the same results:
// compare them side by side in docs/sample-journeys.md.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.SAMPLES_PORT || 4300);
const VALID = { user: 'jdoe', password: 'Admin+123' };
const COOKIE = 'sample_session=ok';

const send = (res, file) => {
  if (!/^[\w-]+\.html$/.test(path.basename(file)) || !fs.existsSync(file)) return res.writeHead(404).end('Not found');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(file).pipe(res);
};
const redirect = (res, to, headers = {}) => res.writeHead(302, { Location: to, ...headers }).end();

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const name = path.basename(url.pathname) || 'steps-demo.html';
  const signedIn = (req.headers.cookie || '').split(/;\s*/).includes(COOKIE);

  if (req.method === 'POST' && url.pathname === '/login') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const f = Object.fromEntries(new URLSearchParams(body));
      if (f.user === VALID.user && f.password === VALID.password) {
        return redirect(res, '/app/steps-demo.html', { 'Set-Cookie': `${COOKIE}; Path=/; HttpOnly; SameSite=Lax` });
      }
      redirect(res, '/login.html?error=1');
    });
    return;
  }

  if (url.pathname.startsWith('/app/')) {
    if (!signedIn) return redirect(res, '/login.html?denied=1');
    return send(res, path.join(here, name));
  }
  send(res, path.join(here, name));
}).listen(port, '127.0.0.1', () => console.log(`wick-ag-lens samples on http://127.0.0.1:${port}  (sign in: ${VALID.user} / ${VALID.password})`));
