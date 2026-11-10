/**
 * Unit tests for reading database records safely (npm run test:unit).
 *
 * The Firebase SDK builds snapshot.val() by assigning each child onto a plain
 * object, so a child named "__proto__" becomes the object's prototype. These
 * tests build records the same way and prove the staff pages' view of a tip
 * cannot be forged through one.
 */

import { tipArchiveStatus } from "../../src/lib/archive.ts";
import { ownData, ownEntry } from "../../src/lib/ownData.ts";
import { sourceOf, storedLabelFields } from "../../src/lib/tipCategories.ts";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** What the SDK's val() does with a node's children: plain assignment onto {}. */
const asTheSdkBuildsIt = (children: Record<string, unknown>): any => {
  const node: any = {};
  for (const [key, value] of Object.entries(children)) {
    node[key] = value !== null && typeof value === "object" && !Array.isArray(value) ? asTheSdkBuildsIt(value as Record<string, unknown>) : value;
  }
  return node;
};
// JSON.parse keeps "__proto__" as an ordinary key, which is how it arrives over the wire.
const wire = (json: string) => JSON.parse(json) as Record<string, unknown>;

// --- the hazard is real ---------------------------------------------------------
const forged = asTheSdkBuildsIt(wire(`{
  "message": "U2FsdGVkX1+tip", "encrypted": true, "created_at": 1700000000000, "pin": "AB2345",
  "__proto__": { "archive": { "at": 4102444800000, "by": "nobody", "remarks": "U2FsdGVkX1+r" }, "source": "call" }
}`));
check("(a planted __proto__ child really does become the record's prototype)",
  !Object.keys(forged).includes("__proto__") && !Object.prototype.hasOwnProperty.call(forged, "archive") && forged.archive?.by === "nobody");
check("(...and unguarded, the tip reads as archived and as a staff call)",
  tipArchiveStatus(forged) === "archived" && sourceOf(forged.source) === "call" && storedLabelFields(forged).source === "call");

// --- ownData removes it -----------------------------------------------------------
const clean = ownData(forged);
check("ownData keeps everything the record really holds",
  same(clean, { message: "U2FsdGVkX1+tip", encrypted: true, created_at: 1700000000000, pin: "AB2345" }));
check("the forged archive mark is gone: the tip is open, and shown in the inbox",
  clean.archive === undefined && tipArchiveStatus(clean) !== "archived");
check("the forged source is gone", clean.source === undefined && sourceOf(clean.source) === null && same(storedLabelFields(clean), {}));
check("the copy has an ordinary prototype", Object.getPrototypeOf(clean) === Object.prototype);

// One level down as well: follow-ups, and an object-form message.
const nested = asTheSdkBuildsIt(wire(`{
  "message": { "ciphertext": { "words": [1, 2], "sigBytes": 8 }, "__proto__": { "salt": { "words": [0], "sigBytes": 1e15 } } },
  "created_at": 1,
  "followUps": { "f1": { "message": "x", "created_at": 5 }, "__proto__": { "f9": { "message": "hidden", "created_at": 9 } } }
}`));
check("(nested, the planted values are visible to plain reads)", nested.message.salt?.sigBytes === 1e15 && nested.followUps.f9?.message === "hidden");
const cleanNested = ownData(nested);
check("ownData cleans every level", cleanNested.message.salt === undefined && cleanNested.followUps.f9 === undefined &&
  same(Object.keys(cleanNested.followUps), ["f1"]) && same(cleanNested.message, { ciphertext: { words: [1, 2], sigBytes: 8 } }));

// A whole /messages node: the tip under "__proto__" is not listed either way,
// and must not leak fields into the map.
const node = asTheSdkBuildsIt(wire(`{ "-Tip1": { "message": "a", "created_at": 1 }, "__proto__": { "-Ghost": { "message": "b", "created_at": 2 } } }`));
check("(a tip under the key __proto__ is reachable by id through the prototype)", node["-Ghost"]?.message === "b");
check("ownData leaves only the real tips, and no ghost lookups", same(Object.keys(ownData(node)), ["-Tip1"]) && ownData(node)["-Ghost"] === undefined);

// --- shape of what comes back --------------------------------------------------------
check("primitives, null and undefined pass through",
  ownData("x") === "x" && ownData(7) === 7 && ownData(true) === true && ownData(null) === null && ownData(undefined) === undefined);
check("arrays stay arrays, cleaned inside", Array.isArray(ownData([1, { a: 1 }])) && same(ownData([1, { a: 1 }]), [1, { a: 1 }]));
const sparse: unknown[] = []; sparse[1] = { m: 1 }; sparse[2] = { m: 2 };
check("an array with a gap keeps its positions (numbered children)", same(Object.keys(ownData(sparse)), ["1", "2"]));
check("an own key spelled __proto__ is never copied onto the result",
  !Object.keys(ownData(wire(`{ "a": 1, "__proto__": { "b": 2 } }`))).includes("__proto__") && (ownData(wire(`{ "a": 1, "__proto__": { "b": 2 } }`)) as any).b === undefined);
check("the original is not modified", forged.archive?.by === "nobody");

// --- looking a record up by id ----------------------------------------------------------
const copies: Record<string, { forwarded_at: number }> = { "-Tip1": { forwarded_at: 1 } };
check("(a plain lookup finds what every object inherits)", Boolean((copies as any)["constructor"]) && Boolean((copies as any)["toString"]));
check("ownEntry finds only real entries",
  ownEntry(copies, "-Tip1")?.forwarded_at === 1 && ownEntry(copies, "constructor") === undefined && ownEntry(copies, "toString") === undefined &&
  ownEntry(copies, "__proto__") === undefined && ownEntry(copies, "hasOwnProperty") === undefined && ownEntry(copies, "-Missing") === undefined);
check("ownEntry copes with no map at all", ownEntry(null, "x") === undefined && ownEntry(undefined, "x") === undefined);
// When every child of a node is numbered the SDK hands back an array, and an
// array's "length" is its own property without being a record.
const numbered = [{ forwarded_at: 1 }, { forwarded_at: 2 }] as unknown as Record<string, { forwarded_at: number }>;
check("in a map that arrived as an array, only numbered positions are entries",
  ownEntry(numbered, "0")?.forwarded_at === 1 && ownEntry(numbered, "1")?.forwarded_at === 2 &&
  ownEntry(numbered, "length") === undefined && ownEntry(numbered, "2") === undefined && ownEntry(numbered, "01") === undefined);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall own-data unit checks passed");
process.exit(failures ? 1 : 0);
