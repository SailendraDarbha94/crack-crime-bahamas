/**
 * Database-rules tests for the archive (npm run test:rules).
 *
 * Tips are archived in place under /messages/$tipId/archive (+ archiveLog);
 * wanted and missing persons move to the admin-only /archive node. These
 * prove that only admins archive, that the public intake can neither set nor
 * see archive state yet can still append a follow-up (which is what reopens
 * a tip), that officers see none of it, and that remarks can never land on
 * a public node.
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
const value = (p, who) =>
  fetch(`${BASE}/${p}.json?ns=${NS}${who === "owner" ? "" : `&auth=${tokenFor(who)}`}`, {
    headers: who === "owner" ? { Authorization: "Bearer owner" } : {},
  }).then((r) => r.json());

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

const ADMIN = "admin1", ADMIN2 = "admin2", OFFICER = "cop1", RANDO = "rando1";
const now = 1_700_000_000_000;
const cipher = { message: "U2FsdGVkX1+notarealtip", encrypted: true, created_at: now };
const mark = (by, extra = {}) => ({ at: now + 100, by, remarks: "U2FsdGVkX1+remarks", ...extra });
const logEntry = (by, action = "archived", extra = {}) => ({ action, at: now + 100, by, remarks: "U2FsdGVkX1+remarks", ...extra });
const person = (name) => ({
  name, age: "30", gender: "M", alias: "", image: "Image Not Available", wanted_for: "theft",
  last_known_address: "", description: "", created_at: now, country_code: "BAH", current_status: "",
});

// --- fixtures ----------------------------------------------------------------
await put(`admins/${ADMIN}`, "owner", true);
await put(`admins/${ADMIN2}`, "owner", true);
await put(`police/${OFFICER}`, "owner", true);
await put("messages/t1", "owner", { ...cipher, pin: "K7M2QX", followUps: { f1: { ...cipher, created_at: now + 1 } } });
await put("messages/t2", "owner", { ...cipher, pin: "M3N4PQ" });
await put("tipPins/K7M2QX", "owner", { tipId: "t1", created_at: now });
await put("wanteds/w1", "owner", person("W One"));
await put("wanteds/w2", "owner", person("W Two"));
await put("missings/m1", "owner", { ...person("M One"), wanted_for: null });

// =============================================================================
// Tips: archived in place
// =============================================================================
await expect("admin archives a tip: mark and history entry in one update",
  patch("messages/t1", ADMIN, { archive: mark(ADMIN), "archiveLog/a1": logEntry(ADMIN) }), 200);
await expect("the archived tip still exists for admins (archived in place, never moved)", read("messages/t1", ADMIN), 200);
await expect("its PIN still resolves (the tipster can keep writing)", read("tipPins/K7M2QX", "anon"), 200);
await expect("the public intake can still append a follow-up to an archived tip — this is what reopens it",
  put("messages/t1/followUps/f2", "anon", { ...cipher, created_at: Date.now() }), 200);
// "Reopened" is decided by comparing follow-up times with the archive mark, so
// a follow-up's stamp must be the real time: within five minutes of the
// database clock. A PIN holder writing directly can then neither hold a tip
// open forever nor bury a message behind the archive.
await expect("a follow-up stamped in the far future is refused",
  put("messages/t1/followUps/f3", "anon", { ...cipher, created_at: 9e15 }), 401);
await expect("a follow-up back-dated behind the archive is refused",
  put("messages/t1/followUps/f4", "anon", { ...cipher, created_at: now }), 401);
await expect("a follow-up stamped an hour ago is refused too",
  put("messages/t1/followUps/f5", "anon", { ...cipher, created_at: Date.now() - 3_600_000 }), 401);
await expect("a follow-up stamped by the database itself is accepted",
  put("messages/t1/followUps/f6", "anon", { ...cipher, created_at: { ".sv": "timestamp" } }), 200);
await expect("a follow-up a minute off the clock (ordinary skew) is accepted",
  put("messages/t1/followUps/f7", "anon", { ...cipher, created_at: Date.now() + 60_000 }), 200);

// --- who may archive ---------------------------------------------------------
await expect("officer cannot archive a tip", put("messages/t2/archive", OFFICER, mark(OFFICER)), 401);
await expect("unapproved account cannot archive a tip", put("messages/t2/archive", RANDO, mark(RANDO)), 401);
await expect("anonymous cannot archive an existing tip", put("messages/t2/archive", "anon", mark("x")), 401);
await expect("anonymous cannot create a tip that is already archived (hiding it from the inbox)",
  put("messages/t3", "anon", { ...cipher, archive: mark("x") }), 401);
await expect("anonymous cannot create a tip with archive history either",
  put("messages/t4", "anon", { ...cipher, archiveLog: { x: logEntry("x") } }), 401);
await expect("anonymous cannot plant a bare value where the history goes",
  put("messages/t4", "anon", { ...cipher, archiveLog: "junk" }), 401);
await expect("...but an ordinary new tip still goes through", put("messages/t5", "anon", { ...cipher, pin: "R5S6TU" }), 200);
await expect("officer still cannot read the inbox, archived or not", read("messages", OFFICER), 401);
await expect("officer cannot read a tip's archive remarks", read("messages/t1/archive", OFFICER), 401);

// --- shape of the mark -------------------------------------------------------
await expect("the mark must name the admin writing it", put("messages/t2/archive", ADMIN, mark(ADMIN2)), 401);
await expect("the mark needs remarks", put("messages/t2/archive", ADMIN, { at: now, by: ADMIN }), 401);
await expect("empty remarks are refused", put("messages/t2/archive", ADMIN, mark(ADMIN, { remarks: "" })), 401);
await expect("over-long remarks are refused", put("messages/t2/archive", ADMIN, mark(ADMIN, { remarks: "x".repeat(12001) })), 401);
await expect("the mark needs a numeric timestamp", put("messages/t2/archive", ADMIN, mark(ADMIN, { at: "yesterday" })), 401);
await expect("the mark cannot carry extra fields", put("messages/t2/archive", ADMIN, mark(ADMIN, { reward: 500 })), 401);
await expect("a well-formed mark by a second admin is fine", put("messages/t2/archive", ADMIN2, mark(ADMIN2)), 200);
// The whole mark is attributed to whoever wrote it: nobody can change another
// admin's remarks or time while leaving their name on it.
await expect("a different admin cannot edit part of that mark (remarks) and leave the attribution",
  patch("messages/t2/archive", ADMIN, { remarks: "U2FsdGVkX1+tampered" }), 401);
await expect("a different admin cannot edit part of that mark (time) either",
  patch("messages/t2/archive", ADMIN, { at: now + 999 }), 401);
await expect("the admin who wrote the mark may still correct their own remarks",
  patch("messages/t2/archive", ADMIN2, { remarks: "U2FsdGVkX1+corrected" }), 200);
// The clients stamp `at` with the database server's clock, which arrives as
// a placeholder the server resolves before validation — it must still count
// as a number, and must come back as one.
await expect("a server-timestamp mark passes the numeric check",
  patch("messages/t2", ADMIN2, { archive: mark(ADMIN2, { at: { ".sv": "timestamp" } }), "archiveLog/sv1": logEntry(ADMIN2, "archived", { at: { ".sv": "timestamp" } }) }), 200);
const svAt = await value("messages/t2/archive/at", "owner");
check("...and is stored as a real millisecond timestamp", typeof svAt === "number" && Math.abs(svAt - Date.now()) < 60_000, String(svAt));

// --- shape of the history ----------------------------------------------------
await expect("a history entry must name its writer", put("messages/t2/archiveLog/b1", ADMIN, logEntry(ADMIN2)), 401);
await expect("a history entry needs a known action", put("messages/t2/archiveLog/b1", ADMIN, logEntry(ADMIN, "deleted")), 401);
await expect("a history entry cannot carry extra fields", put("messages/t2/archiveLog/b1", ADMIN, logEntry(ADMIN, "archived", { who: "me" })), 401);
await expect("a history entry may omit remarks (a restore)", put("messages/t2/archiveLog/b1", ADMIN, { action: "restored", at: now + 300, by: ADMIN }), 200);
await expect("history is append-only: an entry cannot be rewritten", put("messages/t2/archiveLog/b1", ADMIN, logEntry(ADMIN)), 401);
await expect("history can be added to by a different admin", put("messages/t2/archiveLog/b2", ADMIN2, logEntry(ADMIN2)), 200);
await expect("officer cannot write history", put("messages/t2/archiveLog/b3", OFFICER, logEntry(OFFICER)), 401);

// --- restoring ---------------------------------------------------------------
await expect("admin restores a tip: mark removed and history appended in one update",
  patch("messages/t1", ADMIN2, { archive: null, "archiveLog/a2": { action: "restored", at: now + 400, by: ADMIN2 } }), 200);
const restoredMark = await value("messages/t1/archive", "owner");
check("after restore the mark is gone", restoredMark === null, JSON.stringify(restoredMark));
const history = await value("messages/t1/archiveLog", "owner");
check("...and both events remain in the history", history && history.a1?.action === "archived" && history.a2?.action === "restored");
await expect("a restored tip can be archived again (after a reopen, say)", put("messages/t1/archive", ADMIN, mark(ADMIN, { at: now + 500 })), 200);
await expect("the tip's own fields are untouched by all this", read("messages/t1/message", ADMIN), 200);

// --- deleting an archived tip works as before -------------------------------
await expect("admin can delete an archived tip outright", del("messages/t2", ADMIN), 200);

// =============================================================================
// People: moved to the admin-only /archive node
// =============================================================================
const archivedW1 = { ...person("W One"), archived: mark(ADMIN) };
await expect("admin moves a wanted person into the archive atomically (write copy, remove original)",
  patch("", ADMIN, { "archive/wanteds/w1": archivedW1, "wanteds/w1": null }), 200);
const publicW1 = await value("wanteds/w1", "owner");
check("the person is gone from the public node (so from the site, the police portal and the app)", publicW1 === null);
await expect("...and readable in the archive by admins", read("archive/wanteds/w1", ADMIN), 200);
await expect("the public list still reads for everyone", read("wanteds", "anon"), 200);
await expect("other listed people are untouched", read("wanteds/w2", "anon"), 200);

// --- who may see or touch the archive ---------------------------------------
await expect("anonymous cannot read the archive", read("archive", "anon"), 401);
await expect("anonymous cannot read one archived person", read("archive/wanteds/w1", "anon"), 401);
await expect("officer cannot read the archive", read("archive", OFFICER), 401);
await expect("officer cannot read one archived person", read("archive/wanteds/w1", OFFICER), 401);
await expect("unapproved account cannot read the archive", read("archive", RANDO), 401);
await expect("officer cannot archive a person", patch("", OFFICER, { "archive/wanteds/w2": { ...person("W Two"), archived: mark(OFFICER) }, "wanteds/w2": null }), 401);
await expect("officer cannot restore a person", patch("", OFFICER, { "wanteds/w1": person("W One"), "archive/wanteds/w1": null }), 401);
await expect("anonymous cannot write to the archive", put("archive/wanteds/w9", "anon", archivedW1), 401);
await expect("nothing else can be written under /archive", put("archive/notes/x", ADMIN, { a: 1 }), 401);

// --- shape ---------------------------------------------------------------------
await expect("an archived person needs the archived mark", put("archive/wanteds/w2", ADMIN, person("W Two")), 401);
await expect("the mark must name the admin writing it", put("archive/wanteds/w2", ADMIN, { ...person("W Two"), archived: mark(ADMIN2) }), 401);
await expect("the mark needs remarks", put("archive/wanteds/w2", ADMIN, { ...person("W Two"), archived: { at: now, by: ADMIN } }), 401);
await expect("empty remarks are refused", put("archive/wanteds/w2", ADMIN, { ...person("W Two"), archived: mark(ADMIN, { remarks: "" }) }), 401);
await expect("the mark cannot carry extra fields", put("archive/wanteds/w2", ADMIN, { ...person("W Two"), archived: mark(ADMIN, { by_name: "x" }) }), 401);
await expect("an archived record needs a name", put("archive/wanteds/w2", ADMIN, { archived: mark(ADMIN) }), 401);
// An archived person is create-or-delete only, like a police copy: two admins
// archiving from stale pages cannot silently replace each other's remarks.
await expect("an archived person cannot be overwritten by another admin", put("archive/wanteds/w1", ADMIN2, { ...person("W One"), archived: mark(ADMIN2) }), 401);
await expect("...nor by the same admin", put("archive/wanteds/w1", ADMIN, { ...person("W One"), archived: mark(ADMIN, { remarks: "U2FsdGVkX1+other" }) }), 401);
await expect("...nor edited in part", patch("archive/wanteds/w1/archived", ADMIN, { remarks: "U2FsdGVkX1+other" }), 401);
await expect("...nor edited in part by another admin", patch("archive/wanteds/w1", ADMIN2, { name: "Renamed" }), 401);

// --- remarks can never reach a public node -----------------------------------
await expect("admin cannot write archive remarks onto the public wanted node", patch("wanteds/w2", ADMIN, { archived: mark(ADMIN) }), 401);
await expect("admin cannot write archive history onto the public wanted node", patch("wanteds/w2", ADMIN, { archiveLog: { x: logEntry(ADMIN) } }), 401);
await expect("admin cannot write archive remarks onto the public missing node", patch("missings/m1", ADMIN, { archived: mark(ADMIN) }), 401);
await expect("a restore that would carry the mark back to the public node is refused whole",
  patch("", ADMIN, { "wanteds/w1": archivedW1, "archive/wanteds/w1": null }), 401);
await expect("...so the person is still in the archive", read("archive/wanteds/w1", ADMIN), 200);
await expect("adding an ordinary wanted person still works", put("wanteds/w3", ADMIN, person("W Three")), 200);
await expect("a person can be archived with a server-timestamp mark",
  patch("", ADMIN, { "archive/wanteds/w3": { ...person("W Three"), archived: mark(ADMIN, { at: { ".sv": "timestamp" } }) }, "wanteds/w3": null }), 200);
const svPersonAt = await value("archive/wanteds/w3/archived/at", "owner");
check("...stored as a real millisecond timestamp", typeof svPersonAt === "number" && Math.abs(svPersonAt - Date.now()) < 60_000, String(svPersonAt));

// --- restoring ---------------------------------------------------------------
await expect("admin restores a wanted person (write back stripped record, remove archive copy)",
  patch("", ADMIN2, { "wanteds/w1": person("W One"), "archive/wanteds/w1": null }), 200);
await expect("the person is public again", read("wanteds/w1", "anon"), 200);
const archiveW1 = await value("archive/wanteds/w1", "owner");
check("...and gone from the archive", archiveW1 === null);

// --- missing persons behave the same ----------------------------------------
const archivedM1 = { ...person("M One"), wanted_for: null, archived: mark(ADMIN) };
await expect("admin archives a missing person", patch("", ADMIN, { "archive/missings/m1": archivedM1, "missings/m1": null }), 200);
const publicM1 = await value("missings/m1", "owner");
check("the missing person is gone from the public node", publicM1 === null);
await expect("officer cannot read archived missing persons", read("archive/missings", OFFICER), 401);
await expect("admin can delete an archived person for good", del("archive/missings/m1", ADMIN), 200);
await expect("officer cannot delete from the archive", del("archive/wanteds/w1", OFFICER), 401);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall archive rules checks passed");
process.exit(failures ? 1 : 0);
