// Tiny static server for the fixture pages (no dependencies).
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'pages');
const port = Number(process.env.FIXTURE_PORT || 4173);

http.createServer((req, res) => {
  const name = path.basename(new URL(req.url, 'http://x').pathname) || 'good.html';
  const file = path.join(root, name);
  if (!file.startsWith(root) || !fs.existsSync(file)) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`fixtures on :${port}`));
