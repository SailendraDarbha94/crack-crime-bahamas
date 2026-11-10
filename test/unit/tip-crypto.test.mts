/**
 * Unit tests for the browser-side tip cipher helpers (npm run test:unit).
 */

import CryptoES from "crypto-es";
import { encryptText, isCipher, isSaneCipherObject, readTipText, TIP_KEY } from "../../src/lib/tipCrypto.ts";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};

// The three shapes that exist in production /messages today.
const serverEncrypted = { message: CryptoES.AES.encrypt("from the website", TIP_KEY).toString(), encrypted: true };
const legacyPlain = { message: "plain text from 2024" };
const appObject = { message: JSON.parse(JSON.stringify(CryptoES.AES.encrypt("from the 2024 app", TIP_KEY))) };

check("server-encrypted string is recognised as cipher", isCipher(serverEncrypted));
check("legacy plaintext is not treated as cipher", !isCipher(legacyPlain));
check("2024 app cipher object is recognised as cipher", isCipher(appObject));

check("reads a server-encrypted tip", readTipText(serverEncrypted) === "from the website");
check("passes legacy plaintext through unchanged", readTipText(legacyPlain) === "plain text from 2024");
check("reads a 2024 app cipher object", readTipText(appObject) === "from the 2024 app");

// A note written from the admin's browser must round-trip through the same
// reader the police page uses.
const note = "Officer: the van was seen again on Bay Street, urgent.";
const stored = encryptText(note);
check("a browser-encrypted note is not stored in the clear", !stored.includes("Bay Street"));
check("and reads back exactly", readTipText({ message: stored, encrypted: true }) === note);

// A real ciphertext sealed with a different key. It has to be a fixed, salted
// one: text with no salt in it (the old "not-really-ciphertext") is decrypted
// under a key crypto-es derives from a RANDOM salt, so about one read in 250
// came out as a few stray readable characters instead of failing, and this
// test with it.
const sealedWithAnotherKey = "U2FsdGVkX18oyZXaJFKEw+CRTLMbtLo1zgml2zaQLv4FJ+D7j/ea6/rz1XhSA9wN";
check("(that ciphertext is genuine: it opens with its own key)",
  CryptoES.AES.decrypt(sealedWithAnotherKey, "not-the-tip-key").toString(CryptoES.enc.Utf8) === "sealed with another key");
check("unreadable ciphertext yields the marker, not a throw",
  readTipText({ message: sealedWithAnotherKey, encrypted: true }) === "[Could not decrypt this message]");
check("the marker text can be chosen by the caller",
  readTipText({ message: sealedWithAnotherKey, encrypted: true }, "") === "");
check("...every time",
  Array.from({ length: 500 }, () => readTipText({ message: sealedWithAnotherKey, encrypted: true }, "")).every((text) => text === ""));
// --- an object-form message that is not really a cipher ------------------------------
// The rules accept any object as a tip's message (the 2024 app stored cipher
// objects), anyone can create a tip, and crypto-es believes the sizes an object
// claims. A claimed salt of a thousand million million bytes makes the key
// derivation loop until the browser tab dies: one such record froze the inbox
// for every admin. It must be turned away before the cipher sees it.
const hang = { message: { ciphertext: { words: [0, 0, 0, 0], sigBytes: 16 }, salt: { words: [0], sigBytes: 1e15 } } };
const started = Date.now();
check("a cipher object claiming an impossible size reads as unreadable",
  readTipText(hang) === "[Could not decrypt this message]" && readTipText(hang, "") === "");
check("...at once, without being handed to the cipher", Date.now() - started < 200, `${Date.now() - started} ms`);
check("the 2024 app's cipher objects are still recognised as sane, and still read",
  isSaneCipherObject(appObject.message) && readTipText(appObject) === "from the 2024 app");
for (const [why, message] of Object.entries({
  "a claimed size larger than the data": { ciphertext: { words: [1, 2], sigBytes: 9 } },
  "a negative size": { ciphertext: { words: [1, 2], sigBytes: -1 } },
  "a size that is not a whole number": { ciphertext: { words: [1, 2], sigBytes: 1.5 } },
  "a size that is not a number": { ciphertext: { words: [1, 2], sigBytes: "8" } },
  "words that are not a list": { ciphertext: { words: { length: 2 }, sigBytes: 8 } },
  "no ciphertext at all": { salt: { words: [1, 2], sigBytes: 8 } },
  "an impossible iv": { ciphertext: { words: [1, 2], sigBytes: 8 }, iv: { words: [1], sigBytes: 1e9 } },
  "an absurdly long ciphertext": { ciphertext: { words: new Array(20001).fill(0), sigBytes: 80004 } },
  "an empty object": {},
  "a list": [1, 2, 3],
})) {
  check(`not a sane cipher: ${why}`, !isSaneCipherObject(message) && readTipText({ message }, "<<no>>") === "<<no>>");
}
check("not a sane cipher: nothing", !isSaneCipherObject(null) && !isSaneCipherObject(undefined) && !isSaneCipherObject("text") && !isSaneCipherObject(7));

// A record with no message at all is malformed (the rules require one). It is
// treated as unreadable cipher, exactly as the old inbox did, not as empty text.
check("an absent message yields the unreadable marker, as the old inbox did",
  readTipText({}) === "[Could not decrypt this message]");

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall tip-crypto unit checks passed");
process.exit(failures ? 1 : 0);
