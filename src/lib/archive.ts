/**
 * Archive helpers with no Firebase dependency, so they can be unit-tested.
 *
 * Tips are archived IN PLACE: `/messages/$tipId/archive` holds when, who and
 * the (encrypted) remarks, and `/messages/$tipId/archiveLog` keeps every
 * archive and restore as history. A tip is never moved, because the public
 * intake must still be able to append a follow-up to it by PIN.
 *
 * "Reopened" is therefore DERIVED, not stored: the intake cannot touch the
 * archive flag (admin-only rules), so a follow-up newer than `archive.at`
 * is what puts a tip back in the inbox. Both timestamps come from server
 * clocks — the archive mark from the database, follow-ups from the intake
 * route — and the rules refuse a follow-up stamped more than five minutes
 * from the database's own clock, so a tipster cannot forge one.
 *
 * Wanted and missing persons are MOVED to `/archive/wanteds|missings/$id`
 * (admin-only), which is what removes them from the public site, the police
 * portal and every installed app at once — the app lists people through the
 * website's /api/wanted and /api/missing, which read the public nodes only.
 */

export type ArchiveMark = { at: number; by: string; remarks: string };
export type ArchiveLogEntry = { action: "archived" | "restored"; at: number; by: string; remarks?: string };
export type TipArchiveStatus = "open" | "archived" | "reopened";
export type PeopleKind = "wanteds" | "missings";

export const PEOPLE_KINDS: PeopleKind[] = ["wanteds", "missings"];

// Fields that belong to the archive, never to the public record.
export const ARCHIVE_FIELDS = ["archived", "archiveLog"] as const;

// A follow-up stamped further ahead than this cannot be genuine (the rules
// allow five minutes of skew; this is looser on purpose). It is ignored when
// deciding whether a tip is reopened, so a bad stamp that somehow got stored
// can never hold a tip open against the admin.
export const FUTURE_SKEW_MS = 10 * 60_000;

type StoredFollowUps = Record<string, { created_at?: unknown }> | undefined | null;
type StoredTip = { archive?: Partial<ArchiveMark> | null; followUps?: StoredFollowUps };

/** When the tipster last added to this tip, or 0 if they never did. */
export const latestFollowUpAt = (raw: StoredTip | null | undefined, now: number = Date.now()): number => {
  const followUps = raw?.followUps;
  if (!followUps || typeof followUps !== "object") return 0;
  let latest = 0;
  for (const entry of Object.values(followUps)) {
    const at = entry?.created_at;
    if (typeof at === "number" && at <= now + FUTURE_SKEW_MS && at > latest) latest = at;
  }
  return latest;
};

/**
 * open      – never archived, or restored: lives in the inbox
 * archived  – archived and quiet since: lives on the Archive page
 * reopened  – archived, but the tipster wrote again afterwards: back in the
 *             inbox, flagged, until an admin archives it again
 */
export const tipArchiveStatus = (raw: StoredTip | null | undefined, now: number = Date.now()): TipArchiveStatus => {
  const archive = raw?.archive;
  if (!archive || typeof archive !== "object") return "open";
  const archivedAt = typeof archive.at === "number" ? archive.at : 0;
  return latestFollowUpAt(raw, now) > archivedAt ? "reopened" : "archived";
};

/** The archive log as a list, oldest first. */
export const archiveHistory = (log: Record<string, ArchiveLogEntry> | null | undefined): ArchiveLogEntry[] => {
  if (!log || typeof log !== "object") return [];
  return Object.values(log)
    .filter((e) => e && typeof e === "object" && typeof e.at === "number")
    .sort((a, b) => a.at - b.at);
};

/**
 * The record as it should go back to the public node: everything the archive
 * added is stripped, so remarks can never surface on the public site. The
 * rules refuse those fields on the public nodes as well; this keeps a correct
 * client from ever tripping them.
 */
export const publicRecordOf = <T extends Record<string, unknown>>(archivedRecord: T): Omit<T, (typeof ARCHIVE_FIELDS)[number]> => {
  const copy: Record<string, unknown> = { ...archivedRecord };
  for (const field of ARCHIVE_FIELDS) delete copy[field];
  return copy as Omit<T, (typeof ARCHIVE_FIELDS)[number]>;
};

export const MAX_REMARKS_LENGTH = 2000;

/** Remarks are mandatory: an archive with no reason is not one. */
export const normaliseRemarks = (input: string): string | null => {
  const trimmed = (input ?? "").trim();
  if (!trimmed || trimmed.length > MAX_REMARKS_LENGTH) return null;
  return trimmed;
};
