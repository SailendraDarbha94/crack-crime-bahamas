"use client";
import { BUTTON } from "@/components/ui/buttonStyles";
import CardBoundary from "@/components/CardBoundary";
import { tipArchiveStatus } from "@/lib/archive";
import { ownEntry } from "@/lib/ownData";
import { latestNotFuture, recordsOf, textOf, timeOf } from "@/lib/safeRecord";
import { readAsStaff } from "@/lib/staffRead";
import { storedLabelFields } from "@/lib/tipCategories";
import { readTipText } from "@/lib/tipCrypto";
import { buildTipView, storedCopy } from "@/lib/tipView";
import { useToast } from "@/lib/toastContext";
import { ShownFollowUpsMemory } from "@/lib/useShownFollowUps";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CallInTipForm from "./CallInTipForm";
import MessageItem, {
  UnreadableRecordCard,
  type InboxItem,
  type InboxTip,
  type LeftoverCopy,
  type PoliceState,
} from "./MessageItem";

type Records = Record<string, unknown>;

const UNREADABLE_TIP = "[Could not decrypt this tip]";

/**
 * What a read of a whole node returned, as the set of records it holds: empty
 * when nothing is stored there, null when what is stored is not a set of
 * records at all. That last case is a failed load, not an empty list, and
 * must never be shown as "no tips".
 */
const recordSetOf = (stored: unknown): Records | null => {
  if (stored === null) return {};
  return typeof stored === "object" ? (stored as Records) : null;
};

/**
 * The record stored under `id`, or null when there is none. Looked up with
 * ownEntry, never `map[id]` (see ownData.ts). A node whose children are all
 * numbered arrives as an array with null wherever a number is unused: that
 * is a gap, not a record.
 */
const recordAt = (map: Records, id: string): unknown => ownEntry(map, id) ?? null;

/** The stored record as an object whose fields can be picked off safely. */
const fieldsOf = (stored: unknown): Records =>
  stored !== null && typeof stored === "object" ? (stored as Records) : {};

// The exact stored fields, kept verbatim so forwarding to police copies the
// ciphertext as-is rather than decrypting and re-encrypting it. Archive
// fields are deliberately not among them: officers never see remarks.
//
// A tip also carries its type of crime and how it reached us, and officers
// get both with the copy. Follow-ups have neither: they belong to their tip.
const tipRawOf = (stored: unknown): Records => ({ ...storedCopy(stored), ...storedLabelFields(stored) });

/**
 * What officers hold of a tip, or null when they hold no copy. Only admins
 * write /policeTips, but a copy is made from a tip, and a tip is a record
 * anyone may have written: nothing in it is trusted to be what is expected.
 */
const policeStateOf = (copy: unknown): PoliceState | null => {
  if (copy === null) return null;
  try {
    const fields = fieldsOf(copy);
    // A note is always stored as an encrypted string. Anything else is not a
    // note, and is not handed to the cipher.
    const note = textOf(fields.note);
    const shared = fieldsOf(fields.followUps);
    return {
      forwarded_at: timeOf(fields.forwarded_at),
      note: note ? readTipText({ message: note, encrypted: true }, "") : "",
      // Looked up one follow-up at a time, as the card draws each: the copy's
      // own list is never walked, however long it is.
      isShared: (followUpId) => recordAt(shared, followUpId) !== null,
    };
  } catch (err) {
    // The copy exists, and that is what matters most: the card must say the
    // tip is with the police and offer to withdraw it.
    console.error("The police copy of a tip could not be read in full:", err);
    return { forwarded_at: 0, note: "", isShared: () => false };
  }
};

const buildInboxTip = (
  id: string,
  stored: unknown,
  status: "open" | "reopened",
  copy: unknown,
  now: number
): InboxTip => {
  const view = buildTipView(id, stored, { unreadable: UNREADABLE_TIP, now });
  const mark = fieldsOf(fieldsOf(stored).archive);
  return {
    ...view,
    kind: "tip",
    raw: tipRawOf(stored),
    police: policeStateOf(copy),
    status,
    // Present only when reopened: the remarks from the archive that the new
    // message has just undone. `at` is read the way tipArchiveStatus reads
    // it, so "after archiving" on the card agrees with why the tip is here.
    archive:
      status === "reopened"
        ? {
            at: typeof mark.at === "number" ? timeOf(mark.at) : 0,
            remarks: readTipText({ message: textOf(mark.remarks), encrypted: true }, "[Could not read the remarks]"),
          }
        : null,
  };
};

const buildLeftoverCopy = (id: string, copy: unknown, now: number): LeftoverCopy => {
  const view = buildTipView(id, copy, { unreadable: UNREADABLE_TIP, now });
  const forwarded_at = timeOf(fieldsOf(copy).forwarded_at);
  return {
    kind: "leftover",
    id,
    message: view.message,
    pin: view.pin,
    labels: view.labels,
    forwarded_at,
    lastActivity: latestNotFuture([forwarded_at], now),
  };
};

/**
 * Where a record that could not be built sits in the list: by the time it
 * says it was sent, like any other tip, and never ahead of the clock. So a
 * genuine tip that hits a fault shows up about where it would have, and a
 * crafted one cannot park itself at the top.
 */
const roughTimeOf = (stored: unknown, field: "created_at" | "forwarded_at", now: number): number =>
  latestNotFuture([fieldsOf(stored)[field]], now);

/**
 * The inbox as the list this page draws, and how many tips are in the archive.
 *
 * Every entry is built on its own: one record that cannot be built becomes
 * one placeholder, and the rest of the inbox is none the worse for it.
 * `policeCopies` is null when /policeTips could not be read.
 */
const buildInbox = (messages: Records, policeCopies: Records | null, now: number) => {
  // Rebuilt from scratch so refreshes never duplicate entries
  const list: InboxItem[] = [];
  let archived = 0;

  // recordsOf: every record under the node, with the gaps a numbered node
  // comes back with left out.
  for (const [id, stored] of recordsOf(messages)) {
    try {
      // Archived tips live on the Archive page — unless the tipster has
      // written since, which brings the tip back here, flagged.
      const status = tipArchiveStatus(stored as Parameters<typeof tipArchiveStatus>[0], now);
      if (status === "archived") {
        archived += 1;
        continue;
      }
      list.push(buildInboxTip(id, stored, status, policeCopies ? recordAt(policeCopies, id) : null, now));
    } catch (err) {
      console.error("A tip could not be displayed:", err);
      list.push({ kind: "unreadable", id, node: "messages", lastActivity: roughTimeOf(stored, "created_at", now) });
    }
  }

  // Copies whose original tip is gone — deleted from a stale view, or the
  // cleanup failed. Officers can still read them, so they must stay
  // visible here until withdrawn.
  if (policeCopies) {
    for (const [copyId, copy] of recordsOf(policeCopies)) {
      if (recordAt(messages, copyId) !== null) continue;
      try {
        list.push(buildLeftoverCopy(copyId, copy, now));
      } catch (err) {
        console.error("A leftover police copy could not be displayed:", err);
        list.push({ kind: "unreadable", id: copyId, node: "policeTips", lastActivity: roughTimeOf(copy, "forwarded_at", now) });
      }
    }
  }

  // Police copies with no tip behind them go first. The header tells the
  // admin to withdraw them, officers can read them until that is done, and
  // only so many cards are drawn at once (see PAGE_SIZE): ordered by date
  // with everything else, an old one would be pages down. Only admins write
  // /policeTips, so nobody outside can fill the top of the list this way.
  //
  // Then the most recently active threads: a thread someone added to should
  // surface like an email thread, not sink to wherever it first arrived.
  // Every lastActivity is a finite number by now, whatever was stored.
  const first = (item: InboxItem): number =>
    item.kind === "leftover" || (item.kind === "unreadable" && item.node === "policeTips") ? 1 : 0;
  list.sort((a, b) => first(b) - first(a) || b.lastActivity - a.lastActivity);
  return { list, archived };
};

/**
 * How many cards the inbox draws to begin with, and how many more each time
 * it is asked. Anyone can file a tip, so nothing limits how many there are: a
 * flood of them must make the list long, not make the page impossible to
 * open. The list is ordered most recent first, so what is left out to begin
 * with is the oldest, and every one of them is a click away.
 */
const PAGE_SIZE = 200;

const plainButton = BUTTON;
const noticePanel =
  "bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-5 my-3 max-w-md mx-auto text-center text-amber-950 font-nunito shadow-[0_8px_32px_rgba(120,72,10,0.12)]";

const Page = () => {
  // True from the start: the first thing this page does is load.
  const [loading, setLoading] = useState<boolean>(true);
  // null until a load has succeeded. A load that fails leaves it alone, so
  // "No open tips." is only ever said about an inbox that was really read,
  // and a refresh that fails keeps what was already on screen.
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [archivedCount, setArchivedCount] = useState<number>(0);
  // Whether the latest load failed.
  const [failed, setFailed] = useState<boolean>(false);
  // False when the inbox loaded but the list of police copies did not.
  const [policeKnown, setPoliceKnown] = useState<boolean>(true);
  // Counts successful loads, so a card that failed to draw is tried again
  // against fresh data.
  const [loads, setLoads] = useState<number>(0);
  // How many cards are drawn (see PAGE_SIZE). Kept across refreshes, so an
  // admin who has paged down stays where they were after acting on a card.
  const [drawn, setDrawn] = useState<number>(PAGE_SIZE);
  // How many earlier messages each card has brought in, by tip id. The list
  // is taken down while it reloads, so the cards cannot remember this
  // themselves (see useShownFollowUps.ts).
  const [followUpMemory] = useState(() => new Map<string, number>());
  // Cards and the call-in form can each ask for a refresh, and two can be
  // under way at once. Only the latest one may change what is on screen.
  const latestLoad = useRef<number>(0);
  const { toast } = useToast();

  const fetchMessages = async () => {
    const thisLoad = ++latestLoad.current;
    setLoading(true);
    try {
      // Over REST, not the SDK's get(): see staffRead.ts. `records: true`
      // because each node is a set of records keyed by id, and a record must
      // be listed (so that it can be dealt with) whatever its id is.
      //
      // Which tips are with the police, and which of their follow-ups. Read
      // on its own, with its own failure, so a problem here never hides the
      // inbox itself.
      const policeRead: Promise<Records | null> = readAsStaff<unknown>("policeTips", { records: true }).then(
        (stored) => {
          const copies = recordSetOf(stored);
          if (!copies) console.error("policeTips does not hold a list of records.");
          return copies;
        },
        (err) => {
          console.error("Could not read which tips are forwarded to police:", err);
          return null;
        }
      );

      // What is shown comes from what each record really holds (readAsStaff
      // passes every record through ownData), never from a "__proto__" child
      // someone planted.
      const messages = recordSetOf(await readAsStaff<unknown>("messages", { records: true }));
      if (!messages) throw new Error("messages does not hold a list of records.");
      const policeCopies = await policeRead;

      const { list, archived } = buildInbox(messages, policeCopies, Date.now());
      if (thisLoad !== latestLoad.current) return;
      setItems(list);
      setArchivedCount(archived);
      setPoliceKnown(policeCopies !== null);
      setFailed(false);
      setLoads((n) => n + 1);
    } catch (err) {
      if (thisLoad !== latestLoad.current) return;
      console.error("Error fetching tips:", err);
      setFailed(true);
      toast({ message: "Could not load tips. Please try again.", type: "error" });
    } finally {
      if (thisLoad === latestLoad.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = items ?? [];
  const tips = list.filter((m): m is InboxTip => m.kind === "tip");
  const unreadableTips = list.filter((m) => m.kind === "unreadable" && m.node === "messages").length;
  const leftovers = list.length - tips.length - unreadableTips;
  const forwardedCount = tips.filter((m) => m.police).length;
  const reopenedCount = tips.filter((m) => m.status === "reopened").length;
  // The counts above are of the whole inbox; only this many cards are drawn.
  const notDrawn = Math.max(0, list.length - drawn);

  return (
    <div className="w-full min-h-fit">
      <h1 className="font-nunito font-bold text-3xl text-center my-2 p-2 text-amber-950">
        Tip Messages
      </h1>
      {!loading && items !== null && (list.length || archivedCount) ? (
        <p className="font-nunito text-center text-sm text-amber-900/70 mb-2">
          {tips.length} {tips.length === 1 ? "tip" : "tips"} ·{" "}
          {policeKnown ? `${forwardedCount} with the police` : "police status unknown"}
          {reopenedCount ? ` · ${reopenedCount} reopened by ${reopenedCount === 1 ? "the tipster" : "tipsters"}` : ""}
          {leftovers ? ` · ${leftovers} leftover police ${leftovers === 1 ? "copy" : "copies"} to withdraw` : ""}
          {unreadableTips ? ` · ${unreadableTips} that could not be displayed` : ""}
          {archivedCount ? (
            <>
              {" · "}
              <Link href="/admin/archive" className="underline hover:text-amber-950">
                {archivedCount} archived
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      <CallInTipForm onSaved={fetchMessages} />
      {loading ? (
        <div className="w-full min-h-96 flex justify-center items-center">
          <div role="status" className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <div>
          {failed ? (
            <div role="alert" className={noticePanel}>
              <p className="font-bold text-lg">Could not load the tips</p>
              <p className="text-sm text-amber-900/80 mb-4">
                {items === null
                  ? "The inbox could not be read, so no tips are shown. That does not mean there are none. Check your connection and try again."
                  : "The inbox could not be read again. What is below is as it was when it last loaded, and may be out of date."}
              </p>
              <button type="button" onClick={fetchMessages} className={plainButton}>
                Try again
              </button>
            </div>
          ) : null}

          {items !== null && !policeKnown ? (
            <div role="alert" className={noticePanel}>
              <p className="font-bold">Could not check which tips are with the police</p>
              <p className="text-sm text-amber-900/80 mb-4">
                Every tip is listed below, but none is marked as forwarded and leftover police copies
                are not listed, because that part could not be read. A tip may already be with officers.
              </p>
              <button type="button" onClick={fetchMessages} className={plainButton}>
                Try again
              </button>
            </div>
          ) : null}

          {/* Never after a failure: nobody knows then whether the inbox is empty. */}
          {items !== null && !list.length && !failed ? (
            <p className="font-nunito text-center text-amber-900/70 py-16">
              No open tips.{archivedCount ? " Everything else is in the archive." : ""}
            </p>
          ) : null}

          <ShownFollowUpsMemory value={followUpMemory}>
          {list.slice(0, drawn).map((item) => (
            // Building the list catches what can be checked beforehand; the
            // boundary catches what only shows up while React draws the card.
            // Either way the cost of one bad record is one placeholder.
            <CardBoundary
              key={item.id}
              resetKey={loads}
              fallback={
                <UnreadableRecordCard
                  id={item.id}
                  node={item.kind === "leftover" || (item.kind === "unreadable" && item.node === "policeTips") ? "policeTips" : "messages"}
                  pin={item.kind === "tip" ? item.pin : null}
                  refreshFunc={fetchMessages}
                />
              }
            >
              <MessageItem item={item} refreshFunc={fetchMessages} policeKnown={policeKnown} />
            </CardBoundary>
          ))}
          </ShownFollowUpsMemory>

          {notDrawn ? (
            <div className={noticePanel}>
              <p className="text-sm text-amber-900/80 mb-4">
                The {drawn} most recently active are shown. {notDrawn === 1 ? "1 older one is" : `${notDrawn} older ones are`} not
                shown yet.
              </p>
              <button type="button" onClick={() => setDrawn((n) => n + PAGE_SIZE)} className={plainButton}>
                Show {Math.min(PAGE_SIZE, notDrawn)} more
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Page;
