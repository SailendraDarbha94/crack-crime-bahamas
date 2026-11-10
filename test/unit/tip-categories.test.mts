/**
 * Unit tests for the tip category and source helpers (npm run test:unit).
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import CryptoES from "crypto-es";
import {
  NO_ANALYTICS_MARKER,
  TIP_FORM_PATH,
  analyticsAllowedOn,
  analyticsMayStart,
  fullLoadTarget,
  isSamePageLink,
} from "../../src/lib/analyticsPolicy.ts";
import {
  MAX_CATEGORY_OTHER_LENGTH,
  OTHER_CATEGORY_ID,
  SOURCE_LABELS,
  TIP_CATEGORIES,
  TIP_SOURCES,
  categoryLabel,
  isKnownCategory,
  missingCategoryField,
  normaliseCategory,
  sourceOf,
  storedLabelFields,
  wellFormedText,
} from "../../src/lib/tipCategories.ts";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `   (${detail})` : ""}`);
  if (!ok) failures += 1;
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// --- the list itself ---------------------------------------------------------
const ids = TIP_CATEGORIES.map((c) => c.id);
check("the list has the twelve categories the chairman asked for", TIP_CATEGORIES.length === 12);
check("ids are unique", new Set(ids).size === ids.length);
check("every id is storable under the database rules (lowercase letters and underscores, at most 40)",
  ids.every((id) => /^[a-z_]+$/.test(id) && id.length <= 40), ids.join(","));
check("every category has a label", TIP_CATEGORIES.every((c) => c.label.trim().length > 0));
check("Other is on the list, and last", ids.at(-1) === OTHER_CATEGORY_ID);
check("labels read as the chairman wrote them",
  same(TIP_CATEGORIES.map((c) => c.label), ["Auto Theft", "Home Theft", "Business Theft", "Marine Theft", "Illegal Drugs",
    "Illegal Guns", "Violence Against Women", "White Collar Crime", "Human Trafficking", "Human Smuggling", "Homicide", "Other"]));

// --- what gets stored ----------------------------------------------------------
check("a known category is stored as its id", same(normaliseCategory("homicide", undefined), { category: "homicide" }));
check("a description is ignored unless the category is Other",
  same(normaliseCategory("homicide", "something"), { category: "homicide" }));
check("Other keeps its trimmed description",
  same(normaliseCategory("other", "  arson at the dock  "), { category: "other", categoryOther: "arson at the dock" }));
check("Other with a blank description is still Other", same(normaliseCategory("other", "   "), { category: "other" }));
check("Other with no description is still Other", same(normaliseCategory("other", undefined), { category: "other" }));
const long = normaliseCategory("other", "x".repeat(MAX_CATEGORY_OTHER_LENGTH + 50));
check("an over-long description is cut to the limit", long.categoryOther?.length === MAX_CATEGORY_OTHER_LENGTH);
check("a cut that lands on a space leaves no trailing space",
  normaliseCategory("other", "a".repeat(MAX_CATEGORY_OTHER_LENGTH - 1) + " b").categoryOther === "a".repeat(MAX_CATEGORY_OTHER_LENGTH - 1));
check("a description that is not text is dropped", same(normaliseCategory("other", { a: 1 }), { category: "other" }));

// Half an emoji makes the cipher throw, which would cost the whole tip.
const encrypts = (text: string) => {
  try {
    return CryptoES.AES.decrypt(CryptoES.AES.encrypt(text, "k").toString(), "k").toString(CryptoES.enc.Utf8) === text;
  } catch {
    return false;
  }
};
check("(the cipher really does throw on half an emoji)", !encrypts("abc\uD83D"));
check("wellFormedText leaves ordinary text and whole emoji alone",
  wellFormedText("Bay St \u{1F6A8} caf\u00e9") === "Bay St \u{1F6A8} caf\u00e9" && wellFormedText("") === "");
check("wellFormedText replaces a lone surrogate, wherever it is",
  wellFormedText("abc\uD83D") === "abc\uFFFD" && wellFormedText("\uDEA8abc") === "\uFFFDabc" && wellFormedText("a\uD83Db") === "a\uFFFDb");
check("...and what it returns can always be encrypted",
  encrypts(wellFormedText("abc\uD83D")) && encrypts(wellFormedText("\uDEA8\uD83D\uD83D\uDEA8")));
const emojiHeavy = normaliseCategory("other", "x" + "\u{1F6A8}".repeat(150)).categoryOther ?? "";
check("an Other description is cut by character, never through the middle of an emoji",
  Array.from(emojiHeavy).length === MAX_CATEGORY_OTHER_LENGTH && emojiHeavy === wellFormedText(emojiHeavy) && encrypts(emojiHeavy) && emojiHeavy.endsWith("\u{1F6A8}"));
check("an Other description holding half an emoji is repaired, not refused",
  encrypts(normaliseCategory("other", "arson \uD83D").categoryOther ?? "\uD83D"));

// A tip must never be lost over its label: nothing here throws or rejects.
check("no category (older app versions) stores nothing", same(normaliseCategory(undefined, undefined), {}));
check("an unrecognised id stores nothing", same(normaliseCategory("arson", "x"), {}));
check("a label instead of an id stores nothing", same(normaliseCategory("Auto Theft", undefined), {}));
check("a non-string category stores nothing",
  same(normaliseCategory(7, undefined), {}) && same(normaliseCategory(null, undefined), {}) && same(normaliseCategory({}, undefined), {}));
check("isKnownCategory agrees", isKnownCategory("marine_theft") && !isKnownCategory("Marine Theft") && !isKnownCategory(undefined));

// --- labels ------------------------------------------------------------------------
check("a known id shows its label", categoryLabel("violence_against_women") === "Violence Against Women");
check("a tip with no category shows Not specified",
  categoryLabel(undefined) === "Not specified" && categoryLabel(null) === "Not specified" && categoryLabel("") === "Not specified");
check("a retired id still shows as words", categoryLabel("vehicle_arson") === "Vehicle Arson");
check("a non-string never throws", categoryLabel(42) === "Not specified");

// --- source --------------------------------------------------------------------------
check("the three sources", same([...TIP_SOURCES], ["text", "web", "call"]));
check("labels are the chairman's words", same(SOURCE_LABELS, { text: "Text", web: "Web", call: "Call" }));
check("a stored source is kept", sourceOf("web") === "web" && sourceOf("call") === "call" && sourceOf("text") === "text");
check("a tip stored before the flag has no source, and none is guessed",
  sourceOf(undefined) === null && sourceOf(null) === null);
check("anything unexpected is not a source", sourceOf("email") === null && sourceOf(1) === null && sourceOf("") === null);

// --- what the forms insist on -----------------------------------------------------------
check("a form with no category is told to choose one",
  missingCategoryField("", "") === "category" && missingCategoryField(undefined, undefined) === "category");
check("a category not on the list does not count as chosen", missingCategoryField("arson", "x") === "category");
check("a listed category needs nothing more", missingCategoryField("homicide", "") === null);
check("Other needs its description",
  missingCategoryField("other", "") === "other" && missingCategoryField("other", "   ") === "other" && missingCategoryField("other", undefined) === "other");
check("Other with a description is complete", missingCategoryField("other", "arson") === null);

// --- what goes onto the police copy ---------------------------------------------------------
// These mirror the policeTips rules: anything they would refuse is left off, so
// forwarding a tip can never fail because of its label.
check("category and source are copied as stored",
  same(storedLabelFields({ message: "x", category: "auto_theft", source: "web", pin: "ABCDEF" }), { category: "auto_theft", source: "web" }));
check("Other carries its encrypted description",
  same(storedLabelFields({ category: "other", category_other: "U2Fsd...", source: "call" }), { category: "other", category_other: "U2Fsd...", source: "call" }));
check("a description on a category that is not Other is left behind",
  same(storedLabelFields({ category: "homicide", category_other: "U2Fsd..." }), { category: "homicide" }));
check("a tip with no labels copies none (older tips)", same(storedLabelFields({ message: "x" }), {}));
check("a retired category id is still copied", same(storedLabelFields({ category: "vehicle_arson" }), { category: "vehicle_arson" }));
check("a malformed category is left off rather than blocking the forward",
  same(storedLabelFields({ category: "Auto Theft", source: "text" }), { source: "text" }) &&
  same(storedLabelFields({ category: "a".repeat(41) }), {}) && same(storedLabelFields({ category: 7 }), {}) && same(storedLabelFields({ category: "" }), {}));
check("an empty or oversized description is left off",
  same(storedLabelFields({ category: "other", category_other: "" }), { category: "other" }) &&
  same(storedLabelFields({ category: "other", category_other: "x".repeat(1001) }), { category: "other" }));
check("an unknown source is left off", same(storedLabelFields({ source: "email" }), {}) && same(storedLabelFields({ source: 1 }), {}));
check("nothing at all never throws", same(storedLabelFields(null), {}) && same(storedLabelFields(undefined), {}));

// --- a full-length tip fits in the database ------------------------------------------------
// The route accepts 10,000 characters of tip; what is stored is its ciphertext,
// which is longer (and longer still for accented text and emoji). The rules
// must leave room for the worst case or a long tip is refused and lost.
const MAX_TIP_LENGTH = 10000;
const cipherLength = (text: string) => CryptoES.AES.encrypt(text, "ebiz242").toString().length;
const worstCase = Math.max(
  cipherLength("a".repeat(MAX_TIP_LENGTH)),
  cipherLength("\u00e9".repeat(MAX_TIP_LENGTH)), // 2 bytes each
  cipherLength("\u20ac".repeat(MAX_TIP_LENGTH)), // 3 bytes each: the most a UTF-16 unit can cost
  cipherLength("\u{1F6A8}".repeat(MAX_TIP_LENGTH / 2)), // 4 bytes per 2 units
  cipherLength(wellFormedText("\uD83D".repeat(MAX_TIP_LENGTH))) // every unit a repaired stray
);
const rules = JSON.parse(readFileSync("database.rules.json", "utf8")).rules;
const limitIn = (rule: string) => Number(/length <= (\d+)/.exec(rule)?.[1]);
const messageLimits = [
  rules.messages.$messageId.message[".validate"],
  rules.messages.$messageId.followUps.$followUpId.message[".validate"],
  rules.policeTips.$tipId.message[".validate"],
  rules.policeTips.$tipId.followUps.$followUpId.message[".validate"],
].map(limitIn);
check("the route still caps a tip at 10,000 characters",
  /const MAX_TIP_LENGTH = 10000;/.test(readFileSync("src/app/api/message/route.ts", "utf8")));
check("the rules leave room for the ciphertext of the longest tip the route accepts",
  messageLimits.every((limit) => limit >= worstCase), `worst case ${worstCase}, limits ${messageLimits.join("/")}`);
check("tips, follow-ups and both police copies share one limit, so a stored tip can always be forwarded",
  new Set(messageLimits).size === 1, messageLimits.join("/"));
check("the PIN index only names key-shaped tip ids, as the route expects",
  /matches\(\/\^\[-_A-Za-z0-9\]\+\$\/\)/.test(rules.tipPins.$pin.tipId[".validate"]) &&
  /TIP_ID_PATTERN = \/\^\[-_A-Za-z0-9\]\{1,128\}\$\//.test(readFileSync("src/app/api/message/route.ts", "utf8")));

// --- the tip form is never tracked ---------------------------------------------------------
check("Analytics is refused on the tip form", !analyticsAllowedOn(TIP_FORM_PATH) && !analyticsAllowedOn(`${TIP_FORM_PATH}/`));
check("...however its address is spelled", !analyticsAllowedOn("/%73ubmit-tip") && !analyticsAllowedOn("/submit%2Dtip") && !analyticsAllowedOn("/%73ubmit-tip/"));
check("a malformed address does not throw", analyticsAllowedOn("/%E0%A4%A") === true);
check("...and allowed everywhere else",
  analyticsAllowedOn("/") && analyticsAllowedOn("/contact") && analyticsAllowedOn("/legal/privacy") && analyticsAllowedOn("/submit-tips"));

// A tab that has shown the form is marked, and nothing loaded in it afterwards
// starts Analytics (reload, then Back, would otherwise show the form inside a
// document where Analytics was running).
const fakeTab = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data };
};
const tab = fakeTab();
check("a fresh tab on an ordinary page may start Analytics", analyticsMayStart("/contact", tab) && tab.data.size === 0);
check("loading the tip form refuses Analytics and marks the tab",
  !analyticsMayStart(TIP_FORM_PATH, tab) && tab.data.get(NO_ANALYTICS_MARKER) === "1");
check("...and every later page load in that tab is refused too",
  !analyticsMayStart("/legal/privacy", tab) && !analyticsMayStart("/", tab) && !analyticsMayStart("/contact", tab));
check("another tab is unaffected", analyticsMayStart("/", fakeTab()));
const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
check("with storage blocked or missing, the form is still refused and nothing throws",
  !analyticsMayStart(TIP_FORM_PATH, blocked) && !analyticsMayStart(TIP_FORM_PATH, null) && analyticsMayStart("/", blocked) && analyticsMayStart("/", null));

// Every same-site link on the form leaves by a full page load.
const here = { origin: "https://example.org", pathname: TIP_FORM_PATH };
const plain = { button: 0, modified: false };
check("a menu or footer link on the form becomes a full page load",
  fullLoadTarget({ href: "https://example.org/contact" }, plain, here) === "https://example.org/contact" &&
  fullLoadTarget({ href: "/legal/privacy", target: "" }, plain, here) === "https://example.org/legal/privacy");
check("links the browser already handles outside this document are left alone",
  fullLoadTarget({ href: "tel:+12423288477" }, plain, here) === null &&
  fullLoadTarget({ href: "mailto:a@b.c" }, plain, here) === null &&
  fullLoadTarget({ href: "https://play.google.com/store" }, plain, here) === null &&
  fullLoadTarget({ href: "https://example.org/legal/privacy", target: "_blank" }, plain, here) === null &&
  fullLoadTarget({ href: "https://example.org/file.pdf", download: true }, plain, here) === null);
check("modified and non-primary clicks are left alone",
  fullLoadTarget({ href: "https://example.org/contact" }, { button: 1, modified: false }, here) === null &&
  fullLoadTarget({ href: "https://example.org/contact" }, { button: 0, modified: true }, here) === null);
check("a link to the form itself is left alone", fullLoadTarget({ href: "https://example.org/submit-tip#top" }, plain, here) === null);
// ...but a plain link to the form's own address would reload it and empty a
// half-written tip, so the page catches that click.
check("Submit a Tip pressed on the form itself is recognised, so the page is not reloaded",
  isSamePageLink({ href: "https://example.org/submit-tip" }, plain, here) && isSamePageLink({ href: "/submit-tip", target: "" }, plain, here));
check("...but not a link elsewhere, an anchor on the page, a new tab or a modified click",
  !isSamePageLink({ href: "https://example.org/contact" }, plain, here) &&
  !isSamePageLink({ href: "https://example.org/submit-tip#top" }, plain, here) &&
  !isSamePageLink({ href: "https://example.org/submit-tip", target: "_blank" }, plain, here) &&
  !isSamePageLink({ href: "https://example.org/submit-tip" }, { button: 0, modified: true }, here) &&
  !isSamePageLink({ href: "https://other.example/submit-tip" }, plain, here));
check("the form page uses it", /isSamePageLink\(link, click, here\)/.test(readFileSync("src/app/submit-tip/page.tsx", "utf8")));
check("Auth is set up without the popup/redirect support that loads a Google script on phones",
  /initializeAuth\(app, \{\s*persistence:/.test(readFileSync("src/lib/firebase.ts", "utf8")) &&
  !/popupRedirectResolver/.test(readFileSync("src/lib/firebase.ts", "utf8")));
check("the form page installs that handler and firebase.ts asks before starting Analytics",
  /fullLoadTarget\(/.test(readFileSync("src/app/submit-tip/page.tsx", "utf8")) &&
  /analyticsMayStart\(window\.location\.pathname, tabStorage\(\)\)/.test(readFileSync("src/lib/firebase.ts", "utf8")));

// Analytics starts once per page load, so the tip form is only untracked if it
// is always opened by a full page load. A next/link or router navigation to it
// from a page that had already started Analytics would report the visit; every
// link must go through TipFormLink (a plain <a>).
const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sourceFiles(join(dir, entry.name)) : /\.(ts|tsx)$/.test(entry.name) ? [join(dir, entry.name)] : []);
const clientNavigation = /<Link\b[^>]*href=\{?["'`]\/submit-tip|(push|replace|prefetch)\(\s*["'`]\/submit-tip|redirect\(\s*["'`]\/submit-tip|(push|replace|prefetch|redirect)\(\s*TIP_FORM_PATH/s;
const offenders = sourceFiles("src").filter((file) => {
  const text = readFileSync(file, "utf8");
  if (clientNavigation.test(text)) return true;
  // TIP_FORM_PATH may only be turned into a link by TipFormLink itself.
  return /<Link\b[^>]*TIP_FORM_PATH/s.test(text);
});
check("no page reaches the tip form by a client-side navigation", offenders.length === 0, offenders.join(", "));
check("TipFormLink is a plain anchor",
  /<a href=\{TIP_FORM_PATH\}/.test(readFileSync("src/components/TipFormLink.tsx", "utf8")) &&
  !/from\s+["']next\/link["']/.test(readFileSync("src/components/TipFormLink.tsx", "utf8")));
check("the tip form page asks browsers not to send its address as a referrer",
  /referrer:\s*"no-referrer"/.test(readFileSync("src/app/submit-tip/layout.tsx", "utf8")));

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nall tip-category unit checks passed");
process.exit(failures ? 1 : 0);
