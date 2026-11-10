"use client";
import TipCategoryFields from "@/components/TipCategoryFields";
import app from "@/lib/firebase";
import { missingCategoryField } from "@/lib/tipCategories";
import { useToast } from "@/lib/toastContext";
import { getAuth } from "firebase/auth";
import { useEffect, useRef, useState } from "react";

const smallButton =
  "bg-white/40 border border-white/60 hover:bg-white/55 text-amber-950 font-bold text-sm px-3 py-1.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

const MAX_TIP_LENGTH = 10000;

type Missing = "category" | "other" | "tip" | null;

/**
 * For a tip someone phoned in: an admin types up what the caller said. It goes
 * through the same intake route as every other tip (so it is encrypted, timed
 * and given a PIN the same way) and is stored with the source "call".
 *
 * The route only accepts "call" from a signed-in admin, and writes the tip as
 * that admin so the database rules can refuse it from anyone else.
 */
const CallInTipForm = ({ onSaved }: { onSaved: () => Promise<void> | void }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [category, setCategory] = useState<string>("");
  const [other, setOther] = useState<string>("");
  const [tip, setTip] = useState<string>("");
  const [missing, setMissing] = useState<Missing>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [saved, setSaved] = useState<{ pin: string; threaded: boolean } | null>(null);
  const tipRef = useRef<HTMLTextAreaElement>(null);
  const savedRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // The form is replaced by the confirmation; move focus there so the PIN is
  // announced and keyboard users are not left on nothing.
  useEffect(() => {
    if (saved) savedRef.current?.focus();
  }, [saved]);

  const reset = () => {
    setCategory("");
    setOther("");
    setTip("");
    setMissing(null);
    setSaved(null);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const missingField = missingCategoryField(category, other);
    if (missingField) {
      setMissing(missingField);
      document.getElementById(missingField === "category" ? "call-category" : "call-category-other")?.focus();
      return;
    }
    if (!tip.trim()) {
      setMissing("tip");
      tipRef.current?.focus();
      return;
    }
    setMissing(null);

    const admin = getAuth(app).currentUser;
    if (!admin) {
      toast({ message: "Your session has expired — please sign in again.", type: "error" });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await admin.getIdToken()}`,
        },
        body: JSON.stringify({
          message: tip.trim(),
          category,
          category_other: other.trim() || undefined,
          source: "call",
        }),
      });
      const body = await res.json().catch(() => null);
      const pin = body?.data;
      if (res.ok && typeof pin === "string" && pin && pin !== "request failure") {
        // What was typed is kept on screen until the tip is known to be saved.
        setCategory("");
        setOther("");
        setTip("");
        setSaved({ pin, threaded: body.threaded === true });
        await onSaved();
      } else if (res.status === 403) {
        toast({ message: "Only administrators can log a call-in tip. Please sign in again.", type: "error" });
      } else {
        toast({ message: "Could not save the tip. Nothing was lost: please try again.", type: "error" });
      }
    } catch (err) {
      console.error("Could not save the call-in tip:", err);
      toast({ message: "Could not save the tip. Nothing was lost: please try again.", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="flex justify-center mb-3">
        <button onClick={() => setOpen(true)} className={smallButton}>
          Log a call-in tip
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/25 backdrop-blur-xl border border-white/50 text-amber-950 max-w-md mx-auto rounded-2xl shadow-[0_8px_32px_rgba(120,72,10,0.12)] my-2 mb-4 p-4 font-nunito">
      <h2 className="font-bold text-xl">Call-in tip</h2>
      {saved ? (
        <div ref={savedRef} tabIndex={-1} className="flex flex-col gap-3 pt-2 focus:outline-none">
          <p className="text-sm text-amber-900/80">
            {saved.threaded
              ? "Added to the caller's earlier tip. It is in the inbox below."
              : "Saved. It is in the inbox below, marked as a call."}
          </p>
          <div className="rounded-xl bg-white/40 border border-white/60 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wide text-amber-900/70">
              {saved.threaded ? "Tip PIN" : "PIN for the caller"}
            </p>
            <p className="font-mono font-extrabold text-2xl tracking-[0.3em]">{saved.pin}</p>
          </div>
          {saved.threaded ? null : (
            <p className="text-sm text-amber-900/80">
              Give the caller this PIN. If they call, text or write again about this tip, the PIN
              at the start of the message adds it to this tip.
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={() => setSaved(null)} className={smallButton}>
              Log another
            </button>
            <button onClick={close} className={smallButton}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={save} noValidate className="flex flex-col gap-2 pt-2">
          <p className="text-sm text-amber-900/80">
            For a tip someone phoned in. It is saved like any other tip, with the date and time,
            and marked as a call.
          </p>
          <TipCategoryFields
            idPrefix="call"
            compact
            category={category}
            other={other}
            onCategory={(id) => {
              setCategory(id);
              if (missing === "category" || missing === "other") setMissing(null);
            }}
            onOther={(text) => {
              setOther(text);
              if (missing === "other") setMissing(null);
            }}
            missing={missing === "category" || missing === "other" ? missing : null}
            disabled={busy}
          />
          <label htmlFor="call-tip" className="text-sm font-bold">
            What the caller said
          </label>
          <textarea
            id="call-tip"
            ref={tipRef}
            value={tip}
            onChange={(e) => {
              setTip(e.target.value);
              if (missing === "tip") setMissing(null);
            }}
            rows={6}
            maxLength={MAX_TIP_LENGTH}
            disabled={busy}
            aria-required="true"
            aria-invalid={missing === "tip"}
            placeholder="Write down what the caller reported. Leave out anything that identifies the caller."
            className={`w-full rounded-lg bg-white/50 border ${missing === "tip" ? "border-red-600" : "border-white/60"} px-3 py-2 text-sm text-amber-950 placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60 disabled:opacity-60`}
          />
          {missing === "tip" ? (
            <p role="alert" className="text-sm font-semibold text-red-800">
              Please write what the caller said.
            </p>
          ) : null}
          <p className="text-xs text-amber-900/70">
            Caller adding to an earlier tip? Start with its PIN and this is added to that tip.
          </p>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={busy} className={smallButton}>
              {busy ? "Saving…" : "Save tip"}
            </button>
            <button type="button" onClick={close} disabled={busy} className={smallButton}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CallInTipForm;
