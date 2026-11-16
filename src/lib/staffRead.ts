/**
 * Reading the database from a staff page (browser only).
 *
 * The pages for admins and officers used to read with the Firebase SDK's
 * `get()`. The SDK walks whatever it receives calling `obj.hasOwnProperty`, so
 * one record anywhere in a node that holds a key of that name makes the whole
 * read reject: a single hostile tip could stop the inbox loading for everyone.
 * It also builds values by plain assignment, which turns a "__proto__" child
 * into a prototype (see ownData.ts), and it has no timeout.
 *
 * `readAsStaff` asks the database's REST API instead, as the signed-in member
 * of staff (the same security rules apply), parses the reply as plain JSON,
 * and returns it through `ownData`. Nothing in a record can make that fail.
 *
 * Use it for every node that people outside the staff can write: /messages,
 * /policeTips (copied from tips), /users, /notifications_register. Writes
 * still go through the SDK.
 */
import { auth } from "./firebase";
import { ownData, ownRecords } from "./ownData";
import { rtdbRestUrl } from "./rtdbRest";

/** A read that the database turned down or that never got an answer. */
export class StaffReadError extends Error {
  constructor(
    message: string,
    /** HTTP status from the database, or null when there was no answer. */
    public readonly status: number | null = null
  ) {
    super(message);
    this.name = "StaffReadError";
  }
}

// Long enough for a large node on a slow line, short enough that a page shows
// "could not load" instead of a spinner that never ends.
const READ_TIMEOUT_MS = 30000;

/**
 * The value at `path`, or null when nothing is stored there. `path` is the
 * plain database path ("messages", "messages/<id>"): keys are encoded for you.
 *
 * Pass `{ records: true }` when the node is a set of records keyed by id (all
 * of /messages, /policeTips, /users, /notifications_register...): every record
 * is then kept whatever its id is, so one stored under "hasOwnProperty" or
 * "__proto__" is still listed and can be deleted (see `ownRecords`). Without
 * it those two names are dropped wherever they appear, which is what a single
 * record needs.
 *
 * Throws a StaffReadError when nobody is signed in, the rules refuse the read,
 * or the database cannot be reached in time.
 */
export async function readAsStaff<T = any>(path: string, options: { records?: boolean } = {}): Promise<T | null> {
  // The page may ask before the saved sign-in has been restored.
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new StaffReadError("Not signed in.");

  // One retry with a fresh token: the first may have expired a moment ago.
  for (const forceFreshToken of [false, true]) {
    const url = rtdbRestUrl(path, await user.getIdToken(forceFreshToken));
    if (!url) throw new StaffReadError("NEXT_PUBLIC_DATABASE_URL is not set.");

    // An AbortController and a timer, not AbortSignal.timeout(): that only
    // exists in browsers from 2022 on, and where it is missing the call throws
    // before any request is made, so no staff page could load at all (an iPad
    // that stops at iOS 15, say). The timer runs until the whole answer has
    // been read, so a reply that stalls half way is cut off as well.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);
    try {
      let res: Response;
      try {
        res = await fetch(url, { cache: "no-store", signal: controller.signal });
      } catch {
        // Deliberately not the caught error: its message can contain the URL,
        // and the URL carries the token.
        throw new StaffReadError(`Could not reach the database to read ${path}.`);
      }
      if ((res.status === 401 || res.status === 403) && !forceFreshToken) continue;
      if (!res.ok) throw new StaffReadError(`Could not read ${path} (HTTP ${res.status}).`, res.status);

      let parsed: unknown;
      try {
        parsed = JSON.parse(await res.text());
      } catch {
        throw new StaffReadError(`The database's answer for ${path} could not be understood.`, res.status);
      }
      return (options.records ? ownRecords(parsed) : ownData(parsed)) as T | null;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new StaffReadError(`Could not read ${path}.`);
}
