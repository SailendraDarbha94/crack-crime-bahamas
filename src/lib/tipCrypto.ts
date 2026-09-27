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

/** Plaintext of a stored tip, follow-up or note, or `unreadable` if it cannot be read. */
export function readTipText(
  record: CipherRecord,
  unreadable = "[Could not decrypt this message]"
): string {
  if (!isCipher(record)) return String(record.message ?? "");
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
