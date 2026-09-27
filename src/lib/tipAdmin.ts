/**
 * Admin operations on a tip that more than one page performs (inbox and
 * Archive), kept in one place so both behave identically.
 */
import { child, get, push, ref, remove, serverTimestamp, update, type Database } from "firebase/database";
import { normaliseRemarks } from "./archive";
import { encryptText } from "./tipCrypto";

export type CleanupResult = { copyLeftBehind: boolean };

/** The page's view of a tip no longer matches the database. */
export class StaleTipError extends Error {
  constructor(public readonly reason: "gone" | "newer-follow-up") {
    super(reason === "gone" ? "This tip no longer exists." : "The tipster has written since this page loaded.");
    this.name = "StaleTipError";
  }
}

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
 * `lastSeenFollowUpAt` is the newest follow-up the admin's card showed. A
 * follow-up that arrived after the page loaded would be stamped OLDER than
 * the archive and so could never reopen the tip: it would be buried unread.
 * So the tip is re-read first, and a newer follow-up stops the archive.
 */
export const archiveTip = async (
  db: Database,
  tipId: string,
  adminUid: string,
  remarks: string,
  lastSeenFollowUpAt = 0
): Promise<CleanupResult> => {
  const clean = normaliseRemarks(remarks);
  if (!clean) throw new Error("Remarks are required to archive.");

  const current = await get(ref(db, `messages/${tipId}`));
  if (!current.exists()) throw new StaleTipError("gone");
  let newest = 0;
  for (const entry of Object.values(current.val().followUps ?? {}) as { created_at?: unknown }[]) {
    if (typeof entry?.created_at === "number" && entry.created_at > newest) newest = entry.created_at;
  }
  if (newest > lastSeenFollowUpAt) throw new StaleTipError("newer-follow-up");

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

/** Put an archived tip back in the inbox, recording who did it. */
export const restoreTip = async (db: Database, tipId: string, adminUid: string): Promise<void> => {
  if (!(await get(ref(db, `messages/${tipId}`))).exists()) throw new StaleTipError("gone");
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
 */
export const deleteTipRecords = async (db: Database, tipId: string, pin: string | null | undefined): Promise<CleanupResult> => {
  await remove(ref(db, `messages/${tipId}`));
  if (pin) {
    try {
      await remove(ref(db, `tipPins/${pin}`));
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
