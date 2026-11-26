// Where the sample server shipped in the package (cli/samples/server.mjs, started by playwright.config.js) serves the short journey
// (samples/steps-demo.html): the public page, the protected copy behind the sample login, and the login page and its demo credentials.
// How each login is run lives in helpers/login-matrix.js; the expectations are the frozen ones in tests/golden/short.json.

const PORT = Number(process.env.SAMPLES_PORT || 4310);
const BASE = `http://127.0.0.1:${PORT}`;
const PUBLIC_URL = `${BASE}/steps-demo.html`;
const PROTECTED_URL = `${BASE}/app/steps-demo.html`;
const LOGIN_URL = `${BASE}/login.html`;
const USER = 'jdoe';
const PASSWORD = 'Admin+123';                                         // demo credentials of the sample server

module.exports = { BASE, PUBLIC_URL, PROTECTED_URL, LOGIN_URL, USER, PASSWORD };
