/**
 * Unit tests for sorting a refused batch of push messages by app
 * (npm run test:unit).
 */

import { MIXED_APPS_CODE, splitByApp } from "../../src/lib/pushGroups.ts";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const to = (token: string) => ({ to: `ExponentPushToken[${token}]`, body: "x" });
const ours = ["aaa", "bbb", "ccc"].map(to);
const theirs = [to("zzz")];
const batch = [ours[0], theirs[0], ours[1], ours[2]];

check("the code is the one Expo documents", MIXED_APPS_CODE === "PUSH_TOO_MANY_EXPERIENCE_IDS");

// What Expo sends with the refusal: each app's name and the tokens that are its own.
const details = {
  "@crimestoppers/app": ["ExponentPushToken[aaa]", "ExponentPushToken[bbb]", "ExponentPushToken[ccc]"],
  "@someone/else": ["ExponentPushToken[zzz]"],
};
const groups = splitByApp(batch, details);
check("a batch holding one planted token is split into the app's own devices and the stranger",
  same(groups, [[ours[0], ours[1], ours[2]], [theirs[0]]]));
check("every message is in exactly one group", groups !== null && groups.flat().length === batch.length && new Set(groups.flat()).size === batch.length);

check("the other spelling of a token is matched as well",
  same(splitByApp(batch, { a: ["ExpoPushToken[aaa]", "ExpoPushToken[bbb]", "ExpoPushToken[ccc]"], b: ["ExpoPushToken[zzz]"] }), [[ours[0], ours[1], ours[2]], [theirs[0]]]));
check("a message Expo did not mention gets a group of its own, and is still sent",
  same(splitByApp(batch, { a: ["ExponentPushToken[aaa]", "ExponentPushToken[bbb]"], b: ["ExponentPushToken[zzz]"] }), [[ours[0], ours[1]], [theirs[0]], [ours[2]]]));
check("three apps make three groups",
  same(splitByApp(batch, { a: ["ExponentPushToken[aaa]"], b: ["ExponentPushToken[zzz]"], c: ["ExponentPushToken[bbb]", "ExponentPushToken[ccc]"] }), [[ours[0]], [theirs[0]], [ours[1], ours[2]]]));
check("a token listed under two apps is sent once, with the first",
  same(splitByApp(batch, { a: ["ExponentPushToken[aaa]", "ExponentPushToken[bbb]", "ExponentPushToken[ccc]"], b: ["ExponentPushToken[aaa]", "ExponentPushToken[zzz]"] }), [[ours[0], ours[1], ours[2]], [theirs[0]]]));

// Nothing to gain from sending again: the caller counts the batch as failed.
check("details that separate nothing give null", splitByApp(batch, { a: batch.map((m) => m.to) }) === null);
check("details that list none of the batch give null", splitByApp(batch, { a: ["ExponentPushToken[qqq]"], b: ["ExponentPushToken[rrr]"] }) === null);
check("details of the wrong shape give null",
  [undefined, null, "text", 7, [], ["ExponentPushToken[aaa]"], {}, { a: "ExponentPushToken[aaa]" }, { a: [1, null, {}] }, { a: {} }].every((d) => splitByApp(batch, d) === null));
check("an empty batch gives null", splitByApp([], details) === null);
check("messages addressed to something that is not text are kept together, not lost",
  same(splitByApp([ours[0], { to: ["x"], body: "x" }, theirs[0]], details), [[ours[0]], [theirs[0]], [{ to: ["x"], body: "x" }]]));

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall push-groups unit checks passed");
process.exit(failures ? 1 : 0);
