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
 * reading a PIN off a screen or over the phone (0/O, 1/I/L). 31 characters,
 * so a 6-character PIN has 31^6 ≈ 887 million combinations.
 */
export const TIP_PIN_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export const TIP_PIN_LENGTH = 6;

/** Well-formed PIN. Kept in step with the `tipPins` database rules. */
export const TIP_PIN_PATTERN = /^[2-9A-HJKMNP-Z]{6}$/;

/**
 * One random PIN, drawn uniformly — randomInt rejects biased samples rather
 * than taking a modulus, so every character is equally likely.
 */
export function generateTipPin(): string {
  let pin = "";
  for (let i = 0; i < TIP_PIN_LENGTH; i += 1) {
    pin += TIP_PIN_ALPHABET[randomInt(TIP_PIN_ALPHABET.length)];
  }
  return pin;
}

/** True when `value` could be a PIN this system issued. */
export function isValidTipPin(value: unknown): value is string {
  return typeof value === "string" && TIP_PIN_PATTERN.test(value);
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
 */
export function findTipPinCandidates(message: string): string[] {
  const seen = new Set<string>();
  for (const match of message.toUpperCase().matchAll(CANDIDATE_PATTERN)) {
    seen.add(match[0]);
    if (seen.size >= TIP_PIN_MAX_CANDIDATES) break;
  }
  return [...seen];
}
