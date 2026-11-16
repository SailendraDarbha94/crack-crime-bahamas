"use client";
import CardBoundary from "@/components/CardBoundary";
import PublicPersonCard, { PublicPerson } from "@/components/PublicPersonCard";
import TipLabels from "@/components/TipLabels";
import { archiveHistory, tipArchiveStatus, type PeopleKind } from "@/lib/archive";
import app from "@/lib/firebase";
import { FirebaseErrorHandler } from "@/lib/firebaseErrorHandler";
import { ownEntry } from "@/lib/ownData";
import { PersonArchiveService } from "@/lib/firebaseService";
import { MAX_FOLLOW_UPS_SHOWN, newestOnly, recordsOf, shortText, textOf, timeOf } from "@/lib/safeRecord";
import { readAsStaff, StaffReadError } from "@/lib/staffRead";
import { deleteTipRecords, removePoliceCopy, restoreTip, StaleTipError } from "@/lib/tipAdmin";
import { readTipText } from "@/lib/tipCrypto";
import { buildTipView, type TipView } from "@/lib/tipView";
import { useToast } from "@/lib/toastContext";
import { hiddenText, showEarlierLabel, ShownFollowUpsMemory, useShownFollowUps } from "@/lib/useShownFollowUps";
import { dateReader } from "@/lib/utils";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { useEffect, useRef, useState } from "react";

type Tab = "tips" | PeopleKind;
type Records = Record<string, unknown>;

type ArchiveMarkView = { at: number; by: string; remarks: string };
type HistoryEntry = { action: "archived" | "restored"; at: number; by: string; remarks: string };

/**
 * An archived tip as this page draws it: the safe view of the stored record
 * (see tipView.ts) and what the archive adds to it.
 */
type ArchivedTip = TipView & {
  kind: "tip";
  /** When it was archived: what the list is ordered by. */
  archivedAt: number;
  archive: ArchiveMarkView;
  /** The newest archive and restore events, oldest first. */
  history: HistoryEntry[];
  /** How many older events are stored but not in `history`. */
  hiddenHistory: number;
  stillWithPolice: boolean;
};
type ArchivedPerson = {
  kind: "person";
  id: string;
  archivedAt: number;
  /** Only text and numbers: everything PublicPersonCard draws. */
  person: PublicPerson;
  archived: ArchiveMarkView;
};
/** A record that could not be turned into a card. It is listed, as a placeholder. */
type Unreadable = { kind: "unreadable"; id: string; archivedAt: number };
type TipItem = ArchivedTip | Unreadable;
type PersonItem = ArchivedPerson | Unreadable;

// The five things this page reads. Each is read, and can fail, on its own.
const SOURCES = ["messages", "policeTips", "archive/wanteds", "archive/missings", "users"] as const;
type Source = (typeof SOURCES)[number];

/** What each failed read costs the page, in the admin's words. */
const PROBLEM_TEXT: Record<Source, string> = {
  messages: "The archived tips could not be read.",
  policeTips: "Could not check whether any archived tip is still with the police, so none is marked as such.",
  "archive/wanteds": "The archived wanted persons could not be read.",
  "archive/missings": "The archived missing persons could not be read.",
  users: "The names of staff could not be read, so “an admin” may be shown in place of a name.",
};

/** Which read each tab's list comes from. */
const TAB_SOURCE: Record<Tab, Source> = {
  tips: "messages",
  wanteds: "archive/wanteds",
  missings: "archive/missings",
};

const smallButton =
  "bg-white/40 border border-white/60 hover:bg-white/55 text-amber-950 font-bold text-sm px-3 py-1.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
const dangerButton =
  "bg-red-700 hover:bg-red-600 text-white font-bold text-sm px-3 py-1.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * How many archived tips are drawn to begin with, and how many more each time
 * the page is asked. As in the inbox: nothing limits how many tips there are,
 * and a great many must make the list long, not the page impossible to open.
 */
const TIPS_PAGE_SIZE = 200;

const TABS: { key: Tab; label: string }[] = [
  { key: "tips", label: "Tips" },
  { key: "missings", label: "Missing" },
  { key: "wanteds", label: "Wanted" },
];

/**
 * A time as the page shows it. Every time drawn here has been through
 * `timeOf` (safeRecord.ts), which answers 0 for anything that is not a moment
 * a date can stand for: 0 is "date unknown", never 1970.
 */
const whenText = (ms: number): string => (ms > 0 ? dateReader(ms) : "date unknown");

const decryptRemarks = (cipher: unknown) =>
  typeof cipher === "string" && cipher
    ? readTipText({ message: cipher, encrypted: true }, "[Could not read the remarks]")
    : "";

/** The stored record as an object whose fields can be picked off safely. */
const fieldsOf = (stored: unknown): Records =>
  stored !== null && typeof stored === "object" ? (stored as Records) : {};

/**
 * The record stored under `id`, or null when there is none. Looked up with
 * ownEntry, never `map[id]` (see ownData.ts). A node whose children are all
 * numbered arrives as an array with null wherever a number is unused: that
 * is a gap, not a record.
 */
const recordAt = (map: Records, id: string): unknown => ownEntry(map, id) ?? null;

/**
 * An archive mark (`archive` on a tip, `archived` on a person) with every
 * field in the form the page draws. `at` counts only as a number, which is how
 * tipArchiveStatus reads it when it decides that a tip is archived.
 */
const markOf = (stored: unknown): ArchiveMarkView => {
  const mark = fieldsOf(stored);
  return {
    at: typeof mark.at === "number" ? timeOf(mark.at) : 0,
    by: textOf(mark.by),
    remarks: decryptRemarks(mark.remarks),
  };
};

const buildArchivedTip = (id: string, stored: unknown, policeCopies: Records | null, now: number): ArchivedTip => {
  const view = buildTipView(id, stored, { unreadable: "[Could not decrypt this tip]", now });
  const fields = fieldsOf(stored);
  const archive = markOf(fields.archive);
  // A real history is a few events. Like follow-ups, only the newest are
  // kept, so a record stuffed with them cannot freeze the page.
  const events = archiveHistory(fields.archiveLog as Parameters<typeof archiveHistory>[0]).filter(
    (e) => e.action === "archived" || e.action === "restored"
  );
  const { shown, hidden } = newestOnly(events, MAX_FOLLOW_UPS_SHOWN);
  return {
    ...view,
    kind: "tip",
    archivedAt: archive.at,
    archive,
    history: shown.map((e) => ({
      action: e.action,
      at: timeOf(e.at),
      by: textOf(e.by),
      remarks: decryptRemarks(e.remarks),
    })),
    hiddenHistory: hidden,
    // Archiving withdraws the police copy; if that step failed, the copy
    // is still readable by officers and must be dealt with from here,
    // since the inbox no longer lists this tip.
    stillWithPolice: policeCopies ? recordAt(policeCopies, id) !== null : false,
  };
};

/**
 * The archived tips, most recently archived first. Each is built on its own:
 * one that cannot be built becomes a placeholder, not an empty page.
 * `policeCopies` is null when /policeTips could not be read.
 */
const buildTips = (messages: Records, policeCopies: Records | null, now: number): TipItem[] => {
  const list: TipItem[] = [];
  // recordsOf: every record under the node, with the gaps a numbered node
  // comes back with left out.
  for (const [id, stored] of recordsOf(messages)) {
    let archived = false;
    try {
      archived = tipArchiveStatus(stored as Parameters<typeof tipArchiveStatus>[0], now) === "archived";
      if (archived) list.push(buildArchivedTip(id, stored, policeCopies, now));
    } catch (err) {
      console.error("An archived tip could not be displayed:", err);
      // A record whose status could not even be worked out is listed by the
      // inbox, as unreadable. Only what is known to be archived belongs here.
      if (archived) list.push({ kind: "unreadable", id, archivedAt: markOf(fieldsOf(stored).archive).at });
    }
  }
  list.sort((a, b) => b.archivedAt - a.archivedAt);
  return list;
};

/**
 * Text for a card, or nothing at all when the record does not hold text
 * there. Cut to `max` characters: far more than any real entry, far less than
 * would trouble the page.
 */
const optionalText = (value: unknown, max: number): string | undefined => shortText(value, max) || undefined;

// The most that is drawn of a person's short fields and of their longer ones.
const MAX_LABEL = 200;
const MAX_PARAGRAPH = 5000;

const buildArchivedPerson = (id: string, stored: unknown): ArchivedPerson => {
  if (typeof stored !== "object" || stored === null || Array.isArray(stored)) {
    throw new Error("The record is not a person.");
  }
  const fields = stored as Records;
  const archived = markOf(fields.archived);
  return {
    kind: "person",
    id,
    archivedAt: archived.at,
    // Field by field, never the stored record spread whole: the card draws
    // these as text, and React throws on anything that is not.
    person: {
      id,
      name: shortText(fields.name, MAX_LABEL) || "Name not recorded",
      age: typeof fields.age === "number" && Number.isFinite(fields.age) ? fields.age : optionalText(fields.age, MAX_LABEL),
      gender: optionalText(fields.gender, MAX_LABEL),
      alias: optionalText(fields.alias, MAX_LABEL),
      // A path in Storage, not an address: the card asks Storage for the
      // picture and falls back to the logo. Nothing stored is used as the
      // source of an image directly. Kept whole, since deleting the person
      // deletes the picture at exactly this path.
      image: textOf(fields.image) || undefined,
      description: optionalText(fields.description, MAX_PARAGRAPH),
      wanted_for: optionalText(fields.wanted_for, MAX_PARAGRAPH),
      last_known_address: optionalText(fields.last_known_address, MAX_PARAGRAPH),
    },
    archived,
  };
};

/** The archived people of one kind, most recently archived first. */
const buildPeople = (node: Records): PersonItem[] => {
  const list: PersonItem[] = [];
  for (const [id, stored] of recordsOf(node)) {
    try {
      list.push(buildArchivedPerson(id, stored));
    } catch (err) {
      console.error("An archived person could not be displayed:", err);
      list.push({ kind: "unreadable", id, archivedAt: markOf(fieldsOf(stored).archived).at });
    }
  }
  list.sort((a, b) => b.archivedAt - a.archivedAt);
  return list;
};

/**
 * Who did what, where we know a name. Admins are allowlisted by uid in the
 * Console and may have no profile, so "an admin" is the fallback. A profile
 * is written by whoever owns the account, so a name counts only when it is
 * text, and only so much of it is kept.
 */
const buildNames = (users: Records): Record<string, string> => {
  // With no prototype, so that whatever a profile is stored under becomes an
  // ordinary entry: on a plain object, assigning to "__proto__" would not.
  const nameOf: Record<string, string> = Object.create(null);
  for (const [uid, stored] of recordsOf(users)) {
    const profile = fieldsOf(stored);
    const full = shortText(`${textOf(profile.firstName)} ${textOf(profile.lastName)}`.trim());
    if (full) nameOf[uid] = full;
  }
  return nameOf;
};

// One card, without the colour of its border: an ordinary card and the
// placeholder for an unreadable record differ only in that.
const cardShell =
  "bg-white/25 backdrop-blur-xl border max-w-md mx-auto rounded-2xl shadow-[0_8px_32px_rgba(120,72,10,0.12)] my-2 p-4 flex flex-col gap-3";

// The cards below are components of their own, so that anything that goes
// wrong while drawing one happens beneath that card's CardBoundary and
// nowhere else. Drawn inline in the page, the same fault would take the page.

const ArchivedTipCard = ({
  tip,
  busy,
  who,
  onRestore,
  onDelete,
  onWithdraw,
}: {
  tip: ArchivedTip;
  busy: boolean;
  who: (uid: string) => string;
  onRestore: () => void;
  /** Told how many earlier messages the card is not showing, for the warning before deleting. */
  onDelete: (hiddenFollowUps: number) => void;
  onWithdraw: () => void;
}) => {
  // The newest follow-ups to begin with (see tipView.ts), the earlier ones
  // when asked: nothing a tipster sent may be out of reach.
  const { followUps, hidden, nextBatch, showEarlier } = useShownFollowUps(tip);
  const laterMessages = tip.followUpCount;
  const events = tip.history.length + tip.hiddenHistory;
  return (
    <div className={`${cardShell} border-white/50`}>
      <div className="rounded-xl bg-amber-100/60 border border-amber-300/60 px-3 py-2">
        <p className="text-xs uppercase tracking-wide text-amber-900/70">
          Archived {whenText(tip.archive.at)} by {who(tip.archive.by)}
        </p>
        <p className="text-sm font-semibold whitespace-pre-wrap [overflow-wrap:anywhere]">{tip.archive.remarks}</p>
      </div>

      {tip.stillWithPolice ? (
        <div className="rounded-xl border border-red-400/60 bg-white/40 px-3 py-2 flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-red-800">Still with the police</p>
          <p className="text-sm text-amber-900/80">
            Archiving should have withdrawn this tip from officers, but the copy is still there.
          </p>
          <div>
            <button onClick={onWithdraw} disabled={busy} className={smallButton}>
              Withdraw from police
            </button>
          </div>
        </div>
      ) : null}

      <TipLabels labels={tip.labels} />

      {/* Wraps anywhere: a tip can be one long unbroken word, and it must stay inside the card. */}
      <p className="font-bold text-xl whitespace-pre-wrap [overflow-wrap:anywhere]">{tip.message}</p>

      {laterMessages ? (
        <div className="border-l-2 border-amber-900/25 pl-3 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-wide text-amber-900/70">
            {laterMessages === 1 ? "1 later message" : `${laterMessages} later messages`}
          </p>
          {/* Past the cap only the newest are drawn to begin with. The card
              says so, and offers the rest. */}
          {hidden ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm italic text-amber-900/80">{hiddenText(hidden)}</p>
              <button onClick={showEarlier} className={smallButton}>
                {showEarlierLabel(hidden, nextBatch)}
              </button>
            </div>
          ) : null}
          {followUps.map((f) => (
            <div key={f.id}>
              <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{f.message}</p>
              <p className="text-xs text-amber-900/70 pt-0.5">{whenText(f.created_at)}</p>
            </div>
          ))}
        </div>
      ) : null}

      <p className="text-sm text-amber-900/80">
        {tip.pin ? (
          <>
            PIN <span className="font-mono font-extrabold tracking-[0.2em]">{tip.pin}</span> ·{" "}
          </>
        ) : null}
        Sent {whenText(tip.created_at)}
      </p>

      {events > 1 ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-amber-900/80 font-semibold">
            History ({events} {events === 1 ? "event" : "events"})
          </summary>
          {tip.hiddenHistory ? (
            <p className="mt-2 italic text-amber-900/80">
              {tip.hiddenHistory === 1
                ? "1 earlier event is not shown"
                : `${tip.hiddenHistory} earlier events are not shown`}
            </p>
          ) : null}
          <ul className="mt-2 flex flex-col gap-1 text-amber-900/90">
            {tip.history.map((h, i) => (
              <li key={i}>
                <span className="font-semibold">{h.action === "archived" ? "Archived" : "Restored"}</span>{" "}
                {whenText(h.at)} by {who(h.by)}
                {h.remarks ? <span className="italic whitespace-pre-wrap [overflow-wrap:anywhere]"> — “{h.remarks}”</span> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="flex gap-2 pt-1">
        <button onClick={onRestore} disabled={busy} className={smallButton}>
          Restore to inbox
        </button>
        <button onClick={() => onDelete(hidden)} disabled={busy} className={dangerButton}>
          Delete permanently
        </button>
      </div>
    </div>
  );
};

/**
 * What stands in for an archived record that could not be built or drawn. It
 * shows nothing from the record but its id (and, for a person, a name already
 * known to be text), so nothing stored can stop THIS from drawing, and it
 * still lets an admin delete the record: without that the only cure for a
 * broken record would be the Firebase console.
 */
const UnreadableCard = ({
  id,
  what,
  name,
  busy,
  onDelete,
}: {
  id: string;
  what: "tip" | "person";
  name?: string;
  busy: boolean;
  onDelete: () => void;
}) => (
  <div className={`${cardShell} border-red-400/60`}>
    <p className="font-bold">This record could not be displayed</p>
    <p className="text-sm text-amber-900/80">
      {what === "tip"
        ? "Something stored in this archived tip is not in a form this page can show. It is still in the database. If it might be a genuine tip, have it looked at before deleting it, quoting the id below."
        : "Something stored for this archived person is not in a form this page can show. It is still in the archive. Have it looked at before deleting it, quoting the id below."}
    </p>
    <div>
      {name ? <p className="text-sm font-semibold [overflow-wrap:anywhere]">{textOf(name)}</p> : null}
      <p className="text-xs uppercase tracking-wide text-amber-900/70">{what === "tip" ? "Tip id" : "Record id"}</p>
      <p className="font-mono text-sm [overflow-wrap:anywhere]">{textOf(id, "unknown")}</p>
    </div>
    <div>
      <button onClick={onDelete} disabled={busy} className={dangerButton}>
        Delete permanently
      </button>
    </div>
  </div>
);

const ArchivedPersonCard = ({
  item,
  kind,
  busy,
  who,
  onRestore,
  onDelete,
}: {
  item: ArchivedPerson;
  kind: PeopleKind;
  busy: boolean;
  who: (uid: string) => string;
  onRestore: () => void;
  onDelete: () => void;
}) => (
  <div className="flex flex-col gap-2">
    <PublicPersonCard person={item.person} kind={kind === "wanteds" ? "wanted" : "missing"} />
    <div className="rounded-xl bg-amber-100/60 border border-amber-300/60 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-amber-900/70">
        Archived {whenText(item.archived.at)} by {who(item.archived.by)}
      </p>
      <p className="text-sm font-semibold whitespace-pre-wrap [overflow-wrap:anywhere]">{item.archived.remarks}</p>
    </div>
    <div className="flex gap-2">
      <button onClick={onRestore} disabled={busy} className={smallButton}>
        Restore to public list
      </button>
      <button onClick={onDelete} disabled={busy} className={dangerButton}>
        Delete permanently
      </button>
    </div>
  </div>
);

/**
 * Everything that has been archived, with the remarks that were given. Tips
 * stay where they are in the database and are listed here while nothing new
 * has arrived on them; people were moved here out of the public lists.
 */
const ArchivePage = () => {
  const [tab, setTab] = useState<Tab>("tips");
  // Each list is null until it has been read successfully. A read that fails
  // leaves its list alone, so "No archived tips." is only ever said about a
  // list that was really read, and a refresh that fails keeps what was there.
  const [tips, setTips] = useState<TipItem[] | null>(null);
  const [people, setPeople] = useState<Record<PeopleKind, PersonItem[] | null>>({ wanteds: null, missings: null });
  const [names, setNames] = useState<Record<string, string>>({});
  // Which reads failed on the latest load.
  const [failed, setFailed] = useState<Source[]>([]);
  // False until the first load has finished, whichever way it went.
  const [settled, setSettled] = useState<boolean>(false);
  const [reloading, setReloading] = useState<boolean>(false);
  // Counts finished loads, so a card that failed to draw is tried again
  // against fresh data.
  const [loads, setLoads] = useState<number>(0);
  // Every action reloads the page's data, and two loads can be under way at
  // once. Only the latest one may change what is on screen.
  const latestLoad = useRef<number>(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  // How many archived tips are drawn (see TIPS_PAGE_SIZE). Kept across reloads.
  const [tipsDrawn, setTipsDrawn] = useState<number>(TIPS_PAGE_SIZE);
  // How many earlier messages each card has brought in, by tip id, so that
  // switching tabs and back does not hide them again (see useShownFollowUps.ts).
  const [followUpMemory] = useState(() => new Map<string, number>());
  const { toast } = useToast();

  // Never throws and never leaves the spinner up: whatever goes wrong ends as
  // an entry in `failed`, which the page shows with a way to try again.
  const load = async () => {
    const thisLoad = ++latestLoad.current;
    setReloading(true);
    const problems = new Set<Source>();
    try {
      // Over REST, not the SDK's get(): see staffRead.ts. Every record that
      // comes back has been through ownData, so nothing shown here can come
      // from a "__proto__" child planted in one. `records: true` because each
      // node is a set of records keyed by id, and a record must be listed (so
      // that it can be dealt with) whatever its id is.
      //
      // allSettled: each read stands alone, so one failure never blanks the
      // others.
      const results = await Promise.allSettled(
        SOURCES.map((source) => readAsStaff<unknown>(source, { records: true }))
      );
      if (thisLoad !== latestLoad.current) return;

      /** What a read returned, as a set of records; null (and noted) when it did not return one. */
      const recordsFrom = (source: Source): Records | null => {
        const result = results[SOURCES.indexOf(source)];
        if (result.status === "fulfilled") {
          if (result.value === null) return {}; // nothing is stored there
          if (typeof result.value === "object") return result.value as Records;
          // Anything else is a failed load, not an empty list.
          console.error(`${source} does not hold a list of records.`);
        } else {
          console.error(`Could not read ${source}:`, result.reason);
        }
        problems.add(source);
        return null;
      };
      /** One part of the page, worked out on its own: a fault in it is that part's problem only. */
      const part = (source: Source, work: () => void) => {
        try {
          work();
        } catch (err) {
          console.error(`Could not show what ${source} holds:`, err);
          problems.add(source);
        }
      };

      const users = recordsFrom("users");
      if (users) part("users", () => setNames(buildNames(users)));

      const policeCopies = recordsFrom("policeTips");
      const messages = recordsFrom("messages");
      if (messages) part("messages", () => setTips(buildTips(messages, policeCopies, Date.now())));

      const archivedWanteds = recordsFrom("archive/wanteds");
      if (archivedWanteds) {
        part("archive/wanteds", () => {
          const wanteds = buildPeople(archivedWanteds);
          setPeople((current) => ({ ...current, wanteds }));
        });
      }
      const archivedMissings = recordsFrom("archive/missings");
      if (archivedMissings) {
        part("archive/missings", () => {
          const missings = buildPeople(archivedMissings);
          setPeople((current) => ({ ...current, missings }));
        });
      }
    } catch (err) {
      // Nothing above is expected to get here. If something does, every part
      // of the page is in doubt, and the page says so.
      console.error("Could not load the archive:", err);
      for (const source of SOURCES) problems.add(source);
    } finally {
      if (thisLoad === latestLoad.current) {
        setFailed(SOURCES.filter((source) => problems.has(source)));
        setLoads((n) => n + 1);
        setSettled(true);
        setReloading(false);
      }
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ownEntry, never names[uid]: a uid such as "constructor" must not find
  // what every object inherits.
  const who = (uid: string) => ownEntry(names, uid) ?? "an admin";

  type Outcome = { message: string; type: "success" | "warning" };
  // `work` may return its own outcome (a partial success, say); otherwise
  // the plain success message is shown. One toast per action.
  const run = async (id: string, work: () => Promise<Outcome | void>, success: string, failure: string) => {
    setBusyId(id);
    try {
      const outcome = await work();
      toast(outcome ?? { message: success, type: "success" });
      await load();
    } catch (err) {
      console.error(failure, err);
      // A read that failed names the path it was reading, id and all. That
      // is for the console, not for a toast.
      const reason = err instanceof StaffReadError ? "the database could not be read." : FirebaseErrorHandler.handleError(err);
      toast({ message: `${failure}: ${reason}`, type: "error" });
      // Most failures here mean the page had gone stale (another admin acted
      // on the same item); showing the current state is the honest response.
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const restoreThisTip = (tip: ArchivedTip) => {
    if (!confirm("Restore this tip to the inbox?")) return;
    const admin = getAuth(app).currentUser;
    if (!admin) {
      toast({ message: "Your session has expired — please sign in again.", type: "error" });
      return;
    }
    run(tip.id, () => restoreTip(getDatabase(app), tip.id, admin.uid), "Tip restored to the inbox", "Could not restore the tip");
  };

  const deleteThisTip = (tip: ArchivedTip, hiddenFollowUps: number) => {
    // Everything stored under a tip goes with it, including later messages
    // this card has not drawn. Say so before it happens.
    const unseen = hiddenFollowUps
      ? ` ${hiddenFollowUps === 1 ? "1 earlier message" : `${hiddenFollowUps} earlier messages`} that this card does not show will be deleted with it.`
      : "";
    if (!confirm(`Delete this tip permanently? Its remarks and history go with it.${unseen}`)) return;
    run(
      tip.id,
      async () => {
        try {
          // What this card knew of the later messages goes with the request:
          // a message that arrived after this page loaded has not been read,
          // and deleting the tip would destroy it unseen.
          const { copyLeftBehind } = await deleteTipRecords(getDatabase(app), tip.id, tip.pin, {
            followUpCount: tip.followUpCount,
            latestFollowUpAt: tip.latestFollowUpAt,
          });
          if (copyLeftBehind) {
            return {
              message: "Tip deleted, but its police copy could not be removed — it will show in the inbox as a leftover to withdraw.",
              type: "warning",
            };
          }
        } catch (err) {
          if (err instanceof StaleTipError && err.reason === "newer-follow-up") {
            // Nothing was deleted. A new message usually reopens an archived
            // tip, which takes it off this page and back to the inbox, but
            // not always (another admin may have archived it again since), so
            // the toast does not say where the tip is: the reload shows it.
            return {
              message: "The tipster wrote again since this page loaded — nothing was deleted. Read the new message first: it is on this card, or in the inbox if the tip has reopened",
              type: "warning",
            };
          }
          throw err;
        }
      },
      "Tip deleted",
      "Could not delete the tip"
    );
  };

  // For a tip that could not be built or drawn. Nothing "last seen" is
  // passed: nothing of the record was shown, so there is nothing a newer
  // message could be newer than.
  const deleteUnreadableTip = (id: string, pin: string | null) => {
    if (!confirm("Delete this record permanently? It could not be displayed, so what it holds has not been read.")) return;
    run(
      id,
      async () => {
        const { copyLeftBehind } = await deleteTipRecords(getDatabase(app), id, pin);
        if (copyLeftBehind) {
          return {
            message: "Record deleted, but its police copy could not be removed — it will show in the inbox as a leftover to withdraw.",
            type: "warning",
          };
        }
      },
      "Record deleted",
      "Could not delete the record"
    );
  };

  const withdrawThisTip = (tip: ArchivedTip) => {
    if (!confirm("Withdraw this archived tip from the police? Officers lose access to it immediately.")) return;
    run(
      tip.id,
      async () => {
        if (!(await removePoliceCopy(getDatabase(app), tip.id))) throw new Error("permission denied");
      },
      "Withdrawn from police",
      "Could not withdraw the tip"
    );
  };

  const restorePerson = (kind: PeopleKind, { person }: ArchivedPerson) => {
    if (!confirm(`Restore ${person.name} to the public ${kind === "wanteds" ? "wanted" : "missing"} list? They reappear on the website and in the app.`)) return;
    run(person.id, () => PersonArchiveService.restore(kind, person.id), `${person.name} restored to the public list`, "Could not restore");
  };

  const deletePerson = (kind: PeopleKind, { person }: ArchivedPerson) => {
    if (!confirm(`Delete ${person.name} permanently, picture included?`)) return;
    run(person.id, () => PersonArchiveService.deleteArchived(kind, person.id, person.image), `${person.name} deleted`, "Could not delete");
  };

  // For a person's record that could not be built or drawn. The picture is
  // removed with it only where its path is known.
  const deleteUnreadablePerson = (kind: PeopleKind, id: string, imagePath?: string) => {
    if (!confirm("Delete this record permanently? It could not be displayed in full.")) return;
    run(id, () => PersonArchiveService.deleteArchived(kind, id, imagePath), "Record deleted", "Could not delete");
  };

  const shown: TipItem[] | PersonItem[] | null = tab === "tips" ? tips : people[tab];
  // Whether the list on this tab could not be read on the latest load.
  const tabFailed = failed.includes(TAB_SOURCE[tab]);
  const countOf = (key: Tab): number | null => (key === "tips" ? tips : people[key])?.length ?? null;

  return (
    <div className="w-full min-h-fit font-nunito text-amber-950">
      <h1 className="font-bold text-3xl text-center my-2 p-2">Archive</h1>
      <p className="text-center text-sm text-amber-900/70 max-w-2xl mx-auto mb-4 px-4">
        Closed tips and people taken off the public lists, with the remarks given when they were archived.
        Restore puts something back exactly where it was. A tipster who writes again reopens their tip on their own.
      </p>

      <div className="flex justify-center gap-2 mb-4 px-4" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-2xl font-bold border transition-colors duration-200 ${
              tab === t.key
                ? "bg-white/55 border-white/80 shadow-sm"
                : "bg-white/25 border-white/50 hover:bg-white/40"
            }`}
          >
            {t.label}
            {/* "?" for a list that has never been read: not the same as 0. */}
            <span className="ml-2 text-sm text-amber-900/70">{!settled ? "…" : countOf(t.key) ?? "?"}</span>
          </button>
        ))}
      </div>

      {settled && failed.length ? (
        <div
          role="alert"
          className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-5 mb-4 mx-4 sm:mx-auto max-w-2xl text-center shadow-[0_8px_32px_rgba(120,72,10,0.12)]"
        >
          <p className="font-bold text-lg">Some of the archive could not be loaded</p>
          <ul className="text-sm text-amber-900/80 mt-1 flex flex-col gap-1">
            {failed.map((source) => (
              <li key={source}>{PROBLEM_TEXT[source]}</li>
            ))}
          </ul>
          <p className="text-sm text-amber-900/80 mt-1 mb-4">
            Anything still on the page is as it was when it last loaded. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={load}
            disabled={reloading}
            className="bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-2 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reloading ? "Trying again…" : "Try again"}
          </button>
        </div>
      ) : null}

      {!settled ? (
        <div className="w-full min-h-96 flex justify-center items-center">
          <div role="status" className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : shown === null ? (
        // Never read, so nothing is known about it. Not the empty state.
        <p className="text-center text-amber-900/80 py-16 px-4">
          {tab === "tips"
            ? "The archived tips could not be read, so none are shown. That does not mean there are none."
            : `The archived ${tab === "wanteds" ? "wanted" : "missing"} persons could not be read, so none are shown. That does not mean there are none.`}
        </p>
      ) : shown.length === 0 ? (
        // Never beside a failure: after a failed read nobody knows whether
        // the list is empty.
        tabFailed ? null : (
          <p className="text-center text-amber-900/70 py-16">
            {tab === "tips" ? "No archived tips." : `No archived ${tab === "wanteds" ? "wanted" : "missing"} persons.`}
          </p>
        )
      ) : tab === "tips" ? (
        <div>
          <ShownFollowUpsMemory value={followUpMemory}>
          {(tips ?? []).slice(0, tipsDrawn).map((tip) => {
            const busy = busyId === tip.id;
            const unreadable = (
              <UnreadableCard
                id={tip.id}
                what="tip"
                busy={busy}
                onDelete={() => deleteUnreadableTip(tip.id, tip.kind === "tip" ? tip.pin : null)}
              />
            );
            return (
              // Building the list catches what can be checked beforehand; the
              // boundary catches what only shows up while React draws the card.
              <CardBoundary key={tip.id} resetKey={loads} fallback={unreadable}>
                {tip.kind === "tip" ? (
                  <ArchivedTipCard
                    tip={tip}
                    busy={busy}
                    who={who}
                    onRestore={() => restoreThisTip(tip)}
                    onDelete={(hiddenFollowUps) => deleteThisTip(tip, hiddenFollowUps)}
                    onWithdraw={() => withdrawThisTip(tip)}
                  />
                ) : (
                  unreadable
                )}
              </CardBoundary>
            );
          })}
          </ShownFollowUpsMemory>
          {(tips ?? []).length > tipsDrawn ? (
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-5 my-3 max-w-md mx-auto text-center shadow-[0_8px_32px_rgba(120,72,10,0.12)]">
              <p className="text-sm text-amber-900/80 mb-4">
                The {tipsDrawn} most recently archived are shown.{" "}
                {(tips ?? []).length - tipsDrawn === 1
                  ? "1 older one is"
                  : `${(tips ?? []).length - tipsDrawn} older ones are`}{" "}
                not shown yet.
              </p>
              <button
                type="button"
                onClick={() => setTipsDrawn((n) => n + TIPS_PAGE_SIZE)}
                className="bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-2 rounded-xl transition-all duration-200 active:scale-95"
              >
                Show {Math.min(TIPS_PAGE_SIZE, (tips ?? []).length - tipsDrawn)} more
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {(people[tab] ?? []).map((item) => {
            const busy = busyId === item.id;
            const unreadable = (
              <UnreadableCard
                id={item.id}
                what="person"
                name={item.kind === "person" ? item.person.name : undefined}
                busy={busy}
                onDelete={() => deleteUnreadablePerson(tab, item.id, item.kind === "person" ? item.person.image : undefined)}
              />
            );
            return (
              <CardBoundary key={item.id} resetKey={loads} fallback={unreadable}>
                {item.kind === "person" ? (
                  <ArchivedPersonCard
                    item={item}
                    kind={tab}
                    busy={busy}
                    who={who}
                    onRestore={() => restorePerson(tab, item)}
                    onDelete={() => deletePerson(tab, item)}
                  />
                ) : (
                  unreadable
                )}
              </CardBoundary>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArchivePage;
