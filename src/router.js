/**
 * Routing table.
 *
 * Keeping routes in their own module keeps `server.js` focused on the
 * transport layer and makes adding a new page a one-line change.
 */

const routes = {
  "/": { file: "home.html", status: 200, title: "Home" },
  "/home": { file: "home.html", status: 200, title: "Home" },
  "/about": { file: "about.html", status: 200, title: "About" },
  "/contact": { file: "contact.html", status: 200, title: "Contact" },
  "/services": { file: "services.html", status: 200, title: "Services" },
};

/**
 * Resolve an incoming request to a route descriptor.
 * @param {string} method HTTP method
 * @param {string} pathname URL path, query string already stripped
 * @returns {{file: string, status: number, title: string, is404?: boolean}}
 */
function matchRoute(method, pathname) {
  if (method !== "GET" && method !== "HEAD") {
    return { file: null, status: 405, title: "Method Not Allowed", is405: true };
  }

  const key = pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)   // normalise trailing slash: /about/ -> /about
    : pathname;

  const route = routes[key];
  if (!route) {
    return { file: "404.html", status: 404, title: "Not Found", is404: true };
  }
  return route;
}

module.exports = { matchRoute, routes };
