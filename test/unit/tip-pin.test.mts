/**
 * Unit tests for PIN generation and for spotting a quoted PIN in a message.
 *
 *   npm run test:unit
 */

import { readFileSync } from "node:fs";
import {
  findTipPinCandidates,
  generateTipPin,
  isIssuableTipPin,
  isValidTipPin,
  TIP_PIN_ALPHABET,
  TIP_PIN_LENGTH,
  TIP_PIN_MAX_CANDIDATES,
  TIP_PIN_PATTERN,
} from "../../src/lib/tipPin.ts";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// --- the alphabet and the pattern must agree, in both directions -------------
check("alphabet is 31 characters", TIP_PIN_ALPHABET.length === 31, `got ${TIP_PIN_ALPHABET.length}`);
check("alphabet excludes 0 O 1 I L", !/[01ILO]/.test(TIP_PIN_ALPHABET));
check("pattern accepts every alphabet character",
  [...TIP_PIN_ALPHABET].every((c) => TIP_PIN_PATTERN.test(c.repeat(TIP_PIN_LENGTH))));
check("pattern rejects excluded and lowercase characters",
  [..."01ILO abc"].every((c) => !TIP_PIN_PATTERN.test(c.repeat(TIP_PIN_LENGTH))));

// --- generation --------------------------------------------------------------
const drawn = Array.from({ length: 5000 }, generateTipPin);
check("every generated PIN is well-formed", drawn.every(isValidTipPin));
check("generated PINs are 6 characters", drawn.every((p) => p.length === 6));
check("generation is not obviously stuck", new Set(drawn).size > 4900,
  `${new Set(drawn).size} distinct of 5000`);

// --- a PIN is never an ordinary word or an ordinary number --------------------
// Anyone can write to the PIN index, and a message that merely contains a
// registered PIN is filed under that PIN's tip. So the rules refuse to register
// a PIN that is all letters ("NASSAU") or all digits, and the generator must
// never draw one: about one draw in six would otherwise be refused.
const many = Array.from({ length: 60000 }, generateTipPin);
check("every generated PIN has at least one digit", many.every((p) => /[2-9]/.test(p)));
check("every generated PIN has at least one letter", many.every((p) => /[A-HJKMNP-Z]/.test(p)));
check("every generated PIN may be issued", many.every(isIssuableTipPin));
check("words and numbers may not be issued",
  ["NASSAU", "STREET", "MURDER", "PARKED", "234567", "999999"].every((p) => isValidTipPin(p) && !isIssuableTipPin(p)));
check("mixed PINs may be issued, wherever the digit sits",
  ["2ABCDE", "ABCDE2", "ABC2DE", "A23456", "23456A", "K7M2QX"].every(isIssuableTipPin));
check("what is not a PIN at all may not be issued",
  [undefined, null, 7, "", "abc2de", "ABC2D", "ABC2DEF", "ABC0DE", "ABC1DE"].every((p) => !isIssuableTipPin(p)));
// Throwing away the unmixed draws must not skew what is left: every character
// should still turn up as often as every other of its kind, in every position.
// A given letter is expected in a given position of a mixed PIN with
// probability (1/31)(1 - (23/31)^5) / P(mixed), a given digit with
// (1/31)(1 - (8/31)^5) / P(mixed): digits a little more often than letters,
// because a PIN that would otherwise be all letters needs one.
const N = many.length;
const pMixed = 1 - (23 / 31) ** 6 - (8 / 31) ** 6;
const expectLetter = (N / 31) * (1 - (23 / 31) ** 5) / pMixed;   // about 1,801
const expectDigit = (N / 31) * (1 - (8 / 31) ** 5) / pMixed;     // about 2,321
const counts = Array.from({ length: TIP_PIN_LENGTH }, () => new Map<string, number>());
for (const p of many) [...p].forEach((c, i) => counts[i].set(c, (counts[i].get(c) ?? 0) + 1));
const spread = (chars: string) => {
  const seen = counts.flatMap((position) => [...chars].map((c) => position.get(c) ?? 0));
  return { min: Math.min(...seen), max: Math.max(...seen) };
};
// Within 5.5 standard deviations: loose enough never to fail by chance, tight
// enough to catch a generator that favours a character or a position.
const within = (seen: { min: number; max: number }, expected: number) => {
  const slack = 5.5 * Math.sqrt(expected * (1 - expected / N));
  return seen.min > expected - slack && seen.max < expected + slack;
};
const letters = spread("ABCDEFGHJKMNPQRSTUVWXYZ"), digits = spread("23456789");
check("letters stay evenly spread", within(letters, expectLetter), `${letters.min}-${letters.max}, expected about ${Math.round(expectLetter)}`);
check("digits stay evenly spread", within(digits, expectDigit), `${digits.min}-${digits.max}, expected about ${Math.round(expectDigit)}`);
check("about one PIN in three still starts with a digit, as chance would have it",
  Math.abs(many.filter((p) => /^[2-9]/.test(p)).length / N - 8 * expectDigit / N) < 0.02);

// The generator and the database rules must agree, or tips would be refused.
const pinRule: string = JSON.parse(readFileSync("database.rules.json", "utf8")).rules.tipPins.$pin[".validate"];
check("the rules demand a digit and a letter of a new PIN, as the generator supplies",
  pinRule.includes("$pin.matches(/^.*[2-9].*$/)") && pinRule.includes("$pin.matches(/^.*[A-HJKMNP-Z].*$/)"));
const allRules = JSON.parse(readFileSync("database.rules.json", "utf8")).rules;
const route = readFileSync("src/app/api/message/route.ts", "utf8");
check("the key that would hide a tip from the inbox is refused by the rules and by the intake",
  allRules.messages.$messageId[".validate"].startsWith("$messageId !== '__proto__' && ") &&
  allRules.tipPins.$pin.tipId[".validate"].endsWith(" && newData.val() !== '__proto__'") &&
  /TIP_ID_PATTERN\.test\(id\) && id !== "__proto__"/.test(route) && /claim && isTipKey\(claim\.tipId\)/.test(route));
check("deleting a tip only removes the PIN entry that is its own",
  /if \(entry && entry\.tipId === tipId\) await remove\(ref\(db, `tipPins\/\$\{pin\}`\)\)/.test(readFileSync("src/lib/tipAdmin.ts", "utf8")));
check("the rules tie a new PIN to a tip created with it and carrying it",
  pinRule.includes("!root.child('messages').child(newData.child('tipId').val()).exists()") &&
  pinRule.includes("newData.parent().parent().child('messages').child(newData.child('tipId').val()).child('pin').val() === $pin"));

// --- finding a quoted PIN ----------------------------------------------------
check("finds a PIN at the start, as instructed",
  same(findTipPinCandidates("623KUK the car came back last night"), ["623KUK"]));
check("finds a PIN written mid-sentence",
  same(findTipPinCandidates("Hi, my pin is 623KUK and I saw them again"), ["623KUK"]));
check("is case-insensitive",
  same(findTipPinCandidates("623kuk more information"), ["623KUK"]));
check("copes with punctuation around it",
  same(findTipPinCandidates("PIN:623KUK. They drove off."), ["623KUK"]));
check("returns candidates in the order they appear, de-duplicated",
  same(findTipPinCandidates("623KUK and also R4TK9W, again 623KUK"), ["623KUK", "R4TK9W"]));
check("ignores tokens that are too long",
  same(findTipPinCandidates("ABCDEFG is seven characters"), []));
check("ignores tokens containing excluded characters",
  same(findTipPinCandidates("BROKEN window"), []));   // O is not in the alphabet
check("finds nothing in an ordinary sentence",
  same(findTipPinCandidates("two men were fighting outside the shop"), []));

// The trap this function exists for: ordinary words can be PIN-shaped, so a
// match here means nothing until the caller looks it up among issued PINs.
// Words are still returned although no PIN issued today is one: PINs issued
// before that rule are, and their tipsters must still be able to follow up.
check("a PIN-shaped ordinary word IS returned — the caller must verify it",
  same(findTipPinCandidates("PARKED outside the store"), ["PARKED"]));
check("a letters-only PIN from before the rule is still found",
  same(findTipPinCandidates("my pin is hqwrty"), ["HQWRTY"]));

check("a long message cannot fan out into unlimited lookups",
  findTipPinCandidates(drawn.join(" ")).length <= TIP_PIN_MAX_CANDIDATES,
  `capped at ${TIP_PIN_MAX_CANDIDATES}`);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall tip-PIN unit checks passed");
process.exit(failures ? 1 : 0);
