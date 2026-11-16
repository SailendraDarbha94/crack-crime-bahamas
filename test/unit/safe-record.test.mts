/**
 * Unit tests for the helpers that let staff pages show records anyone may have
 * written (npm run test:unit).
 */

import {
  FUTURE_ALLOWANCE_MS,
  MAX_FOLLOW_UPS_SHOWN,
  followUpEntries,
  latestOf,
  latestNotFuture,
  newestOnly,
  recordsOf,
  shortText,
  textOf,
  timeOf,
} from "../../src/lib/safeRecord.ts";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// --- times -------------------------------------------------------------------
check("a stored number of milliseconds is used as it is", timeOf(1794337688098) === 1794337688098 && timeOf(0) === 0);
check("an older record's date string is understood", timeOf("2024-06-27T10:15:00.000Z") === Date.parse("2024-06-27T10:15:00.000Z"));
check("a number stored as text is understood", timeOf("1794337688098") === 1794337688098);
check("anything that is not a time counts as 0, never NaN",
  [undefined, null, "abc", "", {}, [], true, NaN, Infinity, -Infinity, { valueOf: 1 }, "9".repeat(400)].every((v) => timeOf(v) === 0));
check("a number no Date can hold is not a time (formatting it would print NaN)",
  timeOf(1e300) === 0 && timeOf(8.64e15 + 1) === 0 && timeOf("9999999999999999") === 0 && timeOf(-5) === 0 && timeOf(8.64e15) === 8.64e15);
check("every time that comes back can be formatted", [1, 1794337688098, 32503680000000, 8.64e15].every((t) => !Number.isNaN(new Date(timeOf(t)).getTime())));

// --- ordering: a date in the far future does not win for ever ----------------------
const nowMs = 1794337688098;
check("a time in the past or just ahead is kept for ordering",
  latestNotFuture([nowMs - 5], nowMs) === nowMs - 5 && latestNotFuture([nowMs + 1000], nowMs) === nowMs + 1000 && latestNotFuture([nowMs + FUTURE_ALLOWANCE_MS], nowMs) === nowMs + FUTURE_ALLOWANCE_MS);
check("a time in the year 3000 is passed over: the record orders by its real times",
  latestNotFuture([32503680000000, nowMs - 60000, nowMs - 5], nowMs) === nowMs - 5);
check("...and last of all if it has no real time (not first, as capping it to 'now' would make it)",
  latestNotFuture([32503680000000], nowMs) === 0 && latestNotFuture([nowMs + FUTURE_ALLOWANCE_MS + 1], nowMs) === 0 && latestNotFuture([], nowMs) === 0);
check("junk among the times is passed over too", latestNotFuture(["abc", null, { a: 1 }, nowMs - 9, "2024-06-27T10:15:00.000Z"], nowMs) === nowMs - 9);
// The clock a stored time is compared with is the viewer's own. A PC that runs
// slow, or is set to the wrong time zone, must still see a new tip as new.
const sentAt = nowMs;
check("a viewer whose clock is ten minutes, or five hours, slow still orders a new tip by its time",
  latestNotFuture([sentAt], nowMs - 10 * 60 * 1000) === sentAt && latestNotFuture([sentAt], nowMs - 5 * 60 * 60 * 1000) === sentAt);
check("the allowance is a day and a little: as far ahead as the rules let a new tip be stamped",
  FUTURE_ALLOWANCE_MS >= 24 * 60 * 60 * 1000 && FUTURE_ALLOWANCE_MS <= 25 * 60 * 60 * 1000);

// --- the records under a node ------------------------------------------------------------
check("a map of records comes back as pairs", same(recordsOf({ a: { x: 1 }, b: { x: 2 } }), [["a", { x: 1 }], ["b", { x: 2 }]]));
check("nothing stored is no records", same(recordsOf(null), []) && same(recordsOf(undefined), []) && same(recordsOf({}), []));
check("a node that is not a map has no records", same(recordsOf("text"), []) && same(recordsOf(7), []) && same(recordsOf(true), []));
// Over REST a node whose ids are all numbers arrives as a list, with null where an id is unused.
check("numbered records keep their own ids, and the gaps are skipped", same(recordsOf([null, { x: 1 }, null, { x: 3 }]), [["1", { x: 1 }], ["3", { x: 3 }]]));
check("records that are not objects are still listed (the page decides what to do with them)", same(recordsOf({ a: "junk", b: 7 }), [["a", "junk"], ["b", 7]]));

// --- the latest of many, without spreading ---------------------------------------
check("the latest of a few times", latestOf([5, 9, 3]) === 9 && latestOf([]) === 0 && latestOf([], 7) === 7 && latestOf([1, 2], 7) === 7);
check("junk among them is passed over", latestOf([5, "abc", null, { a: 1 }, NaN, 12, "2024-06-27T10:15:00.000Z"]) === Date.parse("2024-06-27T10:15:00.000Z"));
// The reason this exists: Math.max(...list) throws past the engine's argument limit.
const many = Array.from({ length: 400000 }, (_, i) => i);
let spreadThrows = false;
try { Math.max(...many); } catch { spreadThrows = true; }
check("(spreading 400,000 values into Math.max really does throw)", spreadThrows);
check("latestOf copes with 400,000 values", latestOf(many) === 399999);
check("...and with a generator", latestOf((function* () { yield 4; yield 8; })()) === 8);

// --- follow-ups --------------------------------------------------------------------
check("a map of follow-ups comes back as pairs",
  same(followUpEntries({ a: { message: "x", created_at: 1 }, b: { message: "y", created_at: 2 } }), [["a", { message: "x", created_at: 1 }], ["b", { message: "y", created_at: 2 }]]));
check("no follow-ups at all is an empty list", same(followUpEntries(undefined), []) && same(followUpEntries(null), []) && same(followUpEntries({}), []));
check("followUps stored as a string is NOT read one character at a time",
  same(followUpEntries("a".repeat(1000)), []) && Object.entries("abc").length === 3);
check("other junk is not follow-ups either", same(followUpEntries(7), []) && same(followUpEntries(true), []));
check("entries that are not records are skipped", same(followUpEntries({ a: "text", b: 7, c: null, d: [1], e: { message: "ok" } }), [["e", { message: "ok" }]]));
// Numbered follow-ups arrive as an array, possibly with gaps.
const numbered: unknown[] = []; numbered[1] = { message: "one" }; numbered[2] = { message: "two" };
check("numbered follow-ups (an array with a gap) keep their own ids", same(followUpEntries(numbered), [["1", { message: "one" }], ["2", { message: "two" }]]));

// --- how many are shown ----------------------------------------------------------------
const few = [1, 2, 3];
check("a real conversation is shown whole", newestOnly(few).shown === few && newestOnly(few).hidden === 0);
const flood = Array.from({ length: 130000 }, (_, i) => i);
const capped = newestOnly(flood);
check("a flood is cut to the newest, and says how many were left out",
  capped.shown.length === MAX_FOLLOW_UPS_SHOWN && capped.hidden === 130000 - MAX_FOLLOW_UPS_SHOWN && capped.shown[0] === 130000 - MAX_FOLLOW_UPS_SHOWN && capped.shown.at(-1) === 129999);
check("the limit can be chosen", same(newestOnly([1, 2, 3, 4], 2), { shown: [3, 4], hidden: 2 }) && same(newestOnly([], 2), { shown: [], hidden: 0 }));

// --- text ------------------------------------------------------------------------------------
check("text passes through, anything else becomes the fallback",
  textOf("K7M2QX") === "K7M2QX" && textOf({ x: 1 }) === "" && textOf(7) === "" && textOf(null, "none") === "none" && textOf(undefined) === "");

check("a short label is kept, a megabyte is cut, and junk is the fallback",
  shortText("SM-A546E") === "SM-A546E" && shortText("x".repeat(1000000)).length === 201 && shortText("abcdef", 3) === "abc…" && shortText({ a: 1 }, 10, "?") === "?");

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall safe-record unit checks passed");
process.exit(failures ? 1 : 0);
