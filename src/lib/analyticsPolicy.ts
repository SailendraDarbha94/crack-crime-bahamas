/**
 * Where Google Analytics must never run.
 *
 * The tip form is the one page where a visit is itself sensitive: someone is
 * about to report a crime. Nothing about that visit is reported to Google
 * Analytics.
 *
 * Analytics is started once per document, when the site's JavaScript first
 * loads (see firebase.ts), and then follows every client-side navigation in
 * that document. So the tip form must never be shown inside a document where
 * Analytics is running. Three things together guarantee that:
 *
 * 1. A document that loads on the tip form never starts Analytics.
 * 2. Every link INTO the form is a full page load (TipFormLink, a plain <a>),
 *    never next/link or router.push, so the form always gets a document of
 *    its own. test/unit/tip-categories.test.mts fails if such a link is added.
 * 3. Once a tab has loaded the form, it is marked, and no later document in
 *    that tab starts Analytics either. Without this, leaving the form by a
 *    client-side link, reloading, and pressing Back would show the form
 *    inside a freshly loaded document that had started Analytics. The form
 *    page also makes every link OUT of it a full page load, so the mark is
 *    not the only thing standing between Back and that case.
 *
 * No imports, so the unit tests can load it.
 */

export const TIP_FORM_PATH = "/submit-tip";

const NO_ANALYTICS_PATHS: readonly string[] = [TIP_FORM_PATH];

/** Session-storage key marking a tab that has shown the tip form. */
export const NO_ANALYTICS_MARKER = "ccb-no-analytics";

export function analyticsAllowedOn(pathname: string): boolean {
  // The server answers a percent-encoded spelling of a path with the same
  // page, while the browser reports the address as typed: compare decoded.
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Not valid encoding: no page is served for it, compare as given.
  }
  return ![pathname, decoded].some((candidate) =>
    NO_ANALYTICS_PATHS.some((path) => candidate === path || candidate.startsWith(`${path}/`))
  );
}

type TabStorage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/**
 * Whether Analytics may start in a document that has just loaded on
 * `pathname`. Marks the tab when that document is the tip form. `storage` is
 * the tab's sessionStorage, or null where the browser refuses it; then the
 * path alone decides.
 */
export function analyticsMayStart(pathname: string, storage: TabStorage | null): boolean {
  const onTipForm = !analyticsAllowedOn(pathname);
  let marked = false;
  try {
    if (onTipForm) storage?.setItem(NO_ANALYTICS_MARKER, "1");
    marked = storage?.getItem(NO_ANALYTICS_MARKER) === "1";
  } catch {
    // Storage full or blocked: fall back to the path.
  }
  return !onTipForm && !marked;
}

/**
 * Where a click on `link` should go by a full page load when the visitor is
 * on the tip form, or null to leave the click alone. Used by the form page
 * for every same-site link on it (menu, footer), so that no other page ever
 * shares the form's document. Clicks the browser would not treat as a plain
 * navigation in this tab (new tab, download, another site, tel: and mailto:)
 * are left alone.
 */
export function fullLoadTarget(
  link: { href: string; target?: string; download?: boolean },
  click: { button: number; modified: boolean },
  here: { origin: string; pathname: string }
): string | null {
  if (click.button !== 0 || click.modified) return null;
  if (link.download || (link.target && link.target !== "_self")) return null;
  let url: URL;
  try {
    url = new URL(link.href, here.origin);
  } catch {
    return null;
  }
  if (url.origin !== here.origin || url.pathname === here.pathname) return null;
  return url.href;
}

/**
 * True for a plain click on a link to the page the visitor is already on (the
 * "Submit a Tip" entries in the menu and footer, seen from the form). Left to
 * the browser, a plain <a> to the current address reloads the page, which
 * would empty a half-written tip without sending it. Links that only move to
 * an anchor on the page are not counted.
 */
export function isSamePageLink(
  link: { href: string; target?: string; download?: boolean },
  click: { button: number; modified: boolean },
  here: { origin: string; pathname: string }
): boolean {
  if (click.button !== 0 || click.modified) return false;
  if (link.download || (link.target && link.target !== "_self")) return false;
  try {
    const url = new URL(link.href, here.origin);
    return url.origin === here.origin && url.pathname === here.pathname && !url.hash;
  } catch {
    return false;
  }
}
