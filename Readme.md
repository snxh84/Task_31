# Task 30 — Node.js `http` Module Web Server

A basic web server built with **only the Node.js core `http` module** (no Express,
no external dependencies) that routes incoming requests to different HTML pages and
returns appropriate HTTP status codes.

---

## Project structure

```
Task_30/
├── server.js            # LOCAL entry point — wraps the handler in http.createServer()
├── vercel.json          # Vercel routing config (sends every route to the function)
├── package.json
├── Readme.md
├── api/
│   └── index.js         # VERCEL entry point — re-exports the shared handler
├── src/
│   ├── config.js        # Port configuration
│   ├── router.js        # Route table: URL path -> HTML page
│   ├── handler.js       # Shared (req, res) handler used by BOTH entries
│   ├── pages.js         # HTML pages loaded into memory (bundler-safe paths)
│   └── static.js        # CSS loaded into memory (bundler-safe paths)
├── pages/               # HTML pages served by the router
│   ├── home.html
│   ├── about.html
│   ├── contact.html
│   ├── services.html    # Extra route (enhancement)
│   └── 404.html         # Custom error page
├── public/
│   └── styles.css       # Source for /styles.css
└── test/
    └── routes.test.js   # Automated route checks
```

## How it works

1. `src/handler.js` exposes a single function `handleRequest(req, res)`. It only
   uses the two arguments it is given — no port, no `listen()`, no state.
2. `src/router.js` looks the pathname up in a plain object route table and returns
   a route descriptor (`file`, `status`, `title`).
3. `src/pages.js` and `src/static.js` read the HTML/CSS **once at start-up** using
   literal paths, so deployment bundlers can trace and include them.
4. The handler writes the response with the correct `Content-Type` and status code.
5. Unknown paths fall through to the `404` route and serve `pages/404.html`
   with a **404 Not Found** status.

### Two entry points, one handler

| Environment | Entry point | What it does |
|-------------|-------------|--------------|
| **Local** | `server.js` | `http.createServer(handleRequest).listen(3000)` |
| **Vercel** | `api/index.js` | `module.exports = handleRequest` |

This split is the important part. Vercel is **serverless**, so it never runs
`listen()` — it invokes an exported function once per request. Keeping the logic in
`handleRequest` means there is exactly one implementation and no drift between
local and production.

## Routes

| Route       | Page              | Status |
|-------------|-------------------|--------|
| `/`         | `pages/home.html` | 200    |
| `/home`     | `pages/home.html` | 200    |
| `/about`    | `pages/about.html`| 200    |
| `/contact`  | `pages/contact.html` | 200 |
| `/services` | `pages/services.html` | 200 |
| `/styles.css` | `public/styles.css` | 200   |
| `/public/*` | static files (CSS) | 200   |
| *anything else* | `pages/404.html` | **404** |
| non-`GET` method | inline message | **405** |

## Getting started

```bash
# 1. Go into the folder
cd Task_30

# 2. Start the server (no npm install needed — zero dependencies)
node server.js
# → ✔ Server running at http://localhost:3000

# Or use npm scripts:
npm start      # run the server once
npm run dev    # run with auto-restart on file changes (node --watch)
npm test       # run the automated route checks

# 3. Open a browser and try the routes
#    http://localhost:3000/home
#    http://localhost:3000/about
#    http://localhost:3000/contact
#    http://localhost:3000/services
#    http://localhost:3000/this-route-does-not-exist   (404)
```

To use a different port:

```bash
PORT=8080 node server.js
```

Stop the server with `Ctrl + C`.

## Deploying to Vercel

The project is already set up for Vercel. It has **two entry points sharing one
handler**, because Vercel is serverless and never runs `server.listen()`.

| Environment | Entry point | How it runs |
|-------------|-------------|-------------|
| Local | `server.js` | `http.createServer(handleRequest).listen(3000)` |
| Vercel | `api/index.js` | `module.exports = handleRequest` |

**Why this matters.** A normal Node server keeps running and listens on a port.
Vercel instead calls an exported function once per request and throws the
instance away afterwards. Any project whose only entry point is
`http.createServer(...).listen(...)` will fail there, because nothing ever
exports a callable handler.

`vercel.json` sends every incoming path to the function in `api/`:

```json
{
  "rewrites": [
    { "source": "/((?!api).*)", "destination": "/api" }
  ]
}
```

Vercel applies `rewrites` **after** checking the filesystem, so real files in
`public/` (like `/styles.css`) are served directly and everything else falls
through to the handler — which is how `/home`, `/about`, `/contact`,
`/services` and the custom 404 all work on a serverless platform.

> **Note:** earlier drafts used the legacy `"builds"` property with an
> `"@vercel/node"` key. That form is invalid — the correct key is
> `"use": "@vercel/node"` — and it is unnecessary anyway, since Vercel
> auto-detects the `api/` folder. The `rewrites`-only config above is the
> current zero-config approach.
>
> **On the `source` pattern.** Vercel compiles `source` with `path-to-regexp`
> and rejects any pattern containing more than one capture group, failing the
> deploy with *"Rewrite at index 0 has invalid `source` pattern"*. The regex
> must therefore be wrapped in exactly one capture group. An earlier version
> used `/((?!api($|/)).*)` — the nested `($|/)` is a **second** capture group,
> which is why it was rejected. Swapping to a non-capturing group
> (`(?:$|/)`) is not enough either, because the anchor `$/` is unnecessary:
> `.*` cannot match an empty string past `api`, so `/((?!api).*)` already
> excludes both `/api` and `/api/index` without a loop.
>
> Verified against `path-to-regexp`: `/((?!api).*)` matches `/`, `/home`,
> `/about`, `/contact`, `/services`, `/styles.css` and `/nope`, while leaving
> `/api` and `/api/index` untouched.

**To deploy:**

```bash
# 1. Make sure these are committed and pushed to GitHub
git add api vercel.json src server.js
git commit -m "Add Vercel serverless entry point"
git push

# 2. In the Vercel dashboard: Import the repo
#    - Framework Preset: Other
#    - Root Directory:   Task_30        <-- important, if the repo has other folders
#    - Build Command:    (leave empty)
#    - Output Directory: (leave empty)
# 3. Deploy. Then check:
#    https://your-app.vercel.app/home
#    https://your-app.vercel.app/about
#    https://your-app.vercel.app/nope     (should show the custom 404)
```

If you get an `EAI_AGAIN` / 404 on every route, the Root Directory is almost
certainly wrong — Vercel will not find `api/index.js` otherwise.

**One common gotcha:** pages and CSS are loaded eagerly in `src/pages.js` and
`src/static.js` using literal paths such as
`fs.readFileSync(__dirname + "/../pages/home.html")`. This is deliberate.
Vercel's bundler traces file reads statically to decide what to ship, so a path
built dynamically at request time (`path.join(dir, route.file)`) would silently
be left out of the bundle — the site would work locally and 500 in production.

## Testing / evidence

Logs from the live test run are stored in the `logs/` folder:

| File | Contents |
|------|----------|
| `logs/server-startup.txt` | Server boot message on port 3000 |
| `logs/status-codes.txt` | `curl` checks showing the status code returned by every route |
| `logs/automated-tests.txt` | Output of `npm test` — all 11 route assertions pass |
| `screenshots/01-home.png` | Browser screenshot of the rendered `/home` page |

**Server startup log:**

```
✔ Server running at http://localhost:3000
  Routes: /home  /about  /contact  /services  (anything else = 404)
```

**Status codes per route (`curl`):**

```
GET /                200
GET /home            200
GET /about           200
GET /contact         200
GET /services        200
GET /public/styles.css  200
GET /does-not-exist  404
GET /random/page     404
POST /home           405

Content-Type: /home -> text/html; charset=utf-8
Content-Type: /public/styles.css -> text/css; charset=utf-8
```

**Automated test run:**

```
PASS  200 (expected 200)  /home
PASS  200 (expected 200)  /about
PASS  200 (expected 200)  /contact
...
All checks passed ✔
```

To reproduce the `curl` checks yourself while the server is running:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/home
```

## Requirements checklist

- [x] Built with the Node.js `http` module
- [x] Listens on a specified port (3000)
- [x] Routes `/home`, `/about`, `/contact` to their own HTML pages
- [x] At least three HTML pages, one per route
- [x] Appropriate HTTP status codes (200 / 404 / 405)
- [x] Asynchronous, modular code (`src/` split into config, router, handler)
- [x] Custom 404 page for invalid routes
- [x] CSS styling shared across all pages
- [x] Extra meaningful route: `/services`
