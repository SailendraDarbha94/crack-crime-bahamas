/**
 * Unit tests for PIN generation and for spotting a quoted PIN in a message.
 *
 *   npm run test:unit
 */

import {
  findTipPinCandidates,
  generateTipPin,
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
check("a PIN-shaped ordinary word IS returned — the caller must verify it",
  same(findTipPinCandidates("PARKED outside the store"), ["PARKED"]));

check("a long message cannot fan out into unlimited lookups",
  findTipPinCandidates(drawn.join(" ")).length <= TIP_PIN_MAX_CANDIDATES,
  `capped at ${TIP_PIN_MAX_CANDIDATES}`);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall tip-PIN unit checks passed");
process.exit(failures ? 1 : 0);
