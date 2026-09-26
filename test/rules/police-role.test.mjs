/**
 * Database-rules tests for the police role, run against the Realtime Database
 * emulator (npm run test:rules).
 *
 * Signs requests as specific users with unsigned tokens, which the emulator
 * accepts, so each case runs as a real admin, officer, unapproved account or
 * anonymous visitor would.
 */

const BASE = process.env.RTDB_EMULATOR ?? "http://127.0.0.1:9000";
const NS = process.env.RTDB_NAMESPACE ?? "demo-ccb-default-rtdb";

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const tokenFor = (uid) =>
  `${b64({ alg: "none", typ: "JWT" })}.${b64({ uid, sub: uid, user_id: uid, iat: 1, exp: 9999999999 })}.`;

// who: a uid, "anon" for no token, or "owner" to set up fixtures past the rules
const url = (path, who) => {
  const auth = who === "anon" ? "" : `&auth=${who === "owner" ? "owner" : tokenFor(who)}`;
  return `${BASE}/${path}.json?ns=${NS}${auth}`;
};
const call = async (method, path, who, body) => {
  const init = { method };
  if (body !== undefined) init.body = JSON.stringify(body);
  if (who === "owner") init.headers = { Authorization: "Bearer owner" };
  const res = await fetch(who === "owner" ? `${BASE}/${path}.json?ns=${NS}` : url(path, who), init);
  return res.status;
};
const read = (path, who) => call("GET", path, who);
const put = (path, who, body) => call("PUT", path, who, body);
const del = (path, who) => call("DELETE", path, who);

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};
const expect = async (name, promise, status) => {
  const got = await promise;
  check(name, got === status, `got ${got}, want ${status}`);
};

const ADMIN = "admin1", OFFICER = "cop1", RANDO = "rando1";

// --- fixtures (written as the database owner, bypassing rules) --------------
await put(`admins/${ADMIN}`, "owner", true);
await put("wanteds/w1", "owner", { name: "Test Wanted" });
await put("missings/m1", "owner", { name: "Test Missing" });
await put("messages/t1", "owner", { message: "cipher", encrypted: true, created_at: 1 });
await put("members/mem1", "owner", { name: "A Member", email: "a@b.c", created_at: 1 });

// --- admins manage the police list ------------------------------------------
await expect("admin can grant police access", put(`police/${OFFICER}`, ADMIN, true), 200);
await expect("admin can list the police team", read("police", ADMIN), 200);
await expect("a role must be the boolean true, not false", put("police/x1", ADMIN, false), 401);
await expect("a role must be the boolean true, not a string", put("police/x2", ADMIN, "yes"), 401);
await expect("admin can grant then revoke", put("police/tmp", ADMIN, true), 200);
await expect("...and revoke", del("police/tmp", ADMIN), 200);

// --- an officer sees only what the portal needs -----------------------------
await expect("officer can read their own role", read(`police/${OFFICER}`, OFFICER), 200);
await expect("officer cannot list the police team", read("police", OFFICER), 401);
await expect("officer cannot read another officer's role", read(`police/${ADMIN}`, OFFICER), 401);
await expect("officer can read wanted persons", read("wanteds", OFFICER), 200);
await expect("officer can read missing persons", read("missings", OFFICER), 200);
await expect("officer cannot read the tip inbox", read("messages", OFFICER), 401);
await expect("officer cannot read a single tip", read("messages/t1", OFFICER), 401);
await expect("officer cannot read members", read("members", OFFICER), 401);
await expect("officer cannot read user profiles", read("users", OFFICER), 401);
await expect("officer cannot list device tokens", read("notifications_register", OFFICER), 401);
await expect("officer cannot read notifications", read("notifications", OFFICER), 401);
await expect("officer cannot enumerate tip PINs", read("tipPins", OFFICER), 401);

// --- an officer cannot change anything or escalate ---------------------------
await expect("officer cannot edit a wanted person", put("wanteds/w1", OFFICER, { name: "x" }), 401);
await expect("officer cannot add a missing person", put("missings/m2", OFFICER, { name: "x" }), 401);
await expect("officer cannot delete a wanted person", del("wanteds/w1", OFFICER), 401);
await expect("officer cannot make themselves admin", put(`admins/${OFFICER}`, OFFICER, true), 401);
await expect("officer cannot grant police access to others", put(`police/${RANDO}`, OFFICER, true), 401);
await expect("officer cannot remove their own role", del(`police/${OFFICER}`, OFFICER), 401);
await expect("officer cannot overwrite a tip", put("messages/t1", OFFICER, { message: "x", created_at: 2 }), 401);

// --- an account with no role gets nothing ------------------------------------
await expect("unapproved account can check its own (empty) role", read(`police/${RANDO}`, RANDO), 200);
await expect("unapproved account cannot give itself police access", put(`police/${RANDO}`, RANDO, true), 401);
await expect("unapproved account cannot give itself admin", put(`admins/${RANDO}`, RANDO, true), 401);
await expect("unapproved account cannot read the tip inbox", read("messages", RANDO), 401);

// --- anonymous visitors ------------------------------------------------------
await expect("anonymous cannot list the police team", read("police", "anon"), 401);
await expect("anonymous cannot read an officer's role", read(`police/${OFFICER}`, "anon"), 401);
await expect("anonymous cannot grant police access", put("police/anon1", "anon", true), 401);
await expect("wanted persons stay public", read("wanteds", "anon"), 200);

// --- the Team page's account creation: the new user writes their own profile -
const NEWCOP = "newcop1";
const profile = { firstName: "New", lastName: "Officer", email: "new@police.test", created_at: 1, createdBy: ADMIN };
await expect("a new officer's session can write their own profile", put(`users/${NEWCOP}`, NEWCOP, profile), 200);
await expect("...but only once", put(`users/${NEWCOP}`, NEWCOP, { ...profile, firstName: "Changed" }), 401);
await expect("nobody else can write it", put("users/newcop2", OFFICER, { ...profile, email: "x@y.z" }), 401);
await expect("admin can read profiles to list the team", read("users", ADMIN), 200);

// --- revoking takes effect on the very next request --------------------------
await expect("admin revokes the officer", del(`police/${OFFICER}`, ADMIN), 200);
await expect("the revoked officer's role now reads empty", read(`police/${OFFICER}`, OFFICER), 200);
const after = await fetch(url(`police/${OFFICER}`, OFFICER)).then((r) => r.json());
check("...and it is null, so the site shows 'awaiting approval'", after === null, `got ${JSON.stringify(after)}`);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall police-role rules checks passed");
process.exit(failures ? 1 : 0);
