/**
 * Pages are loaded eagerly with LITERAL paths.
 *
 * Why: deployment bundlers (like the one Vercel uses) trace file reads
 * statically to decide what to include in the serverless bundle. A path
 * built dynamically at request time would not be detected, and the pages
 * would be missing in production even though they work locally.
 */
const fs = require("fs");

const PAGES = {
  "home.html": fs.readFileSync(__dirname + "/../pages/home.html", "utf8"),
  "about.html": fs.readFileSync(__dirname + "/../pages/about.html", "utf8"),
  "contact.html": fs.readFileSync(__dirname + "/../pages/contact.html", "utf8"),
  "services.html": fs.readFileSync(__dirname + "/../pages/services.html", "utf8"),
  "404.html": fs.readFileSync(__dirname + "/../pages/404.html", "utf8"),
};

module.exports = { PAGES };
