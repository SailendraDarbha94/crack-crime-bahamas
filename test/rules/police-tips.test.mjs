/**
 * Database-rules tests for forwarding tips to police (npm run test:rules).
 *
 * /policeTips is the admin-curated copy officers read. These prove that only
 * admins write it, that officers can read it and nothing else, that a forward
 * is attributable, and that the shape is locked down.
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
const del = (p, who) => call("DELETE", p, who);

let failures = 0;
const expect = async (name, promise, status) => {
  const got = await promise;
  const ok = got === status;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}   (got ${got}, want ${status})`);
  if (!ok) failures += 1;
};

const ADMIN = "admin1", ADMIN2 = "admin2", OFFICER = "cop1", RANDO = "rando1";
const now = 1_700_000_000_000;
const cipher = { message: "U2FsdGVkX1+notarealtip", encrypted: true, created_at: now };

// --- fixtures ----------------------------------------------------------------
await put(`admins/${ADMIN}`, "owner", true);
await put(`admins/${ADMIN2}`, "owner", true);
await put(`police/${OFFICER}`, "owner", true);
await put("messages/t1", "owner", { ...cipher, pin: "K7M2QX", followUps: { f1: { ...cipher, created_at: now + 1 } } });

const forward = (by, extra = {}) => ({ ...cipher, pin: "K7M2QX", forwarded_at: now + 10, forwarded_by: by, ...extra });

// --- forwarding is an admin action ------------------------------------------
await expect("admin can forward a tip", put("policeTips/t1", ADMIN, forward(ADMIN)), 200);
await expect("admin can forward with an encrypted note and existing follow-ups",
  put("policeTips/t2", ADMIN, forward(ADMIN, { note: "U2FsdGVkX1+note", followUps: { f1: { ...cipher, created_at: now + 1 } } })), 200);
await expect("a forward must name its writer as forwarded_by",
  put("policeTips/t3", ADMIN, forward(ADMIN2)), 401);
await expect("officer cannot forward a tip", put("policeTips/t4", OFFICER, forward(OFFICER)), 401);
await expect("unapproved account cannot forward", put("policeTips/t5", RANDO, forward(RANDO)), 401);
await expect("anonymous cannot forward", put("policeTips/t6", "anon", forward("x")), 401);

// --- what officers can and cannot see ---------------------------------------
await expect("officer can list forwarded tips", read("policeTips", OFFICER), 200);
await expect("officer can read one forwarded tip", read("policeTips/t1", OFFICER), 200);
await expect("admin can read the forwarded list too", read("policeTips", ADMIN), 200);
await expect("unapproved account cannot read forwarded tips", read("policeTips", RANDO), 401);
await expect("anonymous cannot read forwarded tips", read("policeTips", "anon"), 401);
await expect("officer still cannot read the inbox", read("messages", OFFICER), 401);
await expect("officer still cannot read the original tip", read("messages/t1", OFFICER), 401);
await expect("officer cannot read the original tip's follow-ups", read("messages/t1/followUps", OFFICER), 401);

// --- officers cannot change a forwarded tip ---------------------------------
await expect("officer cannot edit a forwarded tip", patch("policeTips/t1", OFFICER, { note: "x" }), 401);
await expect("officer cannot add a follow-up to a forwarded tip",
  put("policeTips/t1/followUps/f9", OFFICER, { ...cipher, created_at: now + 2 }), 401);
await expect("officer cannot withdraw a forwarded tip", del("policeTips/t1", OFFICER), 401);

// --- sharing later follow-ups, by any admin ---------------------------------
await expect("admin can share a later follow-up", put("policeTips/t1/followUps/f2", ADMIN, { ...cipher, created_at: now + 2 }), 200);
await expect("a different admin can share a follow-up on a tip they did not forward",
  put("policeTips/t1/followUps/f3", ADMIN2, { ...cipher, created_at: now + 3 }), 200);
await expect("a shared follow-up must carry message and created_at",
  put("policeTips/t1/followUps/f4", ADMIN, { created_at: now + 4 }), 401);
await expect("a shared follow-up cannot smuggle extra fields",
  put("policeTips/t1/followUps/f5", ADMIN, { ...cipher, created_at: now + 5, pin: "K7M2QX" }), 401);

// --- a copy cannot be changed once made: withdraw and forward again instead --
await expect("admin cannot overwrite an existing police copy", put("policeTips/t2", ADMIN, forward(ADMIN, { note: "U2FsdGVkX1+other" })), 401);
await expect("a second admin cannot overwrite it either", put("policeTips/t2", ADMIN2, forward(ADMIN2)), 401);
await expect("admin cannot edit a forwarded copy's note in place", patch("policeTips/t2", ADMIN, { note: "U2FsdGVkX1+edited" }), 401);
await expect("a follow-up can be shared only once (no overwrite)", put("policeTips/t1/followUps/f2", ADMIN, { ...cipher, created_at: now + 99 }), 401);
await expect("a shared follow-up cannot be removed one by one (withdraw the tip instead)", del("policeTips/t1/followUps/f2", ADMIN), 401);

// --- shape is locked down ----------------------------------------------------
await expect("forward without forwarded_at is rejected", put("policeTips/t7", ADMIN, { ...cipher, pin: "K7M2QX", forwarded_by: ADMIN }), 401);
await expect("forward without created_at is rejected", put("policeTips/t8", ADMIN, { message: "x", pin: "K7M2QX", forwarded_at: now, forwarded_by: ADMIN }), 401);
await expect("forward with a malformed PIN is rejected", put("policeTips/t9", ADMIN, forward(ADMIN, { pin: "ABCDE0" })), 401);
await expect("forward without a PIN is allowed (tips from before PINs)",
  put("policeTips/t10", ADMIN, { ...cipher, forwarded_at: now, forwarded_by: ADMIN }), 200);
await expect("forward with an unexpected field is rejected", put("policeTips/t11", ADMIN, forward(ADMIN, { tipster: "name" })), 401);
await expect("a note over 12000 characters is rejected", put("policeTips/t12", ADMIN, forward(ADMIN, { note: "x".repeat(12001) })), 401);

// --- withdrawing -------------------------------------------------------------
await expect("admin can withdraw a forwarded tip", del("policeTips/t1", ADMIN), 200);
await expect("admin can forward the same tip again after withdrawing it", put("policeTips/t1", ADMIN, forward(ADMIN)), 200);
await expect("...and withdraw it again", del("policeTips/t1", ADMIN), 200);
await expect("removing a copy that does not exist is a permitted no-op (delete-tip cleanup)", del("policeTips/never-forwarded", ADMIN), 200);
const after = await fetch(`${BASE}/policeTips/t1.json?ns=${NS}&auth=${tokenFor(OFFICER)}`).then((r) => r.json());
const gone = after === null;
console.log(`${gone ? "PASS" : "FAIL"}  once withdrawn, the officer's read of it is empty   (got ${JSON.stringify(after)})`);
if (!gone) failures += 1;
await expect("withdrawing does not touch the original tip (owner still sees it)", read("messages/t1", "owner"), 200);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall police-tips rules checks passed");
process.exit(failures ? 1 : 0);
