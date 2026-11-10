/**
 * Database-rules tests for the tip category and source (npm run test:rules).
 *
 * Every tip may carry a type-of-crime category (stored in the clear for
 * counting), an encrypted description when the category is "other", and a
 * source saying how it reached us: text (the app), web (the website form) or
 * call (phoned in, typed up by staff). These prove the public intake can file
 * text and web tips with a category, that only an admin can file a call, that
 * tips from older app versions with neither field are still accepted, and that
 * a police copy may carry the same labels.
 */

const BASE = process.env.RTDB_EMULATOR ?? "http://127.0.0.1:9000";
const NS = process.env.RTDB_NAMESPACE ?? "demo-ccb-default-rtdb";

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const tokenFor = (uid) =>
  `${b64({ alg: "none", typ: "JWT" })}.${b64({ uid, sub: uid, user_id: uid, iat: 1, exp: 9999999999 })}.`;
const call = async (method, path, who, body) => {
  const init = { method };
  if (body !== undefined) init.body = JSON.stringify(body);
  let url = `${BASE}/${path}.json?ns=${NS}`;
  if (who === "owner") init.headers = { Authorization: "Bearer owner" };
  else if (who !== "anon") url += `&auth=${tokenFor(who)}`;
  const res = await fetch(url, init);
  return res.status;
};
const read = (p, who) => call("GET", p, who);
const put = (p, who, b) => call("PUT", p, who, b);
const patch = (p, who, b) => call("PATCH", p, who, b);
const value = (p) =>
  fetch(`${BASE}/${p}.json?ns=${NS}`, { headers: { Authorization: "Bearer owner" } }).then((r) => r.json());

let failures = 0;
const expect = async (name, promise, status) => {
  const got = await promise;
  const ok = got === status;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}   (got ${got}, want ${status})`);
  if (!ok) failures += 1;
};
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};

const ADMIN = "admin1", OFFICER = "cop1", RANDO = "rando1";
const now = Date.now();
const cipher = { message: "U2FsdGVkX1+notarealtip", encrypted: true, created_at: now };
const otherText = "U2FsdGVkX1+describedcrime";

await put(`admins/${ADMIN}`, "owner", true);
await put(`police/${OFFICER}`, "owner", true);

// --- what the public intake writes -------------------------------------------
// The route stores the tip and its PIN index in one multi-path update.
await expect("app tip with a category and source text, tip + PIN in one update",
  patch("", "anon", { "messages/c1": { ...cipher, pin: "C2C2C2", category: "auto_theft", source: "text" }, "tipPins/C2C2C2": { tipId: "c1", created_at: now } }), 200);
await expect("web tip with a category and source web",
  put("messages/c2", "anon", { ...cipher, pin: "C3C3C3", category: "homicide", source: "web" }), 200);
await expect("tip filed under Other with its encrypted description",
  put("messages/c3", "anon", { ...cipher, pin: "C4C4C4", category: "other", category_other: otherText, source: "web" }), 200);
await expect("tip from an older app version: no category, no source — still accepted",
  put("messages/c4", "anon", { ...cipher, pin: "C5C5C5" }), 200);
await expect("tip with a source but no category (category list out of step) — still accepted",
  put("messages/c5", "anon", { ...cipher, pin: "C6C6C6", source: "text" }), 200);
const storedC1 = await value("messages/c1");
check("category and source are stored in the clear beside the ciphertext",
  storedC1?.category === "auto_theft" && storedC1?.source === "text" && storedC1?.encrypted === true);

// --- a call is something only staff can file ----------------------------------
await expect("anonymous cannot file a tip marked as a call",
  put("messages/c6", "anon", { ...cipher, category: "homicide", source: "call" }), 401);
await expect("an officer cannot file a call tip",
  put("messages/c7", OFFICER, { ...cipher, category: "homicide", source: "call" }), 401);
await expect("an unapproved signed-in account cannot file a call tip",
  put("messages/c8", RANDO, { ...cipher, category: "homicide", source: "call" }), 401);
await expect("an admin files a call tip, with its PIN, the way the intake route does for staff",
  patch("", ADMIN, { "messages/c9": { ...cipher, pin: "C7C7C7", category: "illegal_guns", source: "call" }, "tipPins/C7C7C7": { tipId: "c9", created_at: now } }), 200);
await expect("an admin may also file text and web tips", put("messages/c10", ADMIN, { ...cipher, source: "web" }), 200);

// --- shape ---------------------------------------------------------------------
await expect("an unknown source is refused", put("messages/s1", "anon", { ...cipher, source: "email" }), 401);
await expect("a source must be a string", put("messages/s2", "anon", { ...cipher, source: 1 }), 401);
await expect("a source cannot be an object", put("messages/s3", "anon", { ...cipher, source: { v: "text" } }), 401);
await expect("a category must be a lowercase id", put("messages/s4", "anon", { ...cipher, category: "Auto Theft" }), 401);
await expect("a category cannot carry markup or punctuation", put("messages/s5", "anon", { ...cipher, category: "<b>x</b>" }), 401);
await expect("a category cannot be empty", put("messages/s6", "anon", { ...cipher, category: "" }), 401);
await expect("a category over 40 characters is refused", put("messages/s7", "anon", { ...cipher, category: "a".repeat(41) }), 401);
await expect("a category must be a string", put("messages/s8", "anon", { ...cipher, category: 7 }), 401);
await expect("an id not on today's list is still storable (the list can change)", put("messages/s9", "anon", { ...cipher, category: "arson" }), 200);
await expect("an empty Other description is refused", put("messages/s10", "anon", { ...cipher, category: "other", category_other: "" }), 401);
await expect("an Other description over 1000 characters is refused", put("messages/s11", "anon", { ...cipher, category: "other", category_other: "x".repeat(1001) }), 401);
await expect("an Other description must be a string", put("messages/s12", "anon", { ...cipher, category: "other", category_other: { a: 1 } }), 401);

// --- once filed, the public cannot relabel a tip --------------------------------
await expect("anonymous cannot change a tip's category", put("messages/c2/category", "anon", "auto_theft"), 401);
await expect("anonymous cannot change a tip's source", put("messages/c2/source", "anon", "text"), 401);
await expect("anonymous cannot add a category to a tip that has none", put("messages/c4/category", "anon", "homicide"), 401);
await expect("an officer cannot relabel a tip", put("messages/c2/category", OFFICER, "auto_theft"), 401);
await expect("an admin can correct a tip's category", put("messages/c2/category", ADMIN, "illegal_drugs"), 200);
await expect("...but not to something malformed", put("messages/c2/category", ADMIN, "Illegal Drugs"), 401);

// --- follow-ups stay bare: they join a tip and keep its labels ------------------
await expect("a follow-up is still accepted as before",
  put("messages/c1/followUps/f1", "anon", { ...cipher, created_at: Date.now() }), 200);
await expect("a follow-up cannot carry a category", put("messages/c1/followUps/f2", "anon", { ...cipher, created_at: Date.now(), category: "homicide" }), 401);
await expect("a follow-up cannot carry a source", put("messages/c1/followUps/f3", "anon", { ...cipher, created_at: Date.now(), source: "web" }), 401);
// A caller is given the PIN and may write again from the app or the website,
// signed in as nobody: the admin-only "call" mark on the tip must not get in the way.
await expect("anyone holding the PIN can follow up on a call tip", put("messages/c9/followUps/f1", "anon", { ...cipher, created_at: Date.now() }), 200);
await expect("...and the tip is still a call afterwards", value("messages/c9/source").then((v) => (v === "call" ? 200 : 500)), 200);

// --- a full-length tip fits ---------------------------------------------------------
// 10,000 characters of tip become up to about 40,000 characters of ciphertext.
const long = (n) => "U".repeat(n);
await expect("a tip with the longest ciphertext the intake can produce is accepted",
  put("messages/L1", "anon", { ...cipher, message: long(41000), pin: "M2M2M2", category: "homicide", source: "web" }), 200);
await expect("anything longer is refused", put("messages/L2", "anon", { ...cipher, message: long(41001) }), 401);
await expect("a follow-up of that length is accepted",
  put("messages/L1/followUps/f1", "anon", { ...cipher, message: long(41000), created_at: Date.now() }), 200);
await expect("a longer follow-up is refused",
  put("messages/L1/followUps/f2", "anon", { ...cipher, message: long(41001), created_at: Date.now() }), 401);
await expect("the longest tip can be forwarded to police with its longest follow-up",
  put("policeTips/L1", ADMIN, { ...cipher, message: long(41000), pin: "M2M2M2", category: "homicide", source: "web", forwarded_at: now, forwarded_by: ADMIN,
    followUps: { f1: { ...cipher, message: long(41000), created_at: now } } }), 200);

// --- who can see the labels -------------------------------------------------------
await expect("anonymous cannot read a tip's category", read("messages/c1/category", "anon"), 401);
await expect("an officer cannot read a tip's category from the inbox", read("messages/c1/category", OFFICER), 401);
await expect("an admin can", read("messages/c1/category", ADMIN), 200);

// --- the police copy may carry the labels ----------------------------------------
const forward = (extra = {}) => ({ ...cipher, pin: "C2C2C2", forwarded_at: now + 10, forwarded_by: ADMIN, ...extra });
await expect("admin forwards a tip with its category and source",
  put("policeTips/c1", ADMIN, forward({ category: "auto_theft", source: "text" })), 200);
await expect("admin forwards an Other tip with its encrypted description",
  put("policeTips/c3", ADMIN, forward({ pin: "C4C4C4", category: "other", category_other: otherText, source: "web" })), 200);
await expect("a forward without labels (older tips) still works", put("policeTips/c4", ADMIN, forward({ pin: "C5C5C5" })), 200);
await expect("officers can read the category on a forwarded tip", read("policeTips/c1/category", OFFICER), 200);
await expect("a police copy refuses a malformed category", put("policeTips/p1", ADMIN, forward({ category: "Auto Theft" })), 401);
await expect("a police copy refuses an unknown source", put("policeTips/p2", ADMIN, forward({ source: "email" })), 401);
await expect("a police copy refuses an empty Other description", put("policeTips/p3", ADMIN, forward({ category: "other", category_other: "" })), 401);
await expect("a police copy still refuses unexpected fields", put("policeTips/p4", ADMIN, forward({ category: "homicide", tipster: "x" })), 401);
await expect("an officer still cannot write a police copy", put("policeTips/p5", OFFICER, { ...forward({ category: "homicide" }), forwarded_by: OFFICER }), 401);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall tip-category rules checks passed");
process.exit(failures ? 1 : 0);
