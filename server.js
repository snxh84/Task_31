/**
 * Task 30 — Basic Web Server with the Node.js `http` module
 *
 * This file is the LOCAL entry point. It wraps the shared handler in a real
 * HTTP server so you can run everything on your own machine.
 *
 * On Vercel the same handler is exposed through api/index.js instead,
 * because serverless platforms call a function per request — they never
 * run `listen()`.
 *
 * Local run:  node server.js   (or: npm start / npm run dev)
 * Test:       http://localhost:3000/home
 */

const http = require("http");
const config = require("./src/config");
const { handleRequest } = require("./src/handler");

const server = http.createServer((req, res) => {
  try {
    handleRequest(req, res);
  } catch (err) {
    // Safety net: never let a request hang if something throws.
    console.error(`[error] ${req.method} ${req.url} ->`, err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    }
    res.end("500 — Internal Server Error");
  }
});

server.listen(config.PORT, () => {
  console.log(`✔ Server running at http://localhost:${config.PORT}`);
  console.log("  Routes: /home  /about  /contact  /services  (anything else = 404)");
});

// Graceful shutdown on Ctrl+C
process.on("SIGINT", () => {
  console.log("\nShutting down server...");
  server.close(() => process.exit(0));
});
