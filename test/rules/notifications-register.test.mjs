/**
 * Database-rules tests for push-notification registration.
 *
 *   npm run test:rules
 *
 * Why this exists: the mobile app (app/index.tsx, checkTokenExists) reads
 * `notifications_register/$token` on startup to decide whether to register the
 * device, and its failure path only calls console.log. So if that read is ever
 * denied, no device registers for notifications again and nothing surfaces the
 * problem — the app just quietly stops. Locking the node down without a
 * per-token read would have done exactly that.
 */

const BASE = process.env.RTDB_EMULATOR ?? "http://127.0.0.1:9000";
const NS = process.env.RTDB_NAMESPACE ?? "demo-ccb-default-rtdb";
const url = (p) => `${BASE}/${p}.json?ns=${NS}`;

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};

const status = async (path) => (await fetch(url(path))).status;
const put = async (path, body) =>
  (await fetch(url(path), { method: "PUT", body: JSON.stringify(body) })).status;

const TOKEN = "ExponentPushToken5btestdevice";

check("a device can check its own token — the startup read",
  (await status(`notifications_register/${TOKEN}`)) === 200);
check("a device can register itself",
  (await put(`notifications_register/${TOKEN}`, { registered: true, at: Date.now() })) === 200);
check("the re-check then finds it, so it does not register twice",
  (await status(`notifications_register/${TOKEN}`)) === 200);

// Knowing one token tells you nothing about the rest: the device already holds
// its own token, but the list of every device stays admin-only.
check("the token list is not enumerable",
  (await status("notifications_register")) === 401);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nnotification registration survives the locked rules");
process.exit(failures ? 1 : 0);
