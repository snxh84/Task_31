/**
 * Simple smoke test: boots the server on a test port and checks that every
 * route returns the expected HTTP status code. Run with:  npm test
 */
const { spawn } = require("child_process");
const path = require("path");

const PORT = 3999;
const BASE = `http://localhost:${PORT}`;

const EXPECTATIONS = [
  ["/", 200],
  ["/home", 200],
  ["/about", 200],
  ["/contact", 200],
  ["/services", 200],
  ["/styles.css", 200],
  ["/public/styles.css", 200],
  ["/home/", 200],
  ["/no-such-page", 404],
  ["/../../etc/passwd", 404],
];

async function waitForServer(child, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      await fetch(BASE + "/home");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  child.kill();
  throw new Error("Server did not start in time");
}

async function run() {
  const child = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: "ignore",
  });

  let failed = 0;
  try {
    await waitForServer(child);

    for (const [route, expected] of EXPECTATIONS) {
      const res = await fetch(BASE + route);
      const ok = res.status === expected;
      if (!ok) failed++;
      console.log(`${ok ? "PASS" : "FAIL"}  ${String(res.status).padEnd(3)} (expected ${expected})  ${route}`);
    }

    // POST to a valid route should be rejected with 405.
    const post = await fetch(BASE + "/home", { method: "POST" });
    const postOk = post.status === 405;
    if (!postOk) failed++;
    console.log(`${postOk ? "PASS" : "FAIL"}  ${String(post.status).padEnd(3)} (expected 405)  POST /home`);
  } finally {
    child.kill();
  }

  console.log(failed === 0 ? "\nAll checks passed ✔" : `\n${failed} check(s) failed ✘`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
