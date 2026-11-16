/**
 * Sorting one batch of push messages by the app their tokens belong to.
 *
 * Expo takes a batch of messages only if every token in it belongs to the
 * same app (it calls an app an "experience"). One token from any other app
 * and the whole batch is refused, with the code below and a list of which
 * tokens belong to which app. Anyone can add a record to the device register,
 * so anyone could plant a token from some other app there: before this, that
 * one record stopped every notification in its batch for good, real devices
 * included.
 *
 * No imports, so the unit tests can load it.
 */

/** Expo's code for "these tokens belong to more than one app". */
export const MIXED_APPS_CODE = "PUSH_TOO_MANY_EXPERIENCE_IDS";

/** The part of a push token between the brackets, or the whole text when it has none. */
const tokenKey = (token: string): string => {
  const inner = /\[([^\]]+)\]/.exec(token);
  return inner ? inner[1] : token;
};

/**
 * The messages of a refused batch, grouped by app, so that each group can be
 * sent on its own. `details` is what came with Expo's refusal: an object of
 * app name to the list of that app's tokens.
 *
 * Messages whose token Expo did not list go in a group of their own. Null
 * when the details do not separate anything (not the expected shape, or every
 * message lands in one group): sending the same batch again would only fail
 * the same way.
 */
export function splitByApp<M extends { to: unknown }>(messages: M[], details: unknown): M[][] | null {
  if (details === null || typeof details !== "object" || Array.isArray(details)) return null;

  const groupOf = new Map<string, number>();
  let apps = 0;
  for (const tokens of Object.values(details as Record<string, unknown>)) {
    if (!Array.isArray(tokens)) continue;
    let listedAny = false;
    for (const token of tokens) {
      if (typeof token !== "string") continue;
      const key = tokenKey(token);
      if (groupOf.has(key)) continue;
      groupOf.set(key, apps);
      listedAny = true;
    }
    if (listedAny) apps += 1;
  }
  if (apps === 0) return null;

  // One group per app, and a last one for messages Expo did not mention.
  const groups: M[][] = Array.from({ length: apps + 1 }, () => []);
  for (const message of messages) {
    const group = typeof message.to === "string" ? groupOf.get(tokenKey(message.to)) : undefined;
    groups[group ?? apps].push(message);
  }
  const filled = groups.filter((group) => group.length > 0);
  return filled.length > 1 ? filled : null;
}
