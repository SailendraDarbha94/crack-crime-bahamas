/**
 * Unit tests for the browser-side tip cipher helpers (npm run test:unit).
 */

import CryptoES from "crypto-es";
import { encryptText, isCipher, readTipText, TIP_KEY } from "../../src/lib/tipCrypto.ts";

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

check("unreadable ciphertext yields the marker, not a throw",
  readTipText({ message: "not-really-ciphertext", encrypted: true }) === "[Could not decrypt this message]");
check("the marker text can be chosen by the caller",
  readTipText({ message: "not-really-ciphertext", encrypted: true }, "") === "");
// A record with no message at all is malformed (the rules require one). It is
// treated as unreadable cipher, exactly as the old inbox did, not as empty text.
check("an absent message yields the unreadable marker, as the old inbox did",
  readTipText({}) === "[Could not decrypt this message]");

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall tip-crypto unit checks passed");
process.exit(failures ? 1 : 0);
