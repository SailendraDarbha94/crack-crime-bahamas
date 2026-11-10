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
 * The rules refuse that key for new tips. This is the other half: everything
 * the staff pages read about tips goes through `ownData` first, so what is
 * shown never depends on a record's prototype, whatever is in the database.
 *
 * No imports, so the unit tests can load it.
 */

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
    // Never an own key of something the SDK built, but assigning it here
    // would recreate the very problem this function exists to remove.
    if (key === "__proto__") continue;
    copy[key] = ownData((value as Record<string, unknown>)[key]);
  }
  return copy as T;
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
