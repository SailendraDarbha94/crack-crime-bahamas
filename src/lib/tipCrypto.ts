import CryptoES from "crypto-es";

// Browser-side helpers for the tip cipher — what /api/message writes and what
// the admin inbox has always done to read it, in one place so the police
// portal reads tips the same way.
//
// The key matches the server's TIP_ENCRYPTION_KEY fallback and the mobile app
// until the rotation deferred in FIREBASE_ROLLOUT.md. It already ships in this
// bundle, so the database rules, not this key, are what keep tips from the
// wrong eyes.
export const TIP_KEY = "ebiz242";

export type CipherRecord = { message?: unknown; encrypted?: boolean };

/**
 * True when the stored message is ciphertext: either a server-encrypted string
 * (flagged `encrypted`) or a 2024 app cipher object. Anything else is a legacy
 * plaintext tip.
 */
export const isCipher = (record: CipherRecord): boolean =>
  record.encrypted === true || typeof record.message !== "string";

// The most a stored byte array may hold: far more than the longest tip, far
// less than would trouble a browser.
const MAX_CIPHER_WORDS = 20000;

/** A byte array as crypto-es stores one, whose claimed size fits what it holds. */
const isWordArray = (part: unknown): boolean => {
  const array = part as { words?: unknown; sigBytes?: unknown } | null;
  return (
    !!array &&
    Array.isArray(array.words) &&
    array.words.length <= MAX_CIPHER_WORDS &&
    Number.isInteger(array.sigBytes) &&
    (array.sigBytes as number) >= 0 &&
    (array.sigBytes as number) <= 4 * array.words.length
  );
};

/**
 * True when an object-form message (what the 2024 app stored) is shaped like a
 * real cipher. The rules accept ANY object as a tip's message, for the sake of
 * those older tips, and crypto-es trusts the sizes an object claims: one
 * claiming a salt of a thousand million million bytes sends the key derivation
 * into a loop that never ends, freezing the page for whoever opens the inbox.
 * Nothing shaped like that is handed to the cipher.
 */
export const isSaneCipherObject = (message: unknown): boolean => {
  const cipher = message as Record<string, unknown> | null;
  return (
    !!cipher &&
    typeof cipher === "object" &&
    isWordArray(cipher.ciphertext) &&
    (cipher.salt === undefined || isWordArray(cipher.salt)) &&
    (cipher.iv === undefined || isWordArray(cipher.iv))
  );
};

/** Plaintext of a stored tip, follow-up or note, or `unreadable` if it cannot be read. */
export function readTipText(
  record: CipherRecord,
  unreadable = "[Could not decrypt this message]"
): string {
  if (!isCipher(record)) return String(record.message ?? "");
  if (typeof record.message !== "string" && !isSaneCipherObject(record.message)) return unreadable;
  try {
    const text = CryptoES.AES.decrypt(record.message as any, TIP_KEY).toString(CryptoES.enc.Utf8);
    return text || unreadable;
  } catch (err) {
    console.error("Failed to decrypt tip:", err);
    return unreadable;
  }
}

/** Ciphertext for new text written from the browser, such as a note to officers. */
export const encryptText = (text: string): string =>
  CryptoES.AES.encrypt(text, TIP_KEY).toString();
