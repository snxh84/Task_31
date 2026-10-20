/**
 * Static assets, loaded eagerly with LITERAL paths for the same reason as
 * src/pages.js — the bundler must be able to see them.
 *
 * Served at /styles.css (and /public/styles.css for backwards compatibility).
 */
const fs = require("fs");

const STYLES = {
  "/styles.css": fs.readFileSync(__dirname + "/../public/styles.css", "utf8"),
};

module.exports = { STYLES };
