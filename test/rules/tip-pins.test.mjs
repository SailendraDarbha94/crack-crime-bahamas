/**
 * Database-rules tests for tip PINs, run against the Realtime Database
 * emulator so the real rules in database.rules.json are exercised.
 *
 *   npx firebase-tools@13 emulators:start --only database --project demo-ccb
 *   node test/rules/tip-pins.test.mjs
 *
 * firebase-tools 15 requires JDK 21; v13 runs on JDK 17, which is what this
 * machine has. Unless a check says otherwise it talks to the emulator
 * unauthenticated, which is how the public tip intake reaches the database in
 * production — and how anyone else can, which is the point of half of these.
 */

const BASE = process.env.RTDB_EMULATOR ?? "http://127.0.0.1:9000";
const NS = process.env.RTDB_NAMESPACE ?? "demo-ccb-default-rtdb";

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const tokenFor = (uid) =>
  `${b64({ alg: "none", typ: "JWT" })}.${b64({ uid, sub: uid, user_id: uid, iat: 1, exp: 9999999999 })}.`;
/** `who` is "anon" (the default), "owner" (bypasses the rules, to seed data) or a uid. */
const url = (p, who) => `${BASE}/${p}.json?ns=${NS}${who && who !== "anon" && who !== "owner" ? `&auth=${tokenFor(who)}` : ""}`;
const init = (method, body, who) => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  ...(who === "owner" ? { headers: { Authorization: "Bearer owner" } } : {}),
});

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};

const put = async (path, body, who = "anon") => {
  const res = await fetch(url(path, who), init("PUT", body, who));
  return { status: res.status, ok: res.ok };
};
const del = async (path, who = "anon") => {
  const res = await fetch(url(path, who), init("DELETE", undefined, who));
  return { status: res.status, ok: res.ok };
};
const read = async (path, who = "anon") => {
  const res = await fetch(url(path, who), init("GET", undefined, who));
  return { status: res.status, ok: res.ok, json: res.ok ? await res.json() : null };
};
/** What `update(ref(db), {...})` sends: a PATCH at the root with absolute paths. */
const multiUpdate = async (updates, who = "anon") => {
  const res = await fetch(url("", who), init("PATCH", updates, who));
  return { status: res.status, ok: res.ok };
};

const now = Date.now();
const cipher = { message: "U2FsdGVkX1+notarealtip", encrypted: true };
/** A tip and its PIN index entry in one write: the only way the intake files a tip. */
const fileTip = (id, pin, who = "anon", extra = {}) => multiUpdate({
  [`/messages/${id}`]: { ...cipher, created_at: now, pin, ...extra },
  [`/tipPins/${pin}`]: { tipId: id, created_at: now },
}, who);

const ADMIN = "admin1", OFFICER = "cop1", RANDO = "rando1";
await put(`admins/${ADMIN}`, true, "owner");
await put(`police/${OFFICER}`, true, "owner");

// --- intake, as an anonymous tipster ----------------------------------------
const tipId = "-OaRulesTest0000001";
const pin = "K7M2QX";

check("a tip and its PIN are filed together", (await fileTip(tipId, pin)).ok);
check("the PIN resolves to the tip", (await read(`tipPins/${pin}`)).json?.tipId === tipId);

// --- a PIN belongs to one tip, for good -------------------------------------
check("a claimed PIN cannot be pointed at another tip",
  (await put(`tipPins/${pin}`, { tipId: "-OaSomeoneElse", created_at: now })).status === 401);
check("...not even by filing a new tip that carries it",
  (await fileTip("-OaRulesTest000000X", pin)).status === 401);
check("the PIN still points at the original tip",
  (await read(`tipPins/${pin}`)).json?.tipId === tipId);

// --- the PIN reveals nothing about the tip ----------------------------------
check("tips cannot be listed anonymously", (await read("messages")).status === 401);
check("one tip cannot be read anonymously", (await read(`messages/${tipId}`)).status === 401);
check("PINs cannot be enumerated", (await read("tipPins")).status === 401);
check("a PIN you already hold resolves", (await read(`tipPins/${pin}`)).ok);

// --- PIN shape --------------------------------------------------------------
// Each is tried the way the intake files a tip, so nothing but the PIN is wrong.
let shapeTip = 0;
const nextShapeId = () => `-OaShapeTest${String(++shapeTip).padStart(7, "0")}`;
for (const [bad, why] of Object.entries({
  ABC12: "too short",
  ABCDEFG: "too long",
  ABCDEO: "contains O",
  ABCDEI: "contains I",
  ABCDEL: "contains L",
  ABCDE0: "contains 0",
  ABCDE1: "contains 1",
  abcde2: "lowercase",
})) {
  check(`PIN rejected — ${why} (${bad})`, (await fileTip(nextShapeId(), bad)).status === 401);
}

// A message that merely CONTAINS a registered PIN is filed under that PIN's
// tip, and anyone can write to this index. So a PIN may not be an ordinary
// word or an ordinary number: whoever registered "NASSAU" would collect every
// tip that mentions Nassau. A new PIN must mix letters and digits.
for (const word of ["NASSAU", "STREET", "MURDER", "PARKED", "WANTED", "GUNMAN", "CHURCH", "MARKET"]) {
  check(`a word cannot be registered as a PIN (${word})`, (await fileTip(nextShapeId(), word)).status === 401);
}
for (const number of ["234567", "999999", "253847"]) {
  check(`a number cannot be registered as a PIN (${number})`, (await fileTip(nextShapeId(), number)).status === 401);
}
check("...not by a signed-in account either", (await fileTip(nextShapeId(), "NASSAU", RANDO)).status === 401);
check("...nor by an admin (the intake files call-in tips as one)", (await fileTip(nextShapeId(), "NASSAU", ADMIN)).status === 401);
// The refused writes above were refused whole: had any left its tip behind,
// this would be denied, because a tip can only be created once.
check("a refused registration leaves no tip behind", (await fileTip("-OaShapeTest0000009", "N2SSAU")).ok);
for (const mixed of ["2ABCDE", "ABCDE2", "ABC2DE", "A23456", "23456A", "2A2A2A", "Z9Z9Z9"]) {
  check(`a PIN mixing letters and digits is accepted, wherever the digit sits (${mixed})`,
    (await fileTip(nextShapeId(), mixed)).ok);
}

// --- an index entry must come with its own tip -----------------------------------
// The intake always writes the two together, so the rules insist on it. Without
// this, someone could point any number of PINs at one tip (or at nothing) where
// no admin would ever see them. With it, every PIN in the index is a tip in the
// inbox, carrying that PIN, where it can be read and deleted.
check("an entry on its own, naming an existing tip, is refused",
  (await put("tipPins/A2B3C4", { tipId, created_at: now })).status === 401);
check("an entry on its own, naming a tip that does not exist, is refused",
  (await put("tipPins/A2B3C4", { tipId: "-OaNoSuchTip00000001", created_at: now })).status === 401);
check("an entry filed with a tip that carries a different PIN is refused", (await multiUpdate({
  "/messages/-OaBindTest00000001": { ...cipher, created_at: now, pin: "D4E5F6" },
  "/tipPins/A2B3C4": { tipId: "-OaBindTest00000001", created_at: now },
})).status === 401);
check("an entry filed with a tip that carries no PIN is refused", (await multiUpdate({
  "/messages/-OaBindTest00000001": { ...cipher, created_at: now },
  "/tipPins/A2B3C4": { tipId: "-OaBindTest00000001", created_at: now },
})).status === 401);
check("a second PIN for the same new tip is refused, and takes the whole write with it", (await multiUpdate({
  "/messages/-OaBindTest00000001": { ...cipher, created_at: now, pin: "D4E5F6" },
  "/tipPins/D4E5F6": { tipId: "-OaBindTest00000001", created_at: now },
  "/tipPins/A2B3C4": { tipId: "-OaBindTest00000001", created_at: now },
})).status === 401);
check("an entry slipped in beside a follow-up to an existing tip is refused", (await multiUpdate({
  [`/messages/${tipId}/followUps/sneak1`]: { ...cipher, created_at: Date.now() },
  "/tipPins/A2B3C4": { tipId, created_at: now },
})).status === 401);
check("an officer cannot add an entry for an existing tip",
  (await put("tipPins/A2B3C4", { tipId, created_at: now }, OFFICER)).status === 401);
check("an unapproved signed-in account cannot either",
  (await put("tipPins/A2B3C4", { tipId, created_at: now }, RANDO)).status === 401);
check("nor can an admin: the rule is about the entry, not about who writes it",
  (await put("tipPins/A2B3C4", { tipId, created_at: now }, ADMIN)).status === 401);
check("none of those attempts registered the PIN", (await read("tipPins/A2B3C4")).json === null);
check("...or left a tip behind", (await fileTip("-OaBindTest00000001", "D4E5F6")).ok);

check("a PIN entry without tipId is rejected", (await multiUpdate({
  "/messages/-OaBindTest00000002": { ...cipher, created_at: now, pin: "E5F6G7" },
  "/tipPins/E5F6G7": { created_at: now },
})).status === 401);
check("an unexpected field on a PIN entry is rejected", (await multiUpdate({
  "/messages/-OaBindTest00000002": { ...cipher, created_at: now, pin: "E5F6G7" },
  "/tipPins/E5F6G7": { tipId: "-OaBindTest00000002", created_at: now, note: "smuggled" },
})).status === 401);

// The intake builds a database path from the tip id an entry names: only
// key-shaped ids, or a planted one could aim a write elsewhere in the tree or
// make the route throw before storing a tip.
for (const [bad, why] of Object.entries({
  "-OaRulesTest0000001/zz": "a slash (a deeper path)",
  "-OaRulesTest0000001/message": "a path into the tip's text",
  "a.b": "a dot",
  ".": "only a dot",
  "a#b": "a hash",
  "a$b": "a dollar sign",
  "a[b]": "brackets",
  "a b": "a space",
  "": "nothing",
})) {
  check(`a PIN entry naming a tip id with ${why} is rejected`,
    (await put("tipPins/C3C3C3", { tipId: bad, created_at: now })).status === 401);
}
// Those ids cannot be database keys at all, so an entry naming one can only be
// tried on its own (and an entry on its own is refused anyway). These two are
// tried the way the intake files a tip, so that only the id's shape is wrong:
// a key with a space in it is a legal key, but not one the intake would make.
check("an entry filed with a tip whose key has a space in it is refused", (await multiUpdate({
  "/messages/a b": { ...cipher, created_at: now, pin: "U8V9W2" },
  "/tipPins/U8V9W2": { tipId: "a b", created_at: now },
})).status === 401);
check("a tip id with every character a push id can hold is accepted",
  (await fileTip("-Oa_Rules-Test0000009", "X3Y4Z5")).ok);
// The strongest form of the slash trick: a new tip built so that the path the
// entry names really does hold the PIN. Only the shape of the id stops it.
check("an entry naming a path inside a specially built new tip is refused", (await multiUpdate({
  "/messages/-OaPathTest00000001": { ...cipher, created_at: now, pin: "F6G7H8", zz: { pin: "G7H8J9" } },
  "/tipPins/G7H8J9": { tipId: "-OaPathTest00000001/zz", created_at: now },
})).status === 401);
check("a tip id that is not text is refused", (await multiUpdate({
  "/messages/12345": { ...cipher, created_at: now, pin: "H8J9K2" },
  "/tipPins/H8J9K2": { tipId: 12345, created_at: now },
})).status === 401);

// The intake relies on this: when a PIN entry names a tip that is not there
// (deleted since, or never real), the follow-up is refused, and the intake
// then tries the next candidate or stores the message as a new tip.
check("a follow-up to a tip that does not exist is refused",
  (await put("messages/-OaNoSuchTip00000001/followUps/fu1", { ...cipher, created_at: Date.now() })).status === 401);
check("a tip carrying a malformed pin is rejected",
  (await put("messages/-OaRulesTest0000002", { ...cipher, created_at: now, pin: "AAAAA0" })).status === 401);
check("a tip from before PINs existed is still accepted",
  (await put("messages/-OaRulesTest0000003", { ...cipher, created_at: now })).ok);
// The intake's last resort when the index will not take an entry: the tip
// alone, PIN on it, nothing in the index.
check("a tip can still be stored on its own, PIN and all, without an index entry",
  (await put("messages/-OaRulesTest0000004", { ...cipher, created_at: now, pin: "J9K2M3" })).ok);
// ...and nobody can come along afterwards and register that PIN for it. The
// tip exists and carries exactly this PIN, so the only thing wrong is that the
// entry was not written together with it.
check("an existing tip's own PIN cannot be registered for it later",
  (await put("tipPins/J9K2M3", { tipId: "-OaRulesTest0000004", created_at: now })).status === 401);
check("...not by an admin either",
  (await put("tipPins/J9K2M3", { tipId: "-OaRulesTest0000004", created_at: now }, ADMIN)).status === 401);

// --- the one key that would hide a tip --------------------------------------------
// The admin pages read /messages into a plain object. A child called
// "__proto__" becomes that object's prototype instead of an entry, so a tip
// filed under it would never be listed: a place to register one PIN and
// collect tips where no admin could see them.
check("a tip cannot be filed under the key __proto__", (await multiUpdate({
  "/messages/__proto__": { ...cipher, created_at: now, pin: "V9W2X3" },
  "/tipPins/V9W2X3": { tipId: "__proto__", created_at: now },
})).status === 401);
check("...nor stored there on its own",
  (await put("messages/__proto__", { ...cipher, created_at: now, pin: "V9W2X3" })).status === 401);
check("...nor by an admin",
  (await put("messages/__proto__", { ...cipher, created_at: now }, ADMIN)).status === 401);
// One that got in before this rule (seeded here as the database owner) can no
// longer be added to, and can still be removed.
await put("messages/__proto__", { ...cipher, created_at: now - 86400000, pin: "W2X3Y4" }, "owner");
check("(the planted tip is really there)", (await read("messages/__proto__", "owner")).json?.pin === "W2X3Y4");
check("a message cannot be added to one that was planted earlier",
  (await put("messages/__proto__/followUps/fu1", { ...cipher, created_at: Date.now() })).status === 401);
check("an admin can remove one that was planted earlier", (await del("messages/__proto__", ADMIN)).ok);
check("...and it is gone", (await read("messages/__proto__", "owner")).json === null);

// The same key one level down. A "__proto__" child of a tip becomes the
// prototype of the record the staff pages read, so fields the rules never saw
// (an archive mark, a source, follow-ups) would be read from it: a tip could
// be born looking archived, and so never show in the inbox. JSON.parse is used
// because an object literal would not carry the key at all.
const withProtoChild = (extra = {}) => JSON.parse(JSON.stringify({ ...cipher, created_at: now, ...extra })
  .replace(/}$/, `,"__proto__":{"archive":{"at":4102444800000,"by":"x","remarks":"U2FsdGVkX1+r"},"source":"call"}}`));
check("a tip cannot be stored with a __proto__ child",
  (await put("messages/-OaProtoChild000001", withProtoChild())).status === 401);
check("...not together with a PIN of its own", (await multiUpdate({
  "/messages/-OaProtoChild000001": withProtoChild({ pin: "Y4Z5A6" }),
  "/tipPins/Y4Z5A6": { tipId: "-OaProtoChild000001", created_at: now },
})).status === 401);
check("...and not by an admin", (await put("messages/-OaProtoChild000001", withProtoChild(), ADMIN)).status === 401);
check("a __proto__ child cannot be added to an existing tip by an admin either",
  (await put(`messages/${tipId}/__proto__`, { archive: { at: 1, by: ADMIN, remarks: "x" } }, ADMIN)).status === 401);
check("a follow-up cannot be stored under the key __proto__",
  (await put(`messages/${tipId}/followUps/__proto__`, { ...cipher, created_at: Date.now() })).status === 401);
check("none of that left a tip behind", (await fileTip("-OaProtoChild000001", "Y4Z5A6")).ok);
// What tips really carry besides the declared fields must still be accepted.
check("a tip with the other fields found on real tips is still accepted",
  (await put("messages/-OaExtraFields00001", { ...cipher, created_at: now, updated_at: now, pin: "Z5A6B7" })).ok);

// --- PINs issued before the rule keep working ---------------------------------------
// About one PIN in six issued before this rule is letters only. Those entries
// are already in the index (seeded here as the database owner); the rule only
// judges new ones.
const legacyId = "-OaLegacyTip0000001";
const legacyPin = "HQWRTY";
await put(`messages/${legacyId}`, { ...cipher, created_at: now - 86400000, pin: legacyPin }, "owner");
await put(`tipPins/${legacyPin}`, { tipId: legacyId, created_at: now - 86400000 }, "owner");
check("a letters-only PIN issued earlier still resolves", (await read(`tipPins/${legacyPin}`)).json?.tipId === legacyId);
check("...and its tipster can still follow up",
  (await put(`messages/${legacyId}/followUps/fu1`, { ...cipher, created_at: Date.now() })).ok);
check("...and it still cannot be pointed elsewhere",
  (await put(`tipPins/${legacyPin}`, { tipId, created_at: now })).status === 401);

// --- atomicity: /api/message writes the tip and its PIN in one update --------
const idA = "-OaAtomic0000000001";
const pinA = "R4TK9W";
check("tip and PIN are written together", (await fileTip(idA, pinA)).ok);

// A second tip drawing a taken PIN must fail whole: a tip with no PIN pointing
// at it would hand its tipster a PIN that silently belongs to someone else.
const idB = "-OaAtomic0000000002";
check("a colliding PIN rejects the entire update", (await fileTip(idB, pinA)).status === 401);
check("...and the PIN still belongs to the first tip",
  (await read(`tipPins/${pinA}`)).json?.tipId === idA);

// The route then retries with a fresh PIN. Its success is also what proves the
// rejected update left no orphan: /messages/$id is create-only for anonymous
// writers, so this would be denied if idB had survived the failed write.
// (Reading it back is not an option — /messages is admin-only, and an
// anonymous read is denied whether or not the tip is there.)
const pinB = "S5VK8Y";
check("the retry succeeds, proving no orphaned tip was left behind", (await fileTip(idB, pinB)).ok);
check("the two tips hold distinct PINs",
  (await read(`tipPins/${pinB}`)).json?.tipId === idB);

// --- staff ---------------------------------------------------------------------------
check("an admin files a call-in tip and its PIN together, as the intake does for staff",
  (await fileTip("-OaCallTip000000001", "T6WK7Z", ADMIN, { source: "call", category: "homicide" })).ok);
// Deleting a tip in the inbox removes the tip, then its PIN entry.
check("an admin can delete a tip", (await del(`messages/${idA}`, ADMIN)).ok);
check("...and then its PIN entry", (await del(`tipPins/${pinA}`, ADMIN)).ok);
check("the deleted tip's PIN no longer resolves", (await read(`tipPins/${pinA}`)).json === null);
check("anonymous cannot delete a PIN entry", (await del(`tipPins/${pinB}`)).status === 401);
check("...and it is still there", (await read(`tipPins/${pinB}`)).json?.tipId === idB);

// --- follow-ups: a later message threaded onto an existing tip ---------------
// They hang off the tip itself, so deleting the tip takes them with it and the
// admin inbox gets the whole conversation in the read it already does.
check("anonymous can append a follow-up to an existing tip",
  (await put(`messages/${tipId}/followUps/fu1`, { ...cipher, created_at: Date.now() })).ok);
check("a follow-up cannot be overwritten once written",
  (await put(`messages/${tipId}/followUps/fu1`, { ...cipher, created_at: Date.now() })).status === 401);
check("appending a follow-up does not let the original tip be rewritten",
  (await put(`messages/${tipId}`, { ...cipher, created_at: now, pin })).status === 401);
check("follow-ups cannot be read anonymously",
  (await read(`messages/${tipId}/followUps`)).status === 401);
check("a follow-up without a message is rejected",
  (await put(`messages/${tipId}/followUps/fu2`, { created_at: Date.now() })).status === 401);
check("an unexpected field on a follow-up is rejected",
  (await put(`messages/${tipId}/followUps/fu3`, { ...cipher, created_at: Date.now(), pin: "K7M2QX" })).status === 401);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall tip-PIN rules checks passed");
process.exit(failures ? 1 : 0);
