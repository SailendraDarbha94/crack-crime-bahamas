/**
 * Database-rules tests: what a stranger may store (npm run test:rules).
 *
 * The public intake has no identity of its own, so every node it writes can be
 * written by anyone, straight to the database. These prove that what a
 * stranger can store there is held to the shape the site's own writers
 * produce: no key that breaks the SDK or forges a record's fields, no nested
 * junk, no object where text belongs. And that every write the site itself
 * makes is still accepted, including on the older, looser records already in
 * the database.
 */

const BASE = process.env.RTDB_EMULATOR ?? "http://127.0.0.1:9000";
const NS = process.env.RTDB_NAMESPACE ?? "demo-ccb-default-rtdb";

/** Request text built by hand, for keys an object literal cannot carry. Sent as it is. */
class RawJson { constructor(text) { this.text = text; } }
/** JSON text with keys in a fixed order, to compare what was stored with what was sent. */
const canonical = (v) => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x));

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const tokenFor = (uid) =>
  `${b64({ alg: "none", typ: "JWT" })}.${b64({ uid, sub: uid, user_id: uid, iat: 1, exp: 9999999999 })}.`;
const call = async (method, path, who, body) => {
  const init = { method };
  if (body !== undefined) init.body = body instanceof RawJson ? body.text : JSON.stringify(body);
  let url = `${BASE}/${path}.json?ns=${NS}`;
  if (who === "owner") init.headers = { Authorization: "Bearer owner" };
  else if (who !== "anon") url += `&auth=${tokenFor(who)}`;
  return (await fetch(url, init)).status;
};
const read = (p, who) => call("GET", p, who);
const put = (p, who, b) => call("PUT", p, who, b);
const patch = (p, who, b) => call("PATCH", p, who, b);
const del = (p, who) => call("DELETE", p, who);
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
/** JSON text with a key an object literal cannot carry ("__proto__") or that is awkward to build. */
const withKey = (base, key, child) => new RawJson(JSON.stringify(base).replace(/}$/, `,${JSON.stringify(key)}:${JSON.stringify(child)}}`));

await put(`admins/${ADMIN}`, "owner", true);
await put(`police/${OFFICER}`, "owner", true);

// === What the intake itself writes is still accepted ============================
await expect("a tip as the intake files it, with its PIN entry",
  patch("", "anon", { "messages/-HxTip00000000000001": { ...cipher, pin: "HA2HA2", source: "web", category: "other", category_other: "U2FsdGVkX1+o" }, "tipPins/HA2HA2": { tipId: "-HxTip00000000000001", created_at: now } }), 200);
await expect("the intake's last resort: the bare tip alone", put("messages/-HxTip00000000000002", "anon", { ...cipher, pin: "HB3HB3" }), 200);
await expect("a tip from an old app version: text only (no flag, no PIN)", put("messages/-HxTip00000000000003", "anon", { message: "U2FsdGVkX1+x", created_at: now }), 200);
await expect("a follow-up", put("messages/-HxTip00000000000001/followUps/-HxFu0000000000000001", "anon", { ...cipher, created_at: Date.now() }), 200);
await expect("a call-in tip filed as an admin",
  patch("", ADMIN, { "messages/-HxTip00000000000004": { ...cipher, pin: "HC4HC4", source: "call", category: "homicide" }, "tipPins/HC4HC4": { tipId: "-HxTip00000000000004", created_at: now } }), 200);

// === The key that stops every page reading: "hasOwnProperty" =====================
// The SDK calls obj.hasOwnProperty on everything it receives, so one record
// holding a key of that name, at any depth, made get() of the whole node fail.
await expect("a tip cannot be stored under the id hasOwnProperty", put("messages/hasOwnProperty", "anon", { ...cipher }), 401);
await expect("...not with a PIN entry naming it either",
  patch("", "anon", { "messages/hasOwnProperty": { ...cipher, pin: "HD5HD5" }, "tipPins/HD5HD5": { tipId: "hasOwnProperty", created_at: now } }), 401);
await expect("a tip cannot carry a field called hasOwnProperty", put("messages/-HxBad0000000000001", "anon", { ...cipher, hasOwnProperty: 1 }), 401);
await expect("...nor a field called __proto__", put("messages/-HxBad0000000000001", "anon", withKey(cipher, "__proto__", { archive: { at: 1 } })), 401);
await expect("a follow-up cannot be stored under the id hasOwnProperty",
  put("messages/-HxTip00000000000001/followUps/hasOwnProperty", "anon", { ...cipher, created_at: Date.now() }), 401);
await expect("a follow-up cannot carry a field called hasOwnProperty",
  put("messages/-HxTip00000000000001/followUps/-HxFu0000000000000002", "anon", { ...cipher, created_at: Date.now(), hasOwnProperty: 1 }), 401);
await expect("an admin cannot store the key either", put("messages/-HxBad0000000000001", ADMIN, { ...cipher, hasOwnProperty: 1 }), 401);
await expect("a PIN entry cannot carry it (no extra fields at all)",
  patch("", "anon", { "messages/-HxBad0000000000001": { ...cipher, pin: "HD5HD5" }, "tipPins/HD5HD5": { tipId: "-HxBad0000000000001", created_at: now, hasOwnProperty: 1 } }), 401);

// === Nothing nested, nothing oversized, beside a tip's own fields =================
await expect("an extra field holding an object is refused (nothing can hide inside it)",
  put("messages/-HxBad0000000000001", "anon", { ...cipher, extra: { hasOwnProperty: 1 } }), 401);
await expect("an extra field holding a list is refused", put("messages/-HxBad0000000000001", "anon", { ...cipher, extra: [1, 2, 3] }), 401);
await expect("an extra field holding a long string is refused", put("messages/-HxBad0000000000001", "anon", { ...cipher, extra: "x".repeat(201) }), 401);
await expect("the plain extra fields real tips carry are accepted",
  put("messages/-HxTip00000000000005", "anon", { ...cipher, updated_at: "2026-08-01T10:00:00.000Z", note: 7, flag: false }), 200);

// === The message is text ===========================================================
// The 2024 app sent cipher OBJECTS, and ten such tips are still stored. No
// client has been able to send one since the intake was rebuilt, so a new tip
// whose message is an object is not from the intake.
const legacyCipherObject = { ciphertext: { words: [1, -2, 3, 4], sigBytes: 16 }, key: { words: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], sigBytes: 32 }, iv: { words: [1, 2, 3, 4], sigBytes: 16 }, salt: { words: [1, 2], sigBytes: 8 }, blockSize: 4 };
await expect("a new tip whose message is a cipher object is refused", put("messages/-HxBad0000000000001", "anon", { message: legacyCipherObject, created_at: now }), 401);
await expect("...including one claiming an impossible size",
  put("messages/-HxBad0000000000001", "anon", { message: { ciphertext: { words: [0], sigBytes: 4 }, salt: { words: [0], sigBytes: 1e15 } }, created_at: now }), 401);
await expect("...and one hiding the key inside it", put("messages/-HxBad0000000000001", "anon", { message: { hasOwnProperty: 1 }, created_at: now }), 401);
await expect("a message that is a number is refused", put("messages/-HxBad0000000000001", "anon", { message: 7, created_at: now }), 401);
await expect("an empty message is refused", put("messages/-HxBad0000000000001", "anon", { message: "", created_at: now }), 401);
await expect("a message over the limit is refused", put("messages/-HxBad0000000000001", "anon", { message: "U".repeat(41001), created_at: now }), 401);

// === The time is a number, and not from the far future ==============================
await expect("a date written as text is refused", put("messages/-HxBad0000000000001", "anon", { ...cipher, created_at: "2026-11-11T00:00:00.000Z" }), 401);
await expect("a date of nothing is refused", put("messages/-HxBad0000000000001", "anon", { ...cipher, created_at: 0 }), 401);
await expect("a negative date is refused", put("messages/-HxBad0000000000001", "anon", { ...cipher, created_at: -5 }), 401);
await expect("a date in the year 3000 is refused (it would sit at the top of the inbox for good)",
  put("messages/-HxBad0000000000001", "anon", { ...cipher, created_at: 32503680000000 }), 401);
await expect("a date two days ahead is refused", put("messages/-HxBad0000000000001", "anon", { ...cipher, created_at: Date.now() + 2 * 86400000 }), 401);
await expect("a clock a few hours out is tolerated: the tip matters more than its minute",
  put("messages/-HxTip00000000000006", "anon", { ...cipher, created_at: Date.now() + 6 * 3600000 }), 200);
await expect("an old date is accepted (nothing to gain from one)", put("messages/-HxTip00000000000007", "anon", { ...cipher, created_at: 1717200000000 }), 200);

// === Follow-ups are a map of follow-ups ==============================================
await expect("followUps stored as text is refused (it used to be read one character at a time)",
  put("messages/-HxBad0000000000001", "anon", { ...cipher, followUps: "a".repeat(5000) }), 401);
await expect("followUps stored as a number is refused", put("messages/-HxBad0000000000001", "anon", { ...cipher, followUps: 7 }), 401);
await expect("followUps holding text entries is refused", put("messages/-HxBad0000000000001", "anon", { ...cipher, followUps: { a: "x", b: "y" } }), 401);
await expect("a tip born with a well-formed follow-up is still accepted",
  put("messages/-HxTip00000000000008", "anon", { ...cipher, followUps: { "-HxFu0000000000000003": { message: "U2FsdGVkX1+f", encrypted: true, created_at: Date.now() } } }), 200);
await expect("none of the refused writes left a tip behind", put("messages/-HxBad0000000000001", "anon", { ...cipher }), 200);

// === Older, looser records already stored keep working ===============================
// Seeded as the database owner, as they were stored before these rules: a 2024
// cipher-object tip, a tip dated with text, one carrying a nested extra field.
await put("messages/-HxOld0000000000001", "owner", { message: legacyCipherObject, created_at: 1720000000000 });
await put("messages/-HxOld0000000000002", "owner", { message: "plain text from 2024", created_at: "2024-06-12T09:00:00.000Z", updated_at: "2024-06-12T09:05:00.000Z" });
await put("messages/-HxOld0000000000003", "owner", { message: "U2FsdGVkX1+old", encrypted: true, created_at: 1730000000000, pin: "HQWRTZ", legacy: { nested: { deep: 1 } } });
for (const [id, what] of [["-HxOld0000000000001", "a 2024 cipher-object tip"], ["-HxOld0000000000002", "a tip dated with text"], ["-HxOld0000000000003", "a tip with a nested extra field"]]) {
  await expect(`${what}: the tipster can still follow up`, put(`messages/${id}/followUps/-HxFu000000000000000A`, "anon", { ...cipher, created_at: Date.now() }), 200);
  await expect(`${what}: an admin can archive it`,
    patch(`messages/${id}`, ADMIN, { archive: { at: { ".sv": "timestamp" }, by: ADMIN, remarks: "U2FsdGVkX1+r" }, "archiveLog/-HxLog0000000000001": { action: "archived", at: { ".sv": "timestamp" }, by: ADMIN, remarks: "U2FsdGVkX1+r" } }), 200);
  await expect(`${what}: an admin can restore it`,
    patch(`messages/${id}`, ADMIN, { archive: null, "archiveLog/-HxLog0000000000002": { action: "restored", at: { ".sv": "timestamp" }, by: ADMIN } }), 200);
  await expect(`${what}: an admin can set its type of crime`, put(`messages/${id}/category`, ADMIN, "homicide"), 200);
  const stored = await value(`messages/${id}`);
  await expect(`${what}: an admin can forward it to the police, message and date as stored`,
    put(`policeTips/${id}`, ADMIN, { message: stored.message, created_at: stored.created_at, ...(typeof stored.encrypted === "boolean" ? { encrypted: stored.encrypted } : {}), forwarded_at: Date.now(), forwarded_by: ADMIN }), 200);
  await expect(`${what}: an officer can read the copy`, read(`policeTips/${id}`, OFFICER), 200);
}
check("the stored cipher object was not touched by any of that", canonical((await value("messages/-HxOld0000000000001")).message) === canonical(legacyCipherObject));
await expect("an admin can delete an old tip", del("messages/-HxOld0000000000002", ADMIN), 200);

// === A PIN entry, once made, is never rewritten ======================================
// Admins write call-in tips through the same index. The create-only rule does
// not bind an admin, so the entry itself now refuses to be replaced.
await expect("an admin cannot point an existing PIN at a new tip",
  patch("", ADMIN, { "messages/-HxTip00000000000009": { ...cipher, pin: "HA2HA2", source: "call" }, "tipPins/HA2HA2": { tipId: "-HxTip00000000000009", created_at: now } }), 401);
check("...and the PIN still names its own tip", (await value("tipPins/HA2HA2"))?.tipId === "-HxTip00000000000001");
await expect("an admin can still delete a PIN entry", del("tipPins/HC4HC4", ADMIN), 200);

// === Staff profiles ====================================================================
const profile = { firstName: "Olive", lastName: "Officer", email: "olive@example.org", created_at: now };
await expect("a new account stores its own profile, as sign-up does", put(`users/${RANDO}`, RANDO, profile), 200);
await expect("...and as the Team page does for an officer, naming who created it", put("users/officer2", "officer2", { ...profile, createdBy: ADMIN }), 200);
await expect("a profile cannot be rewritten", put(`users/${RANDO}`, RANDO, { ...profile, firstName: "Other" }), 401);
await expect("nobody can write someone else's profile", put("users/victim1", RANDO, profile), 401);
for (const [why, bad] of Object.entries({
  "a name that is an object": { ...profile, firstName: { toString: 1, valueOf: 1 } },
  "a name that is a number": { ...profile, lastName: 7 },
  "an email that is an object": { ...profile, email: { a: 1 } },
  "a date written as text": { ...profile, created_at: "yesterday" },
  "a field the site never writes": { ...profile, uid: "someone-else" },
  "the key hasOwnProperty": { ...profile, hasOwnProperty: 1 },
  "an empty name": { ...profile, firstName: "" },
  "a name of 101 characters": { ...profile, firstName: "x".repeat(101) },
})) {
  await expect(`a profile with ${why} is refused`, put("users/newcomer1", "newcomer1", bad), 401);
}
await expect("...and a __proto__ child", put("users/newcomer1", "newcomer1", withKey(profile, "__proto__", { firstName: "x" })), 401);
await expect("the refused profiles left nothing behind", put("users/newcomer1", "newcomer1", profile), 200);

// === Device records =====================================================================
// What the app really sends (through /api/registrations, which writes as a
// stranger): the whole expo-device object, the token, and on older versions a
// location. The shape varies by platform and version, so the rule fixes the
// depth and the keys, not the field list.
const device = {
  Token: "HxDeviceToken000000001",
  Device: {
    brand: "samsung", manufacturer: "samsung", modelName: "SM-A546E", deviceName: "Ann's Galaxy A54", designName: "a54x", productName: "a54xnsxx",
    osName: "Android", osVersion: "14", osBuildId: "UP1A.231005.007", osInternalBuildId: "UP1A.231005.007.A546EXXS9BXK2",
    osBuildFingerprint: "samsung/a54xnsxx/a54x:14/UP1A.231005.007/A546EXXS9BXK2:user/release-keys",
    platformApiLevel: 34, deviceType: 1, deviceYearClass: 2023, totalMemory: 7661699072, isDevice: true,
    supportedCpuArchitectures: ["arm64-v8a", "armeabi-v7a", "armeabi"],
    DeviceType: { 0: "UNKNOWN", 1: "PHONE", 2: "TABLET", 3: "DESKTOP", 4: "TV", UNKNOWN: 0, PHONE: 1, TABLET: 2, DESKTOP: 3, TV: 4 },
  },
};
const location = { coords: { latitude: 25.06, longitude: -77.345, altitude: 3.1, accuracy: 12, altitudeAccuracy: 2, heading: 0, speed: 0 }, timestamp: now, mocked: false };
await expect("a device registers, as the app's request stores it", put(`notifications_register/${device.Token}`, "anon", device), 200);
await expect("an older app version adds its location", patch(`notifications_register/${device.Token}`, "anon", { Token: device.Token, Location: location }), 200);
await expect("the app re-registers over its own record", put(`notifications_register/${device.Token}`, "anon", { ...device, Location: location }), 200);
await expect("the app can read its own record by token", read(`notifications_register/${device.Token}`, "anon"), 200);
await expect("an iPhone's record (other fields, no location) registers too",
  put("notifications_register/HxDeviceToken000000002", "anon", { Token: "HxDeviceToken000000002", Device: { brand: "Apple", manufacturer: "Apple", modelName: "iPhone 15", modelId: "iPhone15,4", deviceName: "iPhone", osName: "iOS", osVersion: "18.1", osBuildId: "22B83", osInternalBuildId: "22B83", deviceType: 1, deviceYearClass: 2023, totalMemory: 5931073536, isDevice: true, supportedCpuArchitectures: ["arm64"] } }), 200);
await expect("a stranger cannot delete a device", del(`notifications_register/${device.Token}`, "anon"), 401);
await expect("a stranger cannot list the devices", read("notifications_register", "anon"), 401);

const badDevice = (mutate) => { const copy = JSON.parse(JSON.stringify({ ...device, Location: location })); mutate(copy); return copy; };
await expect("a device record cannot be stored under the token hasOwnProperty", put("notifications_register/hasOwnProperty", "anon", device), 401);
await expect("...nor under __proto__", put("notifications_register/__proto__", "anon", device), 401);
for (const [where, mutate] of Object.entries({
  "at the top": (d) => { d.hasOwnProperty = 1; },
  "inside Device": (d) => { d.Device.hasOwnProperty = 1; },
  "inside Location.coords": (d) => { d.Location.coords.hasOwnProperty = 1; },
  "inside the DeviceType table": (d) => { d.Device.DeviceType.hasOwnProperty = 1; },
})) {
  await expect(`a device record with the key hasOwnProperty ${where} is refused`, put("notifications_register/HxDeviceToken000000003", "anon", badDevice(mutate)), 401);
}
await expect("a device record with a __proto__ child is refused", put("notifications_register/HxDeviceToken000000003", "anon", withKey(device, "__proto__", { Device: { brand: "x" } })), 401);
await expect("...also one level down",
  put("notifications_register/HxDeviceToken000000003", "anon", new RawJson(JSON.stringify(device).replace('"Device":{', '"Device":{"__proto__":{"brand":"x"},'))), 401);
await expect("a device record nested five levels deep is refused",
  put("notifications_register/HxDeviceToken000000003", "anon", { Token: "HxDeviceToken000000003", a: { b: { c: { d: { e: 1 } } } } }), 401);
await expect("four levels (one more than the app uses) is still accepted",
  put("notifications_register/HxDeviceToken000000004", "anon", { Token: "HxDeviceToken000000004", a: { b: { c: { d: 1 } } } }), 200);
await expect("a device record with a very long string is refused",
  put("notifications_register/HxDeviceToken000000003", "anon", badDevice((d) => { d.Device.deviceName = "x".repeat(501); })), 401);
await expect("a device record that is just text is refused", put("notifications_register/HxDeviceToken000000003", "anon", "junk"), 401);
await expect("an update cannot slip the key in either", patch(`notifications_register/${device.Token}`, "anon", { hasOwnProperty: 1 }), 401);
await expect("...nor write it at depth", put(`notifications_register/${device.Token}/Device/hasOwnProperty`, "anon", 1), 401);
// Below the deepest level the rules name, and at that level: neither is a way round them.
await expect("a write aimed below the deepest level of an existing record is refused",
  put(`notifications_register/${device.Token}/a/b/c/d/e`, "anon", 1), 401);
await expect("...and so is one deeper still", put(`notifications_register/${device.Token}/a/b/c/d/e/f/hasOwnProperty`, "anon", 1), 401);
await expect("the key is refused at the deepest level too",
  put("notifications_register/HxDeviceToken000000003", "anon", { Token: "HxDeviceToken000000003", a: { b: { c: { hasOwnProperty: 1 } } } }), 401);
await expect("...written there directly as well", put(`notifications_register/${device.Token}/a/b/c/hasOwnProperty`, "anon", 1), 401);
await expect("a 501-character string at the deepest level is refused",
  put("notifications_register/HxDeviceToken000000003", "anon", { Token: "HxDeviceToken000000003", a: { b: { c: { d: "x".repeat(501) } } } }), 401);
check("none of the refused device writes left a record behind", (await value("notifications_register/HxDeviceToken000000003")) === null);
await expect("an admin can delete a device", del("notifications_register/HxDeviceToken000000004", ADMIN), 200);
check("the real device record is intact after all that",
  JSON.stringify((await value(`notifications_register/${device.Token}`))?.Device?.supportedCpuArchitectures) === JSON.stringify(device.Device.supportedCpuArchitectures));
// The older register node keeps the same rule.
await expect("the older registrations node takes a real record", put("registrations/HxDeviceToken000000001", "anon", device), 200);
await expect("...and refuses the key", put("registrations/HxDeviceToken000000005", "anon", { ...device, hasOwnProperty: 1 }), 401);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall hostile-record rules checks passed");
process.exit(failures ? 1 : 0);
