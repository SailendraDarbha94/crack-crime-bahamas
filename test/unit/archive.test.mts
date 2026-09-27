/**
 * Unit tests for the archive helpers (npm run test:unit).
 */

import {
  archiveHistory,
  latestFollowUpAt,
  normaliseRemarks,
  publicRecordOf,
  tipArchiveStatus,
} from "../../src/lib/archive.ts";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};

const T = 1_700_000_000_000;

// --- status is derived from the archive mark and the follow-ups ---------------
check("a tip with no archive mark is open", tipArchiveStatus({ message: "x" } as any) === "open");
check("a tip with follow-ups but no archive mark is open",
  tipArchiveStatus({ followUps: { a: { created_at: T } } }) === "open");
check("an archived tip with no follow-ups is archived",
  tipArchiveStatus({ archive: { at: T, by: "u", remarks: "c" } }) === "archived");
check("an archived tip whose follow-ups all predate the archive stays archived",
  tipArchiveStatus({ archive: { at: T, by: "u", remarks: "c" }, followUps: { a: { created_at: T - 1 }, b: { created_at: T } } }) === "archived");
check("a follow-up newer than the archive reopens the tip",
  tipArchiveStatus({ archive: { at: T, by: "u", remarks: "c" }, followUps: { a: { created_at: T - 1 }, b: { created_at: T + 1 } } }) === "reopened");
check("a malformed follow-up timestamp cannot reopen a tip",
  tipArchiveStatus({ archive: { at: T, by: "u", remarks: "c" }, followUps: { a: { created_at: "later" } } }) === "archived");
check("an archive mark without a timestamp counts as archived at the dawn of time",
  tipArchiveStatus({ archive: { by: "u", remarks: "c" }, followUps: { a: { created_at: 5 } } }) === "reopened");
check("null and undefined are open", tipArchiveStatus(null) === "open" && tipArchiveStatus(undefined) === "open");
// A forged far-future stamp must not hold a tip open against the admin.
check("a follow-up stamped far in the future cannot reopen a tip",
  tipArchiveStatus({ archive: { at: T, by: "u", remarks: "c" }, followUps: { a: { created_at: 9e15 } } }, T + 1000) === "archived");
check("a follow-up a few minutes ahead (ordinary clock skew) still reopens it",
  tipArchiveStatus({ archive: { at: T, by: "u", remarks: "c" }, followUps: { a: { created_at: T + 3 * 60_000 } } }, T + 1000) === "reopened");

// --- latest follow-up ---------------------------------------------------------
check("no follow-ups → 0", latestFollowUpAt({}) === 0);
check("picks the newest follow-up",
  latestFollowUpAt({ followUps: { a: { created_at: 3 }, b: { created_at: 9 }, c: { created_at: 5 } } }) === 9);
check("ignores follow-ups without a numeric timestamp",
  latestFollowUpAt({ followUps: { a: { created_at: 3 }, b: {}, c: { created_at: "x" } } }) === 3);
check("ignores follow-ups stamped beyond the future skew allowance",
  latestFollowUpAt({ followUps: { a: { created_at: T }, b: { created_at: T + 11 * 60_000 } } }, T) === T);

// --- history --------------------------------------------------------------------
const history = archiveHistory({
  k2: { action: "restored", at: T + 10, by: "u" },
  k1: { action: "archived", at: T, by: "u", remarks: "c" },
  bad: { action: "archived" } as any,
});
check("history is oldest first and drops malformed entries",
  history.length === 2 && history[0].action === "archived" && history[1].action === "restored");
check("no log → empty history", archiveHistory(null).length === 0 && archiveHistory(undefined).length === 0);

// --- restoring a person strips everything the archive added --------------------
const restored = publicRecordOf({
  name: "A", age: "30", image: "wanteds/a.jpg", created_at: T,
  archived: { at: T, by: "u", remarks: "c" }, archiveLog: { x: 1 },
} as any) as Record<string, unknown>;
check("public record keeps the person's own fields",
  restored.name === "A" && restored.image === "wanteds/a.jpg" && restored.created_at === T);
check("public record carries no archive fields", !("archived" in restored) && !("archiveLog" in restored));

// --- remarks --------------------------------------------------------------------
check("remarks are trimmed", normaliseRemarks("  closed, arrest made  ") === "closed, arrest made");
check("blank remarks are refused", normaliseRemarks("   ") === null && normaliseRemarks("") === null);
check("over-long remarks are refused", normaliseRemarks("x".repeat(2001)) === null);
check("remarks at the limit are accepted", normaliseRemarks("x".repeat(2000))?.length === 2000);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall archive unit checks passed");
process.exit(failures ? 1 : 0);
