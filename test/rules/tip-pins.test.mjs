/**
 * Database-rules tests for tip PINs, run against the Realtime Database
 * emulator so the real rules in database.rules.json are exercised.
 *
 *   npx firebase-tools@13 emulators:start --only database --project demo-ccb
 *   node test/rules/tip-pins.test.mjs
 *
 * firebase-tools 15 requires JDK 21; v13 runs on JDK 17, which is what this
 * machine has. Everything below talks to the emulator unauthenticated, which
 * is how the public tip intake reaches the database in production.
 */

const BASE = process.env.RTDB_EMULATOR ?? "http://127.0.0.1:9000";
const NS = process.env.RTDB_NAMESPACE ?? "demo-ccb-default-rtdb";
const url = (p) => `${BASE}/${p}.json?ns=${NS}`;

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};

const put = async (path, body) => {
  const res = await fetch(url(path), { method: "PUT", body: JSON.stringify(body) });
  return { status: res.status, ok: res.ok };
};
const read = async (path) => {
  const res = await fetch(url(path));
  return { status: res.status, ok: res.ok, json: res.ok ? await res.json() : null };
};
/** What `update(ref(db), {...})` sends: a PATCH at the root with absolute paths. */
const multiUpdate = async (updates) => {
  const res = await fetch(url(""), { method: "PATCH", body: JSON.stringify(updates) });
  return { status: res.status, ok: res.ok };
};

const now = Date.now();
const cipher = { message: "U2FsdGVkX1+notarealtip", encrypted: true };

// --- intake, as an anonymous tipster ----------------------------------------
const tipId = "-OaRulesTest0000001";
const pin = "K7M2QX";

check("anonymous can create a tip",
  (await put(`messages/${tipId}`, { ...cipher, created_at: now, pin })).ok);
check("anonymous can claim an unused PIN",
  (await put(`tipPins/${pin}`, { tipId, created_at: now })).ok);

// --- a PIN belongs to one tip, for good -------------------------------------
check("a claimed PIN cannot be reassigned",
  (await put(`tipPins/${pin}`, { tipId: "-OaSomeoneElse", created_at: now })).status === 401);
check("the PIN still points at the original tip",
  (await read(`tipPins/${pin}`)).json?.tipId === tipId);

// --- the PIN reveals nothing about the tip ----------------------------------
check("tips cannot be listed anonymously", (await read("messages")).status === 401);
check("one tip cannot be read anonymously", (await read(`messages/${tipId}`)).status === 401);
check("PINs cannot be enumerated", (await read("tipPins")).status === 401);
check("a PIN you already hold resolves", (await read(`tipPins/${pin}`)).ok);

// --- PIN shape --------------------------------------------------------------
for (const [bad, why] of Object.entries({
  ABC12: "too short",
  ABCDEFG: "too long",
  ABCDEO: "contains O",
  ABCDEI: "contains I",
  ABCDEL: "contains L",
  ABCDE0: "contains 0",
  ABCDE1: "contains 1",
  abcdef: "lowercase",
})) {
  check(`PIN rejected — ${why} (${bad})`,
    (await put(`tipPins/${bad}`, { tipId, created_at: now })).status === 401);
}
check("a PIN entry without tipId is rejected",
  (await put("tipPins/AAAAAA", { created_at: now })).status === 401);
check("an unexpected field on a PIN entry is rejected",
  (await put("tipPins/BBBBBB", { tipId, created_at: now, note: "smuggled" })).status === 401);
check("a tip carrying a malformed pin is rejected",
  (await put("messages/-OaRulesTest0000002", { ...cipher, created_at: now, pin: "AAAAA0" })).status === 401);
check("a tip from before PINs existed is still accepted",
  (await put("messages/-OaRulesTest0000003", { ...cipher, created_at: now })).ok);

// --- atomicity: /api/message writes the tip and its PIN in one update --------
const idA = "-OaAtomic0000000001";
const pinA = "R4TK9W";
check("tip and PIN are written together", (await multiUpdate({
  [`/messages/${idA}`]: { ...cipher, created_at: now, pin: pinA },
  [`/tipPins/${pinA}`]: { tipId: idA, created_at: now },
})).ok);

// A second tip drawing a taken PIN must fail whole: a tip with no PIN pointing
// at it would hand its tipster a PIN that silently belongs to someone else.
const idB = "-OaAtomic0000000002";
check("a colliding PIN rejects the entire update", (await multiUpdate({
  [`/messages/${idB}`]: { ...cipher, created_at: now, pin: pinA },
  [`/tipPins/${pinA}`]: { tipId: idB, created_at: now },
})).status === 401);
check("...and the PIN still belongs to the first tip",
  (await read(`tipPins/${pinA}`)).json?.tipId === idA);

// The route then retries with a fresh PIN. Its success is also what proves the
// rejected update left no orphan: /messages/$id is create-only for anonymous
// writers, so this would be denied if idB had survived the failed write.
// (Reading it back is not an option — /messages is admin-only, and an
// anonymous read is denied whether or not the tip is there.)
const pinB = "S5VK8Y";
check("the retry succeeds, proving no orphaned tip was left behind", (await multiUpdate({
  [`/messages/${idB}`]: { ...cipher, created_at: now, pin: pinB },
  [`/tipPins/${pinB}`]: { tipId: idB, created_at: now },
})).ok);
check("the two tips hold distinct PINs",
  (await read(`tipPins/${pinB}`)).json?.tipId === idB);

// --- follow-ups: a later message threaded onto an existing tip ---------------
// They hang off the tip itself, so deleting the tip takes them with it and the
// admin inbox gets the whole conversation in the read it already does.
check("anonymous can append a follow-up to an existing tip",
  (await put(`messages/${tipId}/followUps/fu1`, { ...cipher, created_at: now + 1 })).ok);
check("a follow-up cannot be overwritten once written",
  (await put(`messages/${tipId}/followUps/fu1`, { ...cipher, created_at: now + 2 })).status === 401);
check("appending a follow-up does not let the original tip be rewritten",
  (await put(`messages/${tipId}`, { ...cipher, created_at: now, pin })).status === 401);
check("follow-ups cannot be read anonymously",
  (await read(`messages/${tipId}/followUps`)).status === 401);
check("a follow-up without a message is rejected",
  (await put(`messages/${tipId}/followUps/fu2`, { created_at: now })).status === 401);
check("an unexpected field on a follow-up is rejected",
  (await put(`messages/${tipId}/followUps/fu3`, { ...cipher, created_at: now, pin: "K7M2QX" })).status === 401);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall tip-PIN rules checks passed");
process.exit(failures ? 1 : 0);
