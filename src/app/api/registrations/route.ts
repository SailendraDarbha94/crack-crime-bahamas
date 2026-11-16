import app from "@/lib/firebase";
import { ownData } from "@/lib/ownData";
import { getDatabase, ref, set, update } from "firebase/database";

// Mobile-app device registration endpoints (create + location refresh).
// Both remain public because the app calls them anonymously; the database
// rules permit public create/update on /notifications_register/$token but
// deny public reads and deletes.
//
// The GET handler (returned every device's push token, model and GPS
// coordinates to any caller) and the DELETE handler were removed — the
// admin notifications page now reads and deletes as an authed admin
// directly against the database.
//
// Anyone can call these, so nothing in the request is trusted. The token is
// checked before it is used as a database path, and what is stored is a
// cleaned copy of the body, never the body itself.

/**
 * The only shape a token may have: it is what the app sends (the part of an
 * Expo push token between the brackets) and it becomes part of the database
 * path. A "/" in it would write inside another device's record, and any of
 * . # $ [ ] makes the SDK throw before anything is tried.
 */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

// The database rules accept a device record only within these limits. A real
// phone with one odd field should still register, so anything beyond them is
// trimmed or left out here rather than letting the whole write be refused.
/** How many levels below the record a value may sit. */
const MAX_DEPTH = 4;
/** The longest text the rules accept. */
const MAX_TEXT = 500;

/** Characters the database does not allow in the name of a child. */
const ILLEGAL_IN_KEY = /[.#$\/\[\]]/;

type Stored = string | number | boolean | Stored[] | { [key: string]: Stored };

function legalKey(key: string): boolean {
  if (key.length === 0 || key.length > 200 || ILLEGAL_IN_KEY.test(key)) return false;
  for (let i = 0; i < key.length; i += 1) {
    const code = key.charCodeAt(i);
    // Control characters are refused by the database as well.
    if (code < 32 || code === 127) return false;
  }
  return true;
}

function clipped(text: string): string {
  if (text.length <= MAX_TEXT) return text;
  const cut = text.slice(0, MAX_TEXT);
  // Do not leave half of a two-part character (an emoji in a device name)
  // at the end.
  const last = cut.charCodeAt(cut.length - 1);
  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
}

/**
 * The part of `value` that the database will take, or undefined when there is
 * none. `depth` is how far below the record the value sits. Pass something
 * that has been through `ownData`: this copies by plain assignment.
 *
 * Empty lists and objects are left out too. The database stores nothing for
 * them anyway, and in an update one at the top would delete the field that is
 * already stored.
 */
function storable(value: unknown, depth: number): Stored | undefined {
  if (typeof value === "string") return clipped(value);
  // JSON cannot say NaN, but "1e999" parses as Infinity and the SDK refuses it.
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return value;
  if (value === null || typeof value !== "object" || depth >= MAX_DEPTH) return undefined;

  if (Array.isArray(value)) {
    const items: Stored[] = [];
    for (const item of value) {
      const kept = storable(item, depth + 1);
      if (kept !== undefined) items.push(kept);
    }
    return items.length ? items : undefined;
  }

  const copy: { [key: string]: Stored } = {};
  let hasFields = false;
  for (const [key, child] of Object.entries(value)) {
    if (!legalKey(key)) continue;
    const kept = storable(child, depth + 1);
    if (kept === undefined) continue;
    copy[key] = kept;
    hasFields = true;
  }
  return hasFields ? copy : undefined;
}

/**
 * The token and the record to store for a request, or null when the request
 * is not a registration at all (answered with 400).
 */
async function registration(
  req: Request
): Promise<{ token: string; record: { [key: string]: Stored } } | null> {
  try {
    // ownData drops the keys "__proto__" and "hasOwnProperty" at every depth:
    // a record holding either cannot be read back by the Firebase SDK.
    const body: unknown = ownData(await req.json());
    if (body === null || typeof body !== "object" || Array.isArray(body)) return null;

    const token = (body as Record<string, unknown>).Token;
    if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) return null;
    // Made of legal characters, but never a device: the rules refuse both as
    // a token, for the reason given above.
    if (token === "__proto__" || token === "hasOwnProperty") return null;

    const record = (storable(body, 0) ?? {}) as { [key: string]: Stored };
    // Whatever the body said, the stored Token is the key it is stored under.
    record.Token = token;
    return { token, record };
  } catch {
    // Not JSON, or nested thousands of levels deep (copying that runs out of
    // stack). Either way it is a bad request, not a server error.
    return null;
  }
}

export async function POST(req: Request) {
  const registered = await registration(req);
  if (!registered) {
    return Response.json({ data: "request failure" }, { status: 400 });
  }
  try {
    const dataRef = ref(getDatabase(app), `/notifications_register/${registered.token}`);
    await set(dataRef, registered.record);
    return Response.json({ data: "success" });
  } catch (err) {
    console.error("Device registration failed:", err);
    return Response.json({ data: "request failure" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const registered = await registration(req);
  if (!registered) {
    return Response.json({ data: "request failure" }, { status: 400 });
  }
  try {
    const dataRef = ref(getDatabase(app), `/notifications_register/${registered.token}`);
    // Every key was checked by storable(), so none holds a "/": update() would
    // read that as a path into the record rather than the name of a field.
    await update(dataRef, registered.record);
    return Response.json({ data: "success" });
  } catch (err) {
    console.error("Device update failed:", err);
    return Response.json({ data: "request failure" }, { status: 500 });
  }
}
