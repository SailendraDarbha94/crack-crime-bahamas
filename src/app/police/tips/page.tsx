"use client";
import CardBoundary from "@/components/CardBoundary";
import TipLabels from "@/components/TipLabels";
import { latestNotFuture, textOf, timeOf } from "@/lib/safeRecord";
import { readAsStaff } from "@/lib/staffRead";
import { readTipText } from "@/lib/tipCrypto";
import { buildTipView, type TipView } from "@/lib/tipView";
import { hiddenText, showEarlierLabel, useShownFollowUps } from "@/lib/useShownFollowUps";
import { dateReader } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

type ForwardedTip = {
  kind: "tip";
  id: string;
  /** The tip itself, with every field already safe to draw (see tipView.ts). */
  view: TipView;
  /** Crime Stoppers' note to officers, decrypted; empty when there is none. */
  note: string;
  /** When the tip was forwarded, in milliseconds; 0 when the copy does not say. */
  forwarded_at: number;
  /** For putting the most recently forwarded or added-to copies first. */
  lastActivity: number;
};
/** A copy that could not be turned into a card. It is listed, as a placeholder. */
type UnreadableCopy = { kind: "unreadable"; id: string };
type Item = ForwardedTip | UnreadableCopy;

// The latest moment a calendar date can stand for. A stored number beyond it
// is finite, so it passes for a time, but formats as "NaN-NaN-NaN".
const LATEST_DATE_MS = 8.64e15;

/** A stored time as the page shows it, or "date unknown" when there is none to show. */
const whenText = (ms: number): string =>
  ms > 0 && ms <= LATEST_DATE_MS ? dateReader(ms) : "date unknown";

/**
 * The stored copies as the list this page draws.
 *
 * Only admins write /policeTips, but what they write is copied verbatim from
 * tips, and a tip is a record anyone may have written. So nothing in a copy is
 * trusted to be what this page expects: each copy is built on its own, and one
 * that cannot be built becomes a placeholder instead of costing officers the
 * whole list.
 */
const buildList = (stored: unknown, now: number): Item[] => {
  if (stored === null) return []; // nothing has been forwarded
  // Anything else that is not a set of records is a failed load, not an empty
  // list: officers must never be told there are no tips because of it.
  if (typeof stored !== "object") throw new Error("policeTips does not hold a list of records.");

  const unreadable: UnreadableCopy[] = [];
  const tips: ForwardedTip[] = [];
  for (const [id, entry] of Object.entries(stored)) {
    // Numbered children come back as an array, with null wherever a number is
    // unused. That is a gap, not a copy.
    if (entry === null || entry === undefined) continue;
    try {
      if (typeof entry !== "object" || Array.isArray(entry)) throw new Error("The copy is not a record.");
      const record = entry as Record<string, unknown>;
      const view = buildTipView(id, record, { unreadable: "[Could not read this tip]", now });
      // A note is always stored as an encrypted string. Anything else is not
      // a note, and is not handed to the cipher.
      const storedNote = textOf(record.note);
      const forwarded_at = timeOf(record.forwarded_at);
      tips.push({
        kind: "tip",
        id,
        view,
        note: storedNote ? readTipText({ message: storedNote, encrypted: true }, "") : "",
        forwarded_at,
        // The newest follow-up counts even when the card does not show all
        // of them. A time in the future is passed over (see safeRecord.ts),
        // so it cannot hold a copy at the top of the list.
        lastActivity: latestNotFuture([forwarded_at, view.lastActivity], now),
      });
    } catch (err) {
      console.error("A forwarded tip could not be displayed:", err);
      unreadable.push({ kind: "unreadable", id });
    }
  }
  // Most recently forwarded or added-to first
  tips.sort((a, b) => b.lastActivity - a.lastActivity);
  // Copies that cannot be read go first: an officer has been sent something
  // and cannot see it, which is worth noticing before anything else.
  return (unreadable as Item[]).concat(tips);
};

/** What stands in for a copy that cannot be drawn. Officers cannot remove it; Crime Stoppers can. */
const UnreadableCard = ({ id }: { id: string }) => (
  <div>
    <p className="font-bold">This record could not be displayed</p>
    <p className="text-sm text-amber-900/80">
      A tip was forwarded to you, but something stored in it is not in a form this page can show.
      Please tell Crime Stoppers Bahamas, quoting the reference below, so they can forward it again.
    </p>
    <p className="text-xs uppercase tracking-wide text-amber-900/70 pt-2">Reference</p>
    <p className="font-mono text-sm [overflow-wrap:anywhere]">{textOf(id, "unknown")}</p>
  </div>
);

// A component of its own, so that anything that goes wrong while drawing one
// copy happens beneath that copy's CardBoundary and nowhere else.
const TipCard = ({ tip }: { tip: ForwardedTip }) => {
  const { view } = tip;
  // The newest follow-ups to begin with (see tipView.ts), the earlier ones
  // when asked: nothing that was shared may be out of an officer's reach.
  const { followUps, hidden, nextBatch, showEarlier } = useShownFollowUps(view);
  const laterMessages = view.followUpCount;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        {view.pin ? (
          <span className="inline-flex items-center gap-2 bg-white/40 border border-white/60 rounded-lg px-3 py-1.5">
            <span className="text-xs uppercase tracking-wide text-amber-900/70">PIN</span>
            <span className="font-mono font-extrabold tracking-[0.2em] text-lg">{view.pin}</span>
          </span>
        ) : (
          <span className="text-xs text-amber-900/60 italic">No PIN (older tip)</span>
        )}
        <span className="text-sm text-amber-900/80">Forwarded {whenText(tip.forwarded_at)}</span>
      </div>

      {tip.note ? (
        <div className="rounded-xl bg-amber-100/60 border border-amber-300/60 px-3 py-2 mb-3">
          <p className="text-xs uppercase tracking-wide text-amber-900/70">From Crime Stoppers</p>
          <p className="text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">{tip.note}</p>
        </div>
      ) : null}

      <TipLabels labels={view.labels} className="mb-3" />

      <p className="text-xs uppercase tracking-wide text-amber-900/70">
        Tip · received {whenText(view.created_at)}
      </p>
      {/* Wraps anywhere: a tip can be one long unbroken word, and it must stay inside the card. */}
      <p className="font-bold text-lg whitespace-pre-wrap [overflow-wrap:anywhere]">{view.message}</p>

      {laterMessages ? (
        <div className="mt-4 border-l-2 border-amber-900/25 pl-3 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-wide text-amber-900/70">
            {laterMessages === 1
              ? "1 later message from the tipster"
              : `${laterMessages} later messages from the tipster`}
          </p>
          {/* A real conversation is a handful of messages. Past the cap only
              the newest are drawn to begin with. The card says so, and offers
              the rest. */}
          {hidden ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm italic text-amber-900/80">{hiddenText(hidden)}</p>
              <button
                type="button"
                onClick={showEarlier}
                className="bg-white/40 border border-white/60 hover:bg-white/55 text-amber-950 font-bold text-sm px-3 py-1.5 rounded-lg transition-colors duration-200"
              >
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
    </>
  );
};

// Tips that Crime Stoppers has forwarded. This reads /policeTips, which
// holds only what an admin chose to share — never the full inbox.
const PoliceTipsPage = () => {
  // null until a load has succeeded. A load that fails leaves it alone, so
  // "no tips" is only ever said about a list that was really read.
  const [items, setItems] = useState<Item[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(true);
  // Counts successful loads, so a card that failed to draw is tried again
  // against fresh data.
  const [loads, setLoads] = useState(0);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      // Over REST, not the SDK's get(): see staffRead.ts.
      const stored = await readAsStaff<unknown>("policeTips", { records: true });
      setItems(buildList(stored, Date.now()));
      setLoads((n) => n + 1);
      setFailed(false);
    } catch (err) {
      console.error("Could not load forwarded tips:", err);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="w-full min-h-screen font-nunito p-4 md:p-10">
      <h1 className="font-bold text-4xl md:text-5xl text-center text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)] mb-2">
        Forwarded Tips
      </h1>
      <p className="text-center text-amber-900/80 max-w-2xl mx-auto mb-8">
        Tips Crime Stoppers Bahamas has passed to you. Tipsters are anonymous; the PIN is how
        Crime Stoppers refers to a tip, so quote it when you follow up with them.
      </p>

      <div className="max-w-2xl mx-auto">
        {failed ? (
          <div
            role="alert"
            className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-5 mb-4 text-center text-amber-950 shadow-[0_8px_32px_rgba(120,72,10,0.12)]"
          >
            <p className="font-bold text-lg">Could not load the tips</p>
            <p className="text-sm text-amber-900/80 mb-4">
              {items === null
                ? "The forwarded tips could not be read, so none are shown. That does not mean there are none. Check your connection and try again."
                : "The list could not be read again. What is below is as it was when it last loaded."}
            </p>
            <button
              type="button"
              onClick={load}
              disabled={busy}
              className="bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-2 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Trying again…" : "Try again"}
            </button>
          </div>
        ) : null}

        {items === null ? (
          failed ? null : (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-800"></div>
            </div>
          )
        ) : items.length === 0 ? (
          // Never beside the failure panel: after a failed load nobody knows
          // whether the list is empty.
          failed ? null : (
            <p className="text-center text-amber-900/70 py-16">No tips have been forwarded to you yet.</p>
          )
        ) : (
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-2xl p-5 shadow-[0_8px_32px_rgba(120,72,10,0.12)] text-amber-950"
              >
                {/* Building the list catches what can be checked beforehand;
                    this catches what only shows up while React draws the card. */}
                <CardBoundary fallback={<UnreadableCard id={item.id} />} resetKey={loads}>
                  {item.kind === "tip" ? <TipCard tip={item} /> : <UnreadableCard id={item.id} />}
                </CardBoundary>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};

export default PoliceTipsPage;
