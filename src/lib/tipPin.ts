import { randomInt } from "node:crypto";

/**
 * Tip PINs — the short code a tipster keeps after submitting a tip.
 *
 * Server-only: this module pulls in node:crypto, so never import it from a
 * client component. The PIN is a capability token, not a key to the tip: it
 * lets someone reference their own tip later without ever identifying
 * themselves, and on its own it grants no access to any tip's contents.
 */

/**
 * Digits 2-9 and A-Z without I, L and O — the characters people mix up when
 * reading a PIN off a screen or over the phone (0/O, 1/I/L). 31 characters.
 * A PIN issued today always mixes letters and digits (see generateTipPin),
 * which leaves about 739 million combinations.
 */
export const TIP_PIN_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export const TIP_PIN_LENGTH = 6;

/**
 * Well-formed PIN: what a PIN issued at ANY time looks like, and so what a
 * follow-up may quote. Kept in step with the `tipPins` database rules.
 */
export const TIP_PIN_PATTERN = /^[2-9A-HJKMNP-Z]{6}$/;

/** True when `value` could be a PIN this system issued, now or in the past. */
export function isValidTipPin(value: unknown): value is string {
  return typeof value === "string" && TIP_PIN_PATTERN.test(value);
}

/**
 * True when `value` is a PIN that may be issued TODAY: well-formed, with at
 * least one digit and at least one letter.
 *
 * The PIN index can be written by anyone (the intake has no identity of its
 * own), and a message that merely contains a registered PIN is filed under
 * that PIN's tip. PINs made only of letters are ordinary words ("NASSAU",
 * "STREET", "MURDER") and PINs made only of digits are ordinary numbers, so
 * someone could register those and collect other people's tips. The database
 * rules therefore refuse to register a PIN that is not mixed, and this is the
 * same test, so the intake never draws a PIN the rules would turn down.
 *
 * PINs issued before this rule (about one in six is letters only) stay valid
 * and keep working: the rule applies to new registrations only.
 */
export function isIssuableTipPin(value: unknown): value is string {
  return isValidTipPin(value) && /[2-9]/.test(value) && /[A-HJKMNP-Z]/.test(value);
}

/**
 * One random PIN that may be issued today, drawn uniformly from all of them.
 * randomInt rejects biased samples rather than taking a modulus, so every
 * character is equally likely; a draw that is all letters or all digits (about
 * one in six) is thrown away whole and drawn again, which keeps every
 * remaining PIN equally likely.
 */
export function generateTipPin(): string {
  for (;;) {
    let pin = "";
    for (let i = 0; i < TIP_PIN_LENGTH; i += 1) {
      pin += TIP_PIN_ALPHABET[randomInt(TIP_PIN_ALPHABET.length)];
    }
    if (isIssuableTipPin(pin)) return pin;
  }
}

/** At most this many candidates are looked up, so a long message cannot fan out. */
export const TIP_PIN_MAX_CANDIDATES = 10;

const CANDIDATE_PATTERN = /\b[2-9A-HJKMNP-Z]{6}\b/g;

/**
 * PIN-shaped tokens in a message, in the order they appear, uppercased and
 * de-duplicated.
 *
 * Tipsters are told to start a follow-up with their PIN, but they write things
 * like "Hi, my pin is 623KUK" — so this scans the whole message rather than
 * only the first word.
 *
 * Being PIN-shaped means nothing on its own: the alphabet is ordinary letters
 * and digits, so a genuine new tip opening "PARKED outside the store" yields
 * the candidate "PARKED". Only a lookup against the issued PINs can tell the
 * two apart, which is why callers must check each candidate before threading.
 *
 * This deliberately still returns letters-only and digits-only tokens,
 * although no such PIN is issued any more: PINs issued earlier look like that
 * and their tipsters must still be able to follow up.
 */
export function findTipPinCandidates(message: string): string[] {
  const seen = new Set<string>();
  for (const match of message.toUpperCase().matchAll(CANDIDATE_PATTERN)) {
    seen.add(match[0]);
    if (seen.size >= TIP_PIN_MAX_CANDIDATES) break;
  }
  return [...seen];
}
