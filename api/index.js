/**
 * Vercel serverless entry point.
 *
 * Vercel (and Node.js functions in general) expects a module exporting a
 * single function that it calls once per request. Our handler already has
 * that exact shape — (req, res) — so we simply re-export it.
 *
 * Request flow on Vercel:
 *   browser → vercel.json rewrite ("/((?!api).*)" → "/api")
 *          → api/index.js → handleRequest(req, res)
 *
 * The rewrite pattern is Vercel's documented negative-lookahead form. The
 * regex must be wrapped in exactly one capture group and contain no others,
 * otherwise the deploy fails with "invalid source pattern".
 */

const { handleRequest } = require("../src/handler");

module.exports = handleRequest;
