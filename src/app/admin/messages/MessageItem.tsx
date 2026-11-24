"use client";
import { BUTTON_SM, buttonClass } from "@/components/ui/buttonStyles";
import ArchivePrompt from "@/components/ArchivePrompt";
import TipLabels from "@/components/TipLabels";
import app from "@/lib/firebase";
import { textOf } from "@/lib/safeRecord";
import { StaffReadError } from "@/lib/staffRead";
import { archiveTip, deleteTipRecords, StaleTipError } from "@/lib/tipAdmin";
import type { TipLabelData } from "@/lib/tipLabels";
import type { FollowUpView, TipView } from "@/lib/tipView";
import { dateReader } from "@/lib/utils";
import { hiddenText, showEarlierLabel, useShownFollowUps } from "@/lib/useShownFollowUps";
import { useToast } from "@/lib/toastContext";
import { encryptText } from "@/lib/tipCrypto";
import { getAuth } from "firebase/auth";
import { get, getDatabase, ref, remove, set } from "firebase/database";
import { useState } from "react";

/** What officers hold of a tip: when it went, the note, and whether a given follow-up is on their copy. */
export type PoliceState = { forwarded_at: number; note: string; isShared: (followUpId: string) => boolean };

/**
 * A tip as the inbox draws it: the safe view of the stored record (see
 * tipView.ts) and what the inbox works out on top of it.
 */
export type InboxTip = TipView & {
  kind: "tip";
  /**
   * The exact stored fields, kept verbatim so forwarding to police copies the
   * ciphertext as-is rather than decrypting and re-encrypting it.
   */
  raw: Record<string, unknown>;
  /** Null when officers hold no copy (or when that could not be checked). */
  police: PoliceState | null;
  status: "open" | "reopened";
  /**
   * Present only when reopened: the remarks from the archive that the new
   * message has just undone.
   */
  archive: { at: number; remarks: string } | null;
};

/** A police copy whose original tip no longer exists. */
export type LeftoverCopy = {
  kind: "leftover";
  id: string;
  message: string;
  pin: string | null;
  labels: TipLabelData;
  forwarded_at: number;
  lastActivity: number;
};

/** A record that could not be turned into a card. It is listed, as a placeholder. */
export type UnreadableRecord = {
  kind: "unreadable";
  id: string;
  /** Where the record is stored, which decides what removing it means. */
  node: "messages" | "policeTips";
  lastActivity: number;
};

export type InboxItem = InboxTip | LeftoverCopy | UnreadableRecord;

type Refresh = () => Promise<void>;

const smallButton = BUTTON_SM;

/**
 * A time as the page shows it. Every time a card is given has been through
 * `timeOf` (safeRecord.ts), which answers 0 for anything that is not a moment
 * a date can stand for: 0 is "date unknown", never 1970.
 */
const whenText = (ms: number): string => (ms > 0 ? dateReader(ms) : "date unknown");

/**
 * True when a stored follow-up is something the police copy can hold. The
 * rules for /policeTips take a follow-up only as text with a numeric time, and
 * one they refuse would take the whole forward down with it: a single odd
 * message stored on a tip must not be what stops the tip reaching officers.
 */
const canBeCopied = (raw: Record<string, unknown>): boolean =>
  typeof raw.message === "string" &&
  raw.message.length > 0 &&
  typeof raw.created_at === "number" &&
  Number.isFinite(raw.created_at);

/**
 * What stands in for a record that could not be built or drawn. It shows
 * nothing from the record but its id, so nothing stored can stop THIS from
 * drawing, and it still lets an admin clear the record away: without that the
 * only cure for a broken record would be the Firebase console.
 */
export const UnreadableRecordCard = ({
  id,
  node = "messages",
  pin = null,
  refreshFunc,
}: {
  id: string;
  node?: "messages" | "policeTips";
  /** The tip's PIN where it is known, so its index entry is cleared with it. */
  pin?: string | null;
  refreshFunc: Refresh;
}) => {
  const [busy, setBusy] = useState<boolean>(false);
  const { toast } = useToast();
  const isPoliceCopy = node === "policeTips";

  const removeRecord = async () => {
    if (
      !confirm(
        isPoliceCopy
          ? "Withdraw this copy from the police? Officers lose access to it immediately."
          : "Delete this record permanently? It could not be displayed, so what it holds has not been read."
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      if (isPoliceCopy) {
        await remove(ref(getDatabase(app), `policeTips/${id}`));
        toast({ message: "Withdrawn from police", type: "success" });
      } else {
        // Nothing "last seen" is passed: nothing of this record was shown, so
        // there is nothing a newer message could be newer than.
        const { copyLeftBehind } = await deleteTipRecords(getDatabase(app), id, pin);
        toast(
          copyLeftBehind
            ? { message: "Record deleted, but its police copy could not be removed. It will show here as a leftover copy — withdraw it.", type: "warning" }
            : { message: "Record deleted", type: "success" }
        );
      }
      await refreshFunc();
    } catch (err) {
      console.error("Could not remove the record:", err);
      toast({
        message: isPoliceCopy ? "Could not withdraw this copy. Please try again." : "Could not delete this record. Please try again.",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white/25 backdrop-blur-xl border border-red-400/60 text-amber-950 max-w-md mx-auto rounded-2xl shadow-[0_8px_32px_rgba(120,72,10,0.12)] my-2 p-4 flex flex-col gap-2 font-nunito">
      <p className="font-bold">This record could not be displayed</p>
      <p className="text-sm text-amber-900/80">
        {isPoliceCopy
          ? "Something stored in this police copy is not in a form this page can show. Officers may still be able to read it. Withdraw it to remove their access."
          : "Something stored in this tip is not in a form this page can show. It is still in the database. If it might be a genuine tip, have it looked at before deleting it, quoting the id below."}
      </p>
      <p className="text-xs uppercase tracking-wide text-amber-900/70 pt-1">{isPoliceCopy ? "Police copy id" : "Tip id"}</p>
      <p className="font-mono text-sm [overflow-wrap:anywhere]">{textOf(id, "unknown")}</p>
      <div className="pt-1">
        {isPoliceCopy ? (
          <button onClick={removeRecord} disabled={busy} className={smallButton}>
            {busy ? "Withdrawing…" : "Withdraw from police"}
          </button>
        ) : (
          <button
            onClick={removeRecord}
            disabled={busy}
            className={buttonClass({ block: true })}
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
};

// A police copy whose original tip no longer exists. Officers can still read
// it, so it stays visible here until an admin withdraws it.
const LeftoverCopyCard = ({ item, refreshFunc }: { item: LeftoverCopy; refreshFunc: Refresh }) => {
  const [busy, setBusy] = useState<boolean>(false);
  const { toast } = useToast();

  const withdrawFromPolice = async () => {
    if (!confirm("Withdraw this tip from the police? Officers lose access to it immediately.")) return;
    setBusy(true);
    try {
      await remove(ref(getDatabase(app), `policeTips/${item.id}`));
      toast({ message: "Withdrawn from police", type: "success" });
      await refreshFunc();
    } catch (err) {
      console.error("Could not withdraw the tip:", err);
      toast({ message: "Could not withdraw this tip. Please try again.", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white/25 backdrop-blur-xl border border-red-400/60 text-amber-950 max-w-md mx-auto rounded-2xl shadow-[0_8px_32px_rgba(120,72,10,0.12)] my-2 p-4 flex flex-col gap-2 font-nunito">
      <p className="text-xs uppercase tracking-wide text-red-800">Police copy of a deleted tip</p>
      <p className="text-sm text-amber-900/80">
        The original tip is gone, but officers can still read this copy. Withdraw it to remove their access.
      </p>
      <TipLabels labels={item.labels} />
      <p className="font-bold whitespace-pre-wrap [overflow-wrap:anywhere]">{item.message}</p>
      <p className="text-xs text-amber-900/70">
        {item.pin ? `PIN ${item.pin} · ` : ""}Forwarded {whenText(item.forwarded_at)}
      </p>
      <div>
        <button onClick={withdrawFromPolice} disabled={busy} className={smallButton}>
          Withdraw from police
        </button>
      </div>
    </div>
  );
};

const TipCard = ({
  item,
  refreshFunc,
  policeKnown,
}: {
  item: InboxTip;
  refreshFunc: Refresh;
  policeKnown: boolean;
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [forwardOpen, setForwardOpen] = useState<boolean>(false);
  const [archiveOpen, setArchiveOpen] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const { toast } = useToast();
  const police = item.police;
  const reopened = item.status === "reopened";
  // The card draws the newest follow-ups to begin with (see tipView.ts) and
  // the earlier ones when asked. `followUps` is what is drawn now, `hidden`
  // how many are not; the count the card gives is of all of them.
  const { followUps, hidden, nextBatch, showEarlier } = useShownFollowUps(item);
  const laterMessages = item.followUpCount;
  /** What this card knew of the tip's later messages, for the checks before archiving and deleting. */
  const lastSeen = { followUpCount: item.followUpCount, latestFollowUpAt: item.latestFollowUpAt };

  // Every action here is attributed to the signed-in admin; if the session
  // has lapsed, say so instead of doing nothing.
  const requireAdmin = () => {
    const admin = getAuth(app).currentUser;
    if (!admin) toast({ message: "Your session has expired — please sign in again.", type: "error" });
    return admin;
  };

  const copyPin = async () => {
    if (!item.pin) return;
    try {
      await navigator.clipboard.writeText(item.pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ message: "Could not copy the PIN", type: "error" });
    }
  };

  // Police get their own copy of the tip under /policeTips, holding only what
  // an admin has chosen to share. Giving them read access to the original
  // would also hand them every follow-up that arrives afterwards, reviewed or
  // not, because Realtime Database reads cover everything beneath a node.
  const forwardToPolice = async () => {
    const admin = requireAdmin();
    if (!admin) return;
    setBusy(true);
    try {
      // The rules refuse to overwrite an existing copy; check first so the
      // admin gets a plain explanation rather than a permission error.
      if ((await get(ref(getDatabase(app), `policeTips/${item.id}`))).exists()) {
        setForwardOpen(false);
        setNote("");
        toast({ message: "Already forwarded by another admin — refreshing", type: "warning" });
        await refreshFunc();
        return;
      }
      const copy: Record<string, unknown> = {
        ...item.raw, // the stored ciphertext, verbatim
        forwarded_at: Date.now(),
        forwarded_by: admin.uid,
      };
      if (item.pin) copy.pin = item.pin;
      const trimmedNote = note.trim();
      if (trimmedNote) copy.note = encryptText(trimmedNote);
      // Everything on the card at forwarding time has been reviewed by the
      // admin doing the forwarding; later messages need an explicit share.
      // Only what is ON the card: earlier follow-ups that have not been
      // brought in have not been read, so they are not sent.
      const sendable = followUps.filter((f) => canBeCopied(f.raw));
      if (sendable.length) {
        copy.followUps = Object.fromEntries(sendable.map((f) => [f.id, f.raw]));
      }
      // A stored follow-up the police copy cannot hold is left behind rather
      // than allowed to stop the forward; the card then shows it as not
      // shared, and the admin is told.
      const leftOut = followUps.length - sendable.length;
      await set(ref(getDatabase(app), `policeTips/${item.id}`), copy);
      setForwardOpen(false);
      setNote("");
      toast(
        leftOut
          ? {
              message: `Forwarded to police, but ${leftOut === 1 ? "1 later message" : `${leftOut} later messages`} could not be copied to them. The card shows which.`,
              type: "warning",
            }
          : { message: "Forwarded to police", type: "success" }
      );
      await refreshFunc();
    } catch (err) {
      console.error("Could not forward the tip:", err);
      toast({ message: "Could not forward this tip. Please try again.", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const withdrawFromPolice = async () => {
    if (!confirm("Withdraw this tip from the police? Officers lose access to it immediately.")) return;
    setBusy(true);
    try {
      await remove(ref(getDatabase(app), `policeTips/${item.id}`));
      toast({ message: "Withdrawn from police", type: "success" });
      await refreshFunc();
    } catch (err) {
      console.error("Could not withdraw the tip:", err);
      toast({ message: "Could not withdraw this tip. Please try again.", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const shareFollowUp = async (followUp: FollowUpView) => {
    setBusy(true);
    try {
      await set(ref(getDatabase(app), `policeTips/${item.id}/followUps/${followUp.id}`), followUp.raw);
      toast({ message: "Shared with police", type: "success" });
      await refreshFunc();
    } catch (err) {
      console.error("Could not share the follow-up:", err);
      toast({ message: "Could not share this message. Please try again.", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  // Archiving keeps the tip where it is, marked with the remarks, and takes it
  // off this page. The tipster's PIN keeps working; if they write again the
  // tip comes back here as "reopened".
  const archiveThisTip = async (remarks: string) => {
    const admin = requireAdmin();
    if (!admin) return;
    setBusy(true);
    try {
      // What this card knew of the later messages, counting any it does not
      // show; anything more in the database arrived after the page loaded and
      // must be seen before archiving.
      const { copyLeftBehind } = await archiveTip(getDatabase(app), item.id, admin.uid, remarks, lastSeen);
      setArchiveOpen(false);
      toast(
        copyLeftBehind
          ? { message: "Archived, but the police copy could not be withdrawn. Withdraw it from the Archive page.", type: "warning" }
          : { message: police ? "Archived and withdrawn from police" : "Archived", type: "success" }
      );
      await refreshFunc();
    } catch (err) {
      console.error("Could not archive the tip:", err);
      if (err instanceof StaleTipError) {
        // The card had gone stale: say what changed, then show the truth.
        setArchiveOpen(false);
        toast(
          err.reason === "gone"
            ? { message: "This tip was deleted by another admin — refreshing", type: "warning" }
            : { message: "The tipster wrote again since this page loaded — read the new message before archiving", type: "warning" }
        );
        await refreshFunc();
      } else {
        toast({ message: "Could not archive this tip. Please try again.", type: "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteMessage = async (id: string) => {
    // Everything stored under a tip goes with it, including later messages
    // this card has not drawn. Say so before it happens.
    const unseen = hidden
      ? ` ${hidden === 1 ? "1 earlier message" : `${hidden} earlier messages`} that this card does not show will be deleted with it.`
      : "";
    if (!confirm(`Delete this tip permanently? Archive it instead if you want to keep a record.${unseen}`)) {
      return;
    }
    setLoading(true);
    try {
      // As with archiving: a message that arrived after this page loaded has
      // not been read, and deleting the tip would destroy it unseen.
      const { copyLeftBehind } = await deleteTipRecords(getDatabase(app), id, item.pin, lastSeen);
      toast(
        copyLeftBehind
          ? { message: "Tip deleted, but its police copy could not be removed. It will show here as a leftover copy — withdraw it.", type: "warning" }
          : { message: "Tip deleted", type: "success" }
      );
      await refreshFunc();
    } catch (err) {
      console.error("Could not delete tip:", err);
      if (err instanceof StaleTipError) {
        // Nothing was deleted. Say what changed, then show the truth.
        toast(
          err.reason === "gone"
            ? { message: "This tip was deleted by another admin — refreshing", type: "warning" }
            : { message: "The tipster wrote again since this page loaded — nothing was deleted. Read the new message first", type: "warning" }
        );
        await refreshFunc();
      } else if (err instanceof StaffReadError) {
        // The check for new messages could not be made, so the delete was
        // not attempted (see deleteTipRecords).
        toast({ message: "Could not check for new messages from the tipster, so nothing was deleted. Please try again.", type: "error" });
      } else {
        toast({ message: "Could not delete tip. Please try again.", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return loading ? (
    <div className="w-full min-h-40 flex justify-center items-center">
      <div role="status" className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800"></div>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  ) : (
    <div className={`bg-white/25 backdrop-blur-xl border ${reopened ? "border-amber-500/70" : "border-white/50"} text-amber-950 max-w-md mx-auto rounded-2xl shadow-[0_8px_32px_rgba(120,72,10,0.12)] my-2 p-4 flex flex-col min-h-40 justify-between`}>
      {reopened && item.archive ? (
        <div className="rounded-xl bg-amber-100/60 border border-amber-300/60 px-3 py-2 mb-3 font-nunito">
          <p className="text-xs uppercase tracking-wide text-amber-900/70">Reopened by the tipster</p>
          <p className="text-sm">
            This tip was archived {whenText(item.archive.at)} with the remarks{" "}
            <span className="italic whitespace-pre-wrap [overflow-wrap:anywhere]">“{item.archive.remarks}”</span>, and the tipster has written since.
            {police
              ? " The police still hold a copy of this tip."
              : policeKnown
                ? " If officers should see the new message, forward the tip to them."
                : ""}
          </p>
        </div>
      ) : null}

      <TipLabels labels={item.labels} className="mb-3" />

      {/* Wraps anywhere: a tip can be one long unbroken word, and it must stay inside the card. */}
      <p className="font-bold font-nunito text-xl whitespace-pre-wrap [overflow-wrap:anywhere]">{item.message}</p>

      {laterMessages ? (
        <div className="mt-4 border-l-2 border-amber-900/25 pl-3 flex flex-col gap-3">
          <p className="font-nunito text-xs uppercase tracking-wide text-amber-900/70">
            {laterMessages === 1
              ? "1 later message"
              : `${laterMessages} later messages`}
          </p>
          {/* A real conversation is a handful of messages. Past the cap only
              the newest are drawn to begin with. The card says so, and offers
              the rest: nothing a tipster sent may be out of reach. */}
          {hidden ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-nunito text-sm italic text-amber-900/80">{hiddenText(hidden)}</p>
              <button onClick={showEarlier} className={smallButton}>
                {showEarlierLabel(hidden, nextBatch)}
              </button>
            </div>
          ) : null}
          {followUps.map((followUp) => (
            <div key={followUp.id}>
              <p className="font-nunito whitespace-pre-wrap [overflow-wrap:anywhere]">{followUp.message}</p>
              <p className="font-nunito text-xs text-amber-900/70 pt-0.5">
                {whenText(followUp.created_at)}
                {reopened && item.archive && followUp.created_at > item.archive.at ? " · after archiving" : ""}
              </p>
              {police ? (
                police.isShared(followUp.id) ? (
                  <p className="font-nunito text-xs text-green-800 pt-0.5">Shared with police</p>
                ) : !canBeCopied(followUp.raw) ? (
                  // Offering to share it would only ever end in a refusal.
                  <p className="font-nunito text-xs text-amber-900/70 pt-0.5">
                    Not shared with police: this message is not stored in a form that can be copied to them
                  </p>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-nunito text-xs text-amber-900/70">Not yet shared with police</span>
                    <button onClick={() => shareFollowUp(followUp)} disabled={busy} className={smallButton}>
                      Share
                    </button>
                  </div>
                )
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="pt-3">
        {item.pin ? (
          <button
            onClick={copyPin}
            title="Copy this tip's PIN"
            className={BUTTON_SM}
          >
            <span className="font-nunito text-xs uppercase tracking-wide text-amber-900/70">
              PIN
            </span>
            <span className="font-mono font-extrabold tracking-[0.2em] text-lg">
              {item.pin}
            </span>
            <span className="font-nunito text-xs text-amber-900/70">
              {copied ? "copied" : "copy"}
            </span>
          </button>
        ) : (
          <span className="font-nunito text-xs text-amber-900/60 italic">
            No PIN — submitted before PINs were introduced
          </span>
        )}
      </div>

      <div className="pt-3 font-nunito">
        {police ? (
          <div className="rounded-xl bg-white/40 border border-white/60 px-3 py-2 flex flex-col gap-1">
            <p className="text-sm font-bold">Forwarded to police · {whenText(police.forwarded_at)}</p>
            {police.note ? (
              <p className="text-sm text-amber-900/80 whitespace-pre-wrap [overflow-wrap:anywhere]">Note to officers: {police.note}</p>
            ) : null}
            <div>
              <button onClick={withdrawFromPolice} disabled={busy} className={smallButton}>
                Withdraw from police
              </button>
            </div>
          </div>
        ) : forwardOpen ? (
          <div className="rounded-xl bg-white/40 border border-white/60 px-3 py-2 flex flex-col gap-2">
            <label htmlFor={`note-${item.id}`} className="text-sm font-bold">
              Note for officers (optional)
            </label>
            <textarea
              id={`note-${item.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Context, urgency, anything they should know"
              className="w-full rounded-lg bg-white/50 border border-white/60 px-3 py-2 text-sm text-amber-950 placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
            />
            <p className="text-xs text-amber-900/70">
              Officers will see this tip, its type and source,{item.pin ? " its PIN," : ""}
              {followUps.length
                ? hidden
                  ? " the later messages shown on this card,"
                  : " the messages so far,"
                : ""}{" "}
              and your note. Anything the tipster sends later stays with you until you share it.
              {hidden
                ? ` Only the ${followUps.length} later messages shown above are copied: the ${hidden === 1 ? "1 earlier message that is not shown is" : `${hidden} earlier messages that are not shown are`} not sent. Show them first if officers should have them.`
                : ""}
            </p>
            <div className="flex gap-2">
              <button onClick={forwardToPolice} disabled={busy} className={smallButton}>
                {busy ? "Forwarding…" : "Forward"}
              </button>
              <button onClick={() => { setForwardOpen(false); setNote(""); }} disabled={busy} className={smallButton}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-1">
            {/* Not the same as "not forwarded": the list of police copies
                could not be read, so this card does not know either way. */}
            {policeKnown ? null : (
              <p className="text-xs text-amber-900/80">
                Could not check whether this tip is already with the police.
              </p>
            )}
            <button onClick={() => setForwardOpen(true)} className={smallButton}>
              Forward to police
            </button>
          </div>
        )}
      </div>

      <p className="font-nunito font-semibold text-sm text-amber-900/80 pt-2">
        Sent : {whenText(item.created_at)}
      </p>

      <div className="pt-6 font-nunito">
        {archiveOpen ? (
          <ArchivePrompt
            id={item.id}
            title={reopened ? "Archive this tip again" : "Archive this tip"}
            hint={`The tip leaves the inbox and keeps your remarks.${police ? " Officers lose access to it." : ""} If the tipster writes again it comes back here as reopened.${
              hidden
                ? ` ${hidden === 1 ? "1 earlier message on this tip is" : `${hidden} earlier messages on this tip are`} not shown above and ${hidden === 1 ? "has" : "have"} not been read: show ${hidden === 1 ? "it" : "them"} first.`
                : ""
            }`}
            confirmLabel={reopened ? "Archive again" : "Archive"}
            busy={busy}
            onConfirm={archiveThisTip}
            onCancel={() => setArchiveOpen(false)}
          />
        ) : (
          <button
            onClick={() => setArchiveOpen(true)}
            disabled={busy}
            className={buttonClass({ block: true })}
          >
            {reopened ? "Archive again" : "Archive"}
          </button>
        )}
      </div>
      <div className="flex justify-center pt-2">
        <button
          onClick={() => deleteMessage(item.id)}
          disabled={busy}
          className={buttonClass({ block: true })}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

/**
 * One entry of the inbox. Each kind is a component of its own, so that
 * anything that goes wrong while drawing it happens beneath the CardBoundary
 * the page wraps this in, and nowhere else.
 */
const MessageItem = ({
  item,
  refreshFunc,
  policeKnown = true,
}: {
  item: InboxItem;
  refreshFunc: Refresh;
  /** False when the list of police copies could not be read on this load. */
  policeKnown?: boolean;
}) => {
  if (item.kind === "unreadable") return <UnreadableRecordCard id={item.id} node={item.node} refreshFunc={refreshFunc} />;
  if (item.kind === "leftover") return <LeftoverCopyCard item={item} refreshFunc={refreshFunc} />;
  return <TipCard item={item} refreshFunc={refreshFunc} policeKnown={policeKnown} />;
};

export default MessageItem;
