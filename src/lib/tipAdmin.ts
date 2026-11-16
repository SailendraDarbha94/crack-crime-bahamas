/**
 * Admin operations on a tip that more than one page performs (inbox and
 * Archive), kept in one place so both behave identically.
 */
import { child, get, push, ref, remove, serverTimestamp, update, type Database } from "firebase/database";
import { normaliseRemarks } from "./archive";
import { followUpEntries, timeOf } from "./safeRecord";
import { readAsStaff } from "./staffRead";
import { encryptText } from "./tipCrypto";

export type CleanupResult = { copyLeftBehind: boolean };

/** The page's view of a tip no longer matches the database. */
export class StaleTipError extends Error {
  constructor(public readonly reason: "gone" | "newer-follow-up") {
    super(reason === "gone" ? "This tip no longer exists." : "The tipster has written since this page loaded.");
    this.name = "StaleTipError";
  }
}

/** Well-formed PIN, as issued at any time. Kept in step with tipPin.ts and the rules. */
const PIN_PATTERN = /^[2-9A-HJKMNP-Z]{6}$/;

/**
 * Where a tip is read from before it is changed. Read through `readAsStaff`,
 * never the SDK's `get()`: the SDK refuses to hand over a record that holds a
 * key named "hasOwnProperty" (see staffRead.ts), and a tip like that must
 * still be archivable and removable. The id goes in as it is: `readAsStaff`
 * encodes each key of the path itself.
 */
const tipPath = (tipId: string): string => `messages/${tipId}`;

/**
 * What a card knew of a tip's later messages when it was drawn: how many
 * there were, and when the newest was sent. Both come from the card's TipView
 * (`followUpCount`, `latestFollowUpAt`).
 */
export type LastSeen = { followUpCount: number; latestFollowUpAt: number };

/**
 * The same two facts about a tip as it is stored now. Worked out exactly the
 * way a card's are (tipView.ts), because the two are compared to tell whether
 * the tipster has written since the card was drawn.
 */
const followUpState = (storedTip: unknown): LastSeen => {
  const state: LastSeen = { followUpCount: 0, latestFollowUpAt: 0 };
  if (storedTip === null || typeof storedTip !== "object") return state;
  for (const [, entry] of followUpEntries((storedTip as Record<string, unknown>).followUps)) {
    state.followUpCount += 1;
    const at = timeOf(entry.created_at);
    if (at > state.latestFollowUpAt) state.latestFollowUpAt = at;
  }
  return state;
};

/**
 * True when the stored tip holds a message the card did not know of.
 *
 * The count is what settles it. A follow-up can only ever be added, never
 * changed or removed, so more of them than the card counted means something
 * new. The time alone would not do: a sender chooses the time on what they
 * write, and one message stamped a few minutes ahead would hide every message
 * that arrived before that moment. The time is still compared, as it always
 * was, in case the two ever disagree.
 */
const writtenSince = (storedTip: unknown, seen: LastSeen): boolean => {
  const now = followUpState(storedTip);
  return now.followUpCount > seen.followUpCount || now.latestFollowUpAt > seen.latestFollowUpAt;
};

/**
 * Archive a tip in place with the admin's remarks, then withdraw it from the
 * police. The archive write is atomic (mark + history entry together); the
 * withdrawal is separate and best-effort, exactly like the delete path, so
 * a problem removing the police copy can never undo the archive.
 *
 * `at` is the database server's clock, not the browser's: "reopened" is
 * decided by comparing it with follow-up times set by the intake route, and
 * a browser clock that runs fast would hide a tipster's new message.
 *
 * `lastSeen` is what the admin's card knew of the tip's later messages. A
 * follow-up that arrived after the page loaded would be stamped OLDER than
 * the archive and so could never reopen the tip: it would be buried unread.
 * So the tip is re-read first, and a message the card did not know of stops
 * the archive. If that re-read fails, nothing is archived.
 */
export const archiveTip = async (
  db: Database,
  tipId: string,
  adminUid: string,
  remarks: string,
  lastSeen: LastSeen = { followUpCount: 0, latestFollowUpAt: 0 }
): Promise<CleanupResult> => {
  const clean = normaliseRemarks(remarks);
  if (!clean) throw new Error("Remarks are required to archive.");

  const current = await readAsStaff<unknown>(tipPath(tipId));
  if (current === null) throw new StaleTipError("gone");
  if (writtenSince(current, lastSeen)) throw new StaleTipError("newer-follow-up");

  const at = serverTimestamp();
  const cipher = encryptText(clean);
  const logKey = push(child(ref(db), `messages/${tipId}/archiveLog`)).key;
  const updates: Record<string, unknown> = {
    archive: { at, by: adminUid, remarks: cipher },
  };
  if (logKey) updates[`archiveLog/${logKey}`] = { action: "archived", at, by: adminUid, remarks: cipher };
  await update(ref(db, `messages/${tipId}`), updates);
  return { copyLeftBehind: !(await removePoliceCopy(db, tipId)) };
};

/**
 * Put an archived tip back in the inbox, recording who did it.
 *
 * The tip is looked for first, because writing the history entry to a tip
 * that has been deleted would bring a husk of it back. Only an answer of
 * "nothing is stored there" counts as gone: a read that fails throws its own
 * error instead, so a tip that could not be read is never reported as deleted.
 */
export const restoreTip = async (db: Database, tipId: string, adminUid: string): Promise<void> => {
  if ((await readAsStaff<unknown>(tipPath(tipId))) === null) throw new StaleTipError("gone");
  const logKey = push(child(ref(db), `messages/${tipId}/archiveLog`)).key;
  const updates: Record<string, unknown> = { archive: null };
  if (logKey) updates[`archiveLog/${logKey}`] = { action: "restored", at: serverTimestamp(), by: adminUid };
  await update(ref(db, `messages/${tipId}`), updates);
};

/**
 * Delete a tip for good. The tip goes first, on its own: that is what was
 * asked for, and it must not depend on anything else succeeding. Clearing the
 * PIN index and the police copy is then a courtesy. Their rules may not be
 * deployed yet (see FIREBASE_ROLLOUT.md), and a leftover only points at a tip
 * that no longer exists. Bundling these with the delete is what broke
 * deletion before.
 *
 * `lastSeen` is what the admin's card knew of the tip's later messages. Give
 * it whenever the admin was shown the tip: everything stored under a tip goes
 * with it, so a delete from a page opened earlier used to destroy, unseen,
 * whatever the tipster had sent since. With it, the tip is re-read first and
 * a message the card did not know of stops the delete, leaving everything in
 * place. If that re-read fails, nothing is deleted either: nothing stored in
 * a tip can make the read fail (see staffRead.ts), so a failure means the
 * connection or the sign-in is in trouble, which is exactly when the page is
 * most likely to be out of date. The admin is asked to try again.
 *
 * Leave it out for a record the page could not show at all: there is nothing
 * the admin has seen to compare with, and deleting is the only way to be rid
 * of such a record. That delete depends on no read.
 */
export const deleteTipRecords = async (
  db: Database,
  tipId: string,
  pin: string | null | undefined,
  lastSeen?: LastSeen
): Promise<CleanupResult> => {
  if (lastSeen !== undefined) {
    // A tip that is already gone (another admin deleted it) holds nothing
    // new, and the PIN and police copy below may still need clearing.
    if (writtenSince(await readAsStaff<unknown>(tipPath(tipId)), lastSeen)) {
      throw new StaleTipError("newer-follow-up");
    }
  }

  await remove(ref(db, `messages/${tipId}`));
  // Only something shaped like a PIN is looked up: the value becomes part of
  // a path, and nothing else can be a key in the index.
  if (typeof pin === "string" && PIN_PATTERN.test(pin)) {
    try {
      // Only this tip's own entry. The `pin` on a tip is not proof that the
      // tip owns that PIN: anyone can file a tip carrying a PIN that belongs
      // to someone else's tip, and deleting such a decoy must not take the
      // real tip's PIN with it (its tipster could then no longer follow up).
      //
      // Read like the tip itself: anyone may add to the index, and the SDK
      // cannot read an entry that holds a key named "hasOwnProperty".
      const entry = await readAsStaff<{ tipId?: unknown }>(`tipPins/${pin}`);
      if (entry && entry.tipId === tipId) await remove(ref(db, `tipPins/${pin}`));
    } catch (err) {
      console.warn("Tip deleted, but its PIN index could not be cleared:", err);
    }
  }
  // Always attempted, never gated on what the page happened to know: another
  // admin may have forwarded the tip after this view loaded. Removing a copy
  // that does not exist is a permitted no-op.
  return { copyLeftBehind: !(await removePoliceCopy(db, tipId)) };
};

/** True when the police copy is gone afterwards (removed, or never there). */
export const removePoliceCopy = async (db: Database, tipId: string): Promise<boolean> => {
  try {
    await remove(ref(db, `policeTips/${tipId}`));
    return true;
  } catch (err) {
    console.warn("The police copy of this tip could not be removed:", err);
    return false;
  }
};

/** Whether officers currently hold a copy of this tip. */
export const policeCopyExists = async (db: Database, tipId: string): Promise<boolean> =>
  (await get(ref(db, `policeTips/${tipId}`))).exists();
