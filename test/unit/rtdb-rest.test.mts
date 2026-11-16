/**
 * Unit tests for building database REST URLs (npm run test:unit).
 */

import { rtdbRestUrl, RtdbRestError } from "../../src/lib/rtdbRest.ts";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};

const withBase = (base: string | undefined, run: () => void) => {
  const before = process.env.NEXT_PUBLIC_DATABASE_URL;
  if (base === undefined) delete process.env.NEXT_PUBLIC_DATABASE_URL;
  else process.env.NEXT_PUBLIC_DATABASE_URL = base;
  try { run(); } finally {
    if (before === undefined) delete process.env.NEXT_PUBLIC_DATABASE_URL;
    else process.env.NEXT_PUBLIC_DATABASE_URL = before;
  }
};

withBase("https://example-default-rtdb.asia-southeast1.firebasedatabase.app/", () => {
  check("a node", rtdbRestUrl("messages") === "https://example-default-rtdb.asia-southeast1.firebasedatabase.app/messages.json");
  check("a child, with stray slashes ignored", rtdbRestUrl("/messages/-Abc_123/") === "https://example-default-rtdb.asia-southeast1.firebasedatabase.app/messages/-Abc_123.json");
  check("the root", rtdbRestUrl("") === "https://example-default-rtdb.asia-southeast1.firebasedatabase.app/.json");
  check("the caller's token goes in the query", rtdbRestUrl("admins/u1", "a.b.c") === "https://example-default-rtdb.asia-southeast1.firebasedatabase.app/admins/u1.json?auth=a.b.c");

  // A key read back from the database is not to be trusted with the URL.
  const up = new URL(rtdbRestUrl("messages/%2e%2e/admins")!);
  check("a key spelled %2e%2e stays a key: the request does not climb to another node",
    up.pathname === "/messages/%252e%252e/admins.json", up.pathname);
  check("...nor one doubly encoded", new URL(rtdbRestUrl("messages/%252e%252e/x")!).pathname === "/messages/%25252e%25252e/x.json");
  const odd = new URL(rtdbRestUrl("messages/a b?c=d&auth=evil#frag")!);
  check("a key cannot add a query, a fragment or a second token",
    odd.pathname === "/messages/a%20b%3Fc%3Dd%26auth%3Devil%23frag.json" && odd.search === "" && odd.hash === "", odd.href);
  const withToken = new URL(rtdbRestUrl("messages/x?auth=evil", "real.token.here")!);
  check("...and the real token is the only one sent", withToken.searchParams.getAll("auth").join("|") === "real.token.here");
  check("keys with other characters are encoded, not dropped",
    new URL(rtdbRestUrl("users/Zo\u00eb & co")!).pathname === "/users/Zo%C3%AB%20%26%20co.json");
});

withBase("http://127.0.0.1:9100?ns=demo-ccb-default-rtdb", () => {
  const url = new URL(rtdbRestUrl("messages/-Abc", "tok.en.x")!);
  check("the emulator's namespace is kept beside the token",
    url.origin === "http://127.0.0.1:9100" && url.pathname === "/messages/-Abc.json" && url.searchParams.get("ns") === "demo-ccb-default-rtdb" && url.searchParams.get("auth") === "tok.en.x");
});

withBase(undefined, () => {
  check("no database URL configured: no URL", rtdbRestUrl("messages") === null);
});

check("a refused write says so", new RtdbRestError(401).denied && new RtdbRestError(403).denied);
check("a database error is not a refusal", !new RtdbRestError(500).denied && !new RtdbRestError(503).denied && !new RtdbRestError(400).denied);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall REST URL unit checks passed");
process.exit(failures ? 1 : 0);
