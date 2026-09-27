"use client";
import ArchivePrompt from "@/components/ArchivePrompt";
import app from "@/lib/firebase";
import { archiveTip, deleteTipRecords, StaleTipError } from "@/lib/tipAdmin";
import { dateReader } from "@/lib/utils";
import { useToast } from "@/lib/toastContext";
import { encryptText } from "@/lib/tipCrypto";
import { getAuth } from "firebase/auth";
import { get, getDatabase, ref, remove, set } from "firebase/database";
import { useState } from "react";

type FollowUp = { id: string; message: string; created_at?: number; raw: Record<string, unknown> };
type PoliceState = { forwarded_at: number; note: string; sharedFollowUps: string[] } | null;

const smallButton =
  "bg-white/40 border border-white/60 hover:bg-white/55 text-amber-950 font-bold text-sm px-3 py-1.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

const MessageItem = ({ item, refreshFunc }: any) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [forwardOpen, setForwardOpen] = useState<boolean>(false);
  const [archiveOpen, setArchiveOpen] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const { toast } = useToast();
  const police: PoliceState = item.police ?? null;
  const reopened = item.status === "reopened";

  // Every action here is attributed to the signed-in admin; if the session
  // has lapsed, say so instead of doing nothing.
  const requireAdmin = () => {
    const admin = getAuth(app).currentUser;
    if (!admin) toast({ message: "Your session has expired — please sign in again.", type: "error" });
    return admin;
  };

  const copyPin = async () => {
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
      if (item.followUps?.length) {
        // Everything that exists at forwarding time has been reviewed by the
        // admin doing the forwarding; later messages need an explicit share.
        copy.followUps = Object.fromEntries(item.followUps.map((f: FollowUp) => [f.id, f.raw]));
      }
      await set(ref(getDatabase(app), `policeTips/${item.id}`), copy);
      setForwardOpen(false);
      setNote("");
      toast({ message: "Forwarded to police", type: "success" });
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

  const shareFollowUp = async (followUp: FollowUp) => {
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
      // The newest message this card showed; anything newer in the database
      // arrived after the page loaded and must be seen before archiving.
      const lastSeen = Math.max(0, ...(item.followUps ?? []).map((f: FollowUp) => f.created_at ?? 0));
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
    if (!confirm("Delete this tip permanently? Archive it instead if you want to keep a record.")) {
      return;
    }
    setLoading(true);
    try {
      const { copyLeftBehind } = await deleteTipRecords(getDatabase(app), id, item.pin);
      toast(
        copyLeftBehind
          ? { message: "Tip deleted, but its police copy could not be removed. It will show here as a leftover copy — withdraw it.", type: "warning" }
          : { message: "Tip deleted", type: "success" }
      );
      await refreshFunc();
    } catch (err) {
      toast({ message: "Could not delete tip. Please try again.", type: "error" });
      console.error("Could not delete tip:", err);
    } finally {
      setLoading(false);
    }
  };

  // A police copy whose original tip no longer exists. Officers can still read
  // it, so it stays visible here until an admin withdraws it.
  if (item.orphanPoliceCopy) {
    return (
      <div className="bg-white/25 backdrop-blur-xl border border-red-400/60 text-amber-950 max-w-md mx-auto rounded-2xl shadow-[0_8px_32px_rgba(120,72,10,0.12)] my-2 p-4 flex flex-col gap-2 font-nunito">
        <p className="text-xs uppercase tracking-wide text-red-800">Police copy of a deleted tip</p>
        <p className="text-sm text-amber-900/80">
          The original tip is gone, but officers can still read this copy. Withdraw it to remove their access.
        </p>
        <p className="font-bold whitespace-pre-wrap">{item.message}</p>
        <p className="text-xs text-amber-900/70">
          {item.pin ? `PIN ${item.pin} · ` : ""}Forwarded {dateReader(item.forwarded_at)}
        </p>
        <div>
          <button onClick={withdrawFromPolice} disabled={busy} className={smallButton}>
            Withdraw from police
          </button>
        </div>
      </div>
    );
  }

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
            This tip was archived {dateReader(item.archive.at)} with the remarks{" "}
            <span className="italic whitespace-pre-wrap">“{item.archive.remarks}”</span>, and the tipster has written since.
            {police
              ? " The police still hold a copy of this tip."
              : " If officers should see the new message, forward the tip to them."}
          </p>
        </div>
      ) : null}

      <p className="font-bold font-nunito text-xl whitespace-pre-wrap">{item.message}</p>

      {item.followUps?.length ? (
        <div className="mt-4 border-l-2 border-amber-900/25 pl-3 flex flex-col gap-3">
          <p className="font-nunito text-xs uppercase tracking-wide text-amber-900/70">
            {item.followUps.length === 1
              ? "1 later message"
              : `${item.followUps.length} later messages`}
          </p>
          {item.followUps.map((followUp: FollowUp) => (
            <div key={followUp.id}>
              <p className="font-nunito whitespace-pre-wrap">{followUp.message}</p>
              <p className="font-nunito text-xs text-amber-900/70 pt-0.5">
                {dateReader(followUp.created_at as number)}
                {reopened && item.archive && (followUp.created_at ?? 0) > item.archive.at ? " · after archiving" : ""}
              </p>
              {police ? (
                police.sharedFollowUps.includes(followUp.id) ? (
                  <p className="font-nunito text-xs text-green-800 pt-0.5">Shared with police</p>
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
            className="inline-flex items-center gap-2 bg-white/40 border border-white/60 hover:bg-white/55 rounded-lg px-3 py-1.5 transition-colors duration-200"
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
            <p className="text-sm font-bold">Forwarded to police · {dateReader(police.forwarded_at)}</p>
            {police.note ? (
              <p className="text-sm text-amber-900/80 whitespace-pre-wrap">Note to officers: {police.note}</p>
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
              Officers will see this tip,{item.pin ? " its PIN," : ""}
              {item.followUps?.length ? " the messages so far," : ""} and your note. Anything the
              tipster sends later stays with you until you share it.
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
          <button onClick={() => setForwardOpen(true)} className={smallButton}>
            Forward to police
          </button>
        )}
      </div>

      <p className="font-nunito font-semibold text-sm text-amber-900/80 pt-2">
        Sent : {dateReader(item.created_at)}
      </p>

      <div className="pt-6 font-nunito">
        {archiveOpen ? (
          <ArchivePrompt
            id={item.id}
            title={reopened ? "Archive this tip again" : "Archive this tip"}
            hint={`The tip leaves the inbox and keeps your remarks.${police ? " Officers lose access to it." : ""} If the tipster writes again it comes back here as reopened.`}
            confirmLabel={reopened ? "Archive again" : "Archive"}
            busy={busy}
            onConfirm={archiveThisTip}
            onCancel={() => setArchiveOpen(false)}
          />
        ) : (
          <button
            onClick={() => setArchiveOpen(true)}
            disabled={busy}
            className="bg-white/40 border border-white/60 hover:bg-white/55 text-amber-950 w-full p-2 min-w-40 rounded-md font-mono tracking-wider font-extrabold disabled:opacity-50"
          >
            {reopened ? "ARCHIVE AGAIN" : "ARCHIVE"}
          </button>
        )}
      </div>
      <div className="flex justify-center pt-2">
        <button
          onClick={() => deleteMessage(item.id)}
          disabled={busy}
          className="bg-red-700 hover:bg-red-600 text-white w-full p-2 min-w-40 rounded-md font-mono tracking-wider font-extrabold disabled:opacity-50"
        >
          DELETE
        </button>
      </div>
    </div>
  );
};

export default MessageItem;
