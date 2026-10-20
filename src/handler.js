/**
 * Request handler shared by:
 *   - server.js        (local development, via http.createServer)
 *   - api/index.js     (Vercel serverless function)
 *
 * It only uses (req, res) — no `server.listen()`, no port, no state — so the
 * same function works in both environments.
 *
 * Pages and static assets are pre-loaded in memory by src/pages.js and
 * src/static.js; there are no dynamic file-system reads at request time.
 */
const { matchRoute } = require("./router");
const { PAGES } = require("./pages");
const { STYLES } = require("./static");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-cache",
};

const NOT_ALLOWED_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>405 Method Not Allowed</title>
<link rel="stylesheet" href="/styles.css"></head>
<body><main class="error-page"><p class="error-code">405</p>
<h1>Method Not Allowed</h1>
<p>Use the <code>GET</code> method for this route.</p>
<p><a class="btn" href="/home">← Back home</a></p></main></body></html>`;

/** Escape text before inserting it into HTML. */
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function send(res, status, contentType, body) {
  res.writeHead(status, { ...HEADERS, "Content-Type": contentType });
  res.end(body);
}

/** Serve a pre-loaded static asset by URL path. */
function serveAsset(res, pathname) {
  const body = STYLES[pathname] ?? STYLES[pathname.replace(/^\/public/, "")];
  if (body === undefined) return false;

  const ext = pathname.slice(pathname.lastIndexOf("."));
  send(res, 200, MIME_TYPES[ext] || "application/octet-stream", body);
  return true;
}

/**
 * The single entry point for every request.
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 */
function handleRequest(req, res) {
  let pathname = "/";
  try {
    pathname = new URL(req.url, "http://localhost").pathname;
  } catch {
    /* malformed URL — fall through to the 404 route */
  }

  // Static assets: /styles.css and the legacy /public/styles.css path.
  if (pathname.startsWith("/public/") || pathname === "/styles.css") {
    if (serveAsset(res, pathname)) return;
    return send(res, 404, "text/plain; charset=utf-8", "404 — Not Found");
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, MIME_TYPES[".html"], NOT_ALLOWED_HTML);
  }

  const route = matchRoute(req.method, pathname);
  const html = PAGES[route.file];

  if (html === undefined) {
    // A route points at a page that failed to load at start-up.
    console.error(`[error] page missing from bundle: ${route.file}`);
    return send(res, 500, "text/plain; charset=utf-8", "500 — Could not load the page");
  }

  if (req.method === "HEAD") {
    res.writeHead(route.status, { ...HEADERS, "Content-Type": MIME_TYPES[".html"] });
    return res.end();
  }

  send(res, route.status, MIME_TYPES[".html"], html);
}

module.exports = { handleRequest };
