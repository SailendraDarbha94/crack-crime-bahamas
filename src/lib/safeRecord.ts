/**
 * Small helpers for showing database records that anyone may have written.
 *
 * New tips are created by the public intake, which has no identity of its own,
 * so anyone can write one straight to the database. The security rules keep
 * new records to a strict shape, but the staff pages must not depend on that:
 * a record already stored, or a rule loosened by mistake, must cost at most
 * one odd-looking card, never the whole inbox. These helpers are the pieces of
 * that which have nothing to do with React.
 *
 * No imports, so the unit tests can load it.
 */

// The furthest a JavaScript Date reaches. A "time" beyond it is a number, but
// not a date: formatting it prints NaN.
const MAX_DATE_MS = 8.64e15;

const asTime = (ms: number): number => (Number.isFinite(ms) && ms > 0 && ms <= MAX_DATE_MS ? ms : 0);

/**
 * A stored time as a number of milliseconds that a Date can hold, or 0 when
 * it is not one. 0 always means "not known": show "date unknown" for it.
 */
export function timeOf(stored: unknown): number {
  if (typeof stored === "number") return asTime(stored);
  if (typeof stored === "string" && stored.length <= 64) {
    // Some older records hold a date string rather than a number.
    return asTime(/^\d{1,16}$/.test(stored) ? Number(stored) : Date.parse(stored));
  }
  return 0;
}

/**
 * How far ahead of the viewer's clock a stored time may be before it is
 * someone's invention: a day and a little.
 *
 * It is this wide on purpose. The stored times come from other clocks (the
 * intake server's, the database's, another admin's browser), and the clock
 * they are compared with is the one in the browser of whoever is looking. An
 * office PC that runs ten minutes slow, or is set to the wrong time zone,
 * must not see every new tip as "from the future" and put it at the bottom of
 * the inbox. A day is also the furthest ahead the rules let a new tip be
 * stamped.
 *
 * The price: a tip written straight to the database and stamped a day ahead
 * sits above genuine tips until that time has passed, where one stamped "now"
 * would be overtaken by the next genuine tip. Nothing is hidden (the card
 * shows its date, and the list can be paged through), and the cure for that
 * is the database's own clock, not a narrower allowance here.
 */
export const FUTURE_ALLOWANCE_MS = 24 * 60 * 60 * 1000 + 5 * 60 * 1000;

/**
 * For ORDERING a "most recent first" list: the latest of the stored times that
 * is not in the future, or 0 when there is none.
 *
 * A time further ahead than the allowance is not a time anything happened.
 * It is passed over, not capped: capped to "now" it would still beat every
 * real record on every load, so a tip stamped with next year's date would sit
 * at the top of the inbox until then. Passed over, the record is ordered by
 * its other, real times, and by nothing (last) if it has none. What a card
 * SHOWS as the date is a separate matter and is not changed by this.
 */
export function latestNotFuture(times: Iterable<unknown>, now: number = Date.now()): number {
  const limit = now + FUTURE_ALLOWANCE_MS;
  let latest = 0;
  for (const stored of times) {
    const time = timeOf(stored);
    if (time <= limit && time > latest) latest = time;
  }
  return latest;
}

/**
 * The records under a node, as [id, record] pairs. A node whose children are
 * all numbered comes back from the database as a list, with gaps where an id
 * is unused: those are skipped and each record keeps its own number as its id.
 * Nothing that is not a map or a list has records.
 */
export function recordsOf<T = unknown>(node: unknown): [string, T][] {
  if (node === null || typeof node !== "object") return [];
  const records: [string, T][] = [];
  for (const id of Object.keys(node)) {
    const record = (node as Record<string, unknown>)[id];
    if (record !== null && record !== undefined) records.push([id, record as T]);
  }
  return records;
}

/**
 * The latest of a list of stored times, or `fallback` when there is none.
 *
 * A loop on purpose. `Math.max(...times)` passes every entry as an argument,
 * and past roughly a hundred thousand of them the engine throws: one tip
 * stuffed with follow-ups used to blank the whole inbox that way.
 */
export function latestOf(times: Iterable<unknown>, fallback = 0): number {
  let latest = fallback;
  for (const stored of times) {
    const time = timeOf(stored);
    if (time > latest) latest = time;
  }
  return latest;
}

/**
 * The follow-ups stored on a tip, as [id, entry] pairs. Only a real map of
 * objects counts: `followUps` stored as a string would otherwise be read one
 * character at a time, as that many "messages".
 */
export function followUpEntries(followUps: unknown): [string, Record<string, unknown>][] {
  if (followUps === null || typeof followUps !== "object") return [];
  const entries: [string, Record<string, unknown>][] = [];
  for (const [id, entry] of Object.entries(followUps as Record<string, unknown>)) {
    if (entry !== null && typeof entry === "object" && !Array.isArray(entry)) {
      entries.push([id, entry as Record<string, unknown>]);
    }
  }
  return entries;
}

/**
 * How many of a tip's later messages a card draws to begin with. The earlier
 * ones are brought in when asked for (see useShownFollowUps.ts).
 */
export const MAX_FOLLOW_UPS_SHOWN = 100;

/**
 * The newest `limit` items of a list sorted oldest first, and how many older
 * ones were left out. A real conversation is a handful of messages; a tip
 * carrying tens of thousands is an attempt to freeze the page that draws it.
 */
export function newestOnly<T>(sortedOldestFirst: T[], limit = MAX_FOLLOW_UPS_SHOWN): { shown: T[]; hidden: number } {
  const hidden = Math.max(0, sortedOldestFirst.length - limit);
  return { shown: hidden ? sortedOldestFirst.slice(hidden) : sortedOldestFirst, hidden };
}

/** Text safe to put on a page: a string as it is, anything else as nothing. */
export function textOf(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * `textOf`, cut to `max` characters with an ellipsis. For a field that is
 * meant to be a name or a label: a megabyte stored there must not be drawn.
 */
export function shortText(value: unknown, max = 200, fallback = ""): string {
  const text = textOf(value, fallback);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
