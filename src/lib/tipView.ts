/**
 * A stored tip, turned into something that is safe to put on a page.
 *
 * The inbox, the archive and the police portal all show tips, and a tip is a
 * record anyone may have written. Each page used to pick fields off the stored
 * record as it went, trusting their types. This is the one place that does it
 * now: whatever is stored, what comes back holds text where text is expected,
 * finite numbers where times are expected, and a bounded list of decrypted
 * follow-ups (the rest are kept as stored, to be brought in when asked for),
 * so a page can draw it without checking anything again.
 *
 * Pass a record that has already been through `ownData` (as everything from
 * `readAsStaff` has).
 */
import { followUpEntries, latestNotFuture, newestOnly, textOf, timeOf } from "./safeRecord";
import { readTipText, type CipherRecord } from "./tipCrypto";
import { readTipLabels, type TipLabelData } from "./tipLabels";

/** Well-formed PIN, as issued at any time. Kept in step with tipPin.ts and the rules. */
const PIN_PATTERN = /^[2-9A-HJKMNP-Z]{6}$/;

export type FollowUpView = {
  id: string;
  /** Decrypted text, or the unreadable marker. */
  message: string;
  /** When it was sent, in milliseconds; 0 when the record does not say. */
  created_at: number;
  /**
   * The stored fields, verbatim, for copying onto the police copy: the
   * ciphertext is shared as it is rather than decrypted and re-encrypted.
   */
  raw: Record<string, unknown>;
};

/**
 * A follow-up as it is stored, with its time worked out but its text not yet
 * decrypted. Turn a batch of them into something a page can draw with
 * `followUpViews`.
 */
export type StoredFollowUp = {
  id: string;
  entry: Record<string, unknown>;
  /** When it was sent, in milliseconds; 0 when the record does not say. */
  at: number;
};

export type TipView = {
  id: string;
  /** Decrypted text, or the unreadable marker. */
  message: string;
  /** The tip's PIN, or null when it has none or what is stored is not one. */
  pin: string | null;
  /** When it was sent, in milliseconds; 0 when the record does not say. */
  created_at: number;
  labels: TipLabelData;
  /** The newest follow-ups, oldest first: at most MAX_FOLLOW_UPS_SHOWN of them. */
  followUps: FollowUpView[];
  /**
   * The follow-ups older than those in `followUps`, oldest first, not yet
   * decrypted. A card draws the newest ones to begin with and brings these in
   * a batch at a time when asked (see useShownFollowUps): however many are
   * stored, every one of them can be read, and none is decrypted or drawn
   * until someone asks for it.
   */
  earlierFollowUps: StoredFollowUp[];
  /** How many follow-ups are stored in all: those in `followUps` and the earlier ones. */
  followUpCount: number;
  /** When the newest follow-up of ALL of them was sent (0 when there are none). */
  latestFollowUpAt: number;
  /**
   * For putting the most recently active tips first: the latest of its own
   * time and its follow-ups' times that is not in the future (0 when it has
   * none). A date in the far future is passed over, so a tip stamped with one
   * cannot sit at the top of the inbox.
   */
  lastActivity: number;
};

/** The fields of a stored tip or follow-up that are copied to the police, as stored. */
export function storedCopy(entry: unknown): Record<string, unknown> {
  const record = (entry ?? {}) as Record<string, unknown>;
  const copy: Record<string, unknown> = { message: record.message, created_at: record.created_at };
  if (typeof record.encrypted === "boolean") copy.encrypted = record.encrypted;
  return copy;
}

/** Stored follow-ups as a page draws them: decrypted, in the order given. */
export function followUpViews(stored: StoredFollowUp[]): FollowUpView[] {
  return stored.map(({ id, entry, at }) => ({
    id,
    message: readTipText(entry as CipherRecord),
    created_at: at,
    raw: storedCopy(entry),
  }));
}

export function buildTipView(
  id: string,
  stored: unknown,
  options: { unreadable?: string; now?: number } = {}
): TipView {
  const record = (stored !== null && typeof stored === "object" ? stored : {}) as Record<string, unknown>;
  const unreadable = options.unreadable ?? "[Could not decrypt this tip]";
  const now = options.now ?? Date.now();

  // Every follow-up is timed and ordered, but only the newest few are
  // decrypted here: a real conversation is a handful of messages. The older
  // ones are kept as they are stored, for the card to bring in when asked.
  const timed: StoredFollowUp[] = followUpEntries(record.followUps).map(([followUpId, entry]) => ({
    id: followUpId,
    entry,
    at: timeOf(entry.created_at),
  }));
  timed.sort((a, b) => a.at - b.at);
  const latestFollowUpAt = timed.length ? timed[timed.length - 1].at : 0;
  const { shown, hidden } = newestOnly(timed);

  const created_at = timeOf(record.created_at);
  const pin = textOf(record.pin);

  return {
    id,
    message: readTipText(record as CipherRecord, unreadable),
    pin: PIN_PATTERN.test(pin) ? pin : null,
    created_at,
    labels: readTipLabels(record),
    followUps: followUpViews(shown),
    earlierFollowUps: hidden ? timed.slice(0, hidden) : [],
    followUpCount: timed.length,
    latestFollowUpAt,
    lastActivity: latestNotFuture(
      (function* () {
        yield created_at;
        for (const followUp of timed) yield followUp.at;
      })(),
      now
    ),
  };
}
