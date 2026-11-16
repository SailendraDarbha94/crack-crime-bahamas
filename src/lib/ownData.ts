/**
 * What a database record actually holds, and nothing it merely appears to.
 *
 * The Firebase SDK builds `snapshot.val()` by assigning each child onto a plain
 * object. A child named "__proto__" is therefore not stored as an entry: it
 * becomes the object's PROTOTYPE, and every field the record does not have is
 * then read from it. Anyone may create a tip, so anyone could file one with a
 * "__proto__" child and have the admin pages read an `archive` mark, a `source`
 * or follow-ups that the security rules never saw and would have refused. A
 * tip could be made to look archived (and so vanish from the inbox) that way.
 *
 * A second key is as bad in a different way: "hasOwnProperty". The SDK calls
 * `obj.hasOwnProperty(key)` on every object it receives and on every object it
 * is asked to store, so a record holding a key of that name makes `get()`
 * reject (no page can read the node at all) and cannot be written back.
 *
 * The rules refuse both keys for new records. This is the other half: the
 * staff pages read through `readAsStaff` (staffRead.ts), which fetches plain
 * JSON instead of asking the SDK, and passes it through `ownData`, so what is
 * shown never depends on a record's prototype and never carries either key,
 * whatever is in the database.
 *
 * No imports, so the unit tests can load it.
 */

/** Keys that are never copied: see above. */
const NEVER_COPIED = new Set(["__proto__", "hasOwnProperty"]);

const hasOwn = (object: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(object, key);

/**
 * A deep copy of `value` made only from the keys each object really has.
 * Arrays stay arrays (the SDK returns one when a node's children are numbered).
 */
export function ownData<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => ownData(item)) as unknown as T;
  if (value === null || typeof value !== "object") return value;
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    // "__proto__" is never an own key of something the SDK built, but it is
    // one in parsed JSON, and assigning it here would recreate the very
    // problem this function exists to remove.
    if (NEVER_COPIED.has(key)) continue;
    copy[key] = ownData((value as Record<string, unknown>)[key]);
  }
  return copy as T;
}

/**
 * `ownData` for a node of RECORDS keyed by id (all of /messages, say): every
 * record is copied as `ownData` copies it, but no record is left out because
 * of what it is called. A tip someone managed to store under the id
 * "hasOwnProperty" or "__proto__" must still be listed, or no member of staff
 * could ever see it to delete it. The two names are kept as ordinary keys of
 * the map (use Object.keys / Object.entries / `ownEntry` on it, as always, and
 * never hand the map itself to the SDK).
 */
export function ownRecords<T>(node: T): T {
  if (node === null || typeof node !== "object" || Array.isArray(node)) return ownData(node);
  const map: Record<string, unknown> = {};
  for (const id of Object.keys(node)) {
    // defineProperty, not assignment: assigning to "__proto__" would set the
    // map's prototype instead of adding an entry.
    Object.defineProperty(map, id, {
      value: ownData((node as Record<string, unknown>)[id]),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return map as T;
}

/**
 * `map[key]`, but only if the map really has that key. A plain lookup also
 * finds what every object inherits: a tip filed under the id "constructor"
 * would otherwise appear to have a police copy, because `{}.constructor` is a
 * function.
 *
 * The map may arrive as an array (the SDK returns one when every child of a
 * node is numbered). Only its numbered positions are entries then: "length"
 * is an array's own property, but it is not a record.
 */
export function ownEntry<T>(map: Record<string, T> | null | undefined, key: string): T | undefined {
  if (!map || !hasOwn(map, key)) return undefined;
  if (Array.isArray(map) && !/^(0|[1-9]\d*)$/.test(key)) return undefined;
  return map[key];
}
