"use client";
import { MAX_REMARKS_LENGTH, normaliseRemarks } from "@/lib/archive";
import { useState } from "react";

const smallButton =
  "bg-white/40 border border-white/60 hover:bg-white/55 text-amber-950 font-bold text-sm px-3 py-1.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Asks for the remarks that travel with an archived tip or person. Remarks
 * are mandatory: the archive is where a case's outcome is recorded, and an
 * entry with no reason would be worthless to whoever reads it later.
 */
const ArchivePrompt = ({
  id,
  title,
  hint,
  confirmLabel = "Archive",
  busyLabel = "Archiving…",
  busy = false,
  onConfirm,
  onCancel,
}: {
  id: string;
  title: string;
  hint?: string;
  confirmLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  onConfirm: (remarks: string) => void;
  onCancel: () => void;
}) => {
  const [remarks, setRemarks] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);

  const submit = () => {
    const clean = normaliseRemarks(remarks);
    if (!clean) {
      setShowError(true);
      return;
    }
    onConfirm(clean);
  };

  return (
    <div className="rounded-xl bg-white/40 border border-white/60 px-3 py-2 flex flex-col gap-2 font-nunito text-amber-950 text-left">
      <label htmlFor={`remarks-${id}`} className="text-sm font-bold">
        {title}
      </label>
      <textarea
        id={`remarks-${id}`}
        value={remarks}
        onChange={(e) => {
          setRemarks(e.target.value);
          if (showError && normaliseRemarks(e.target.value)) setShowError(false);
        }}
        rows={3}
        maxLength={MAX_REMARKS_LENGTH}
        required
        aria-invalid={showError}
        placeholder="Why this is being archived — outcome, reason, anything the next person should know"
        className="w-full rounded-lg bg-white/50 border border-white/60 px-3 py-2 text-sm text-amber-950 placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
      />
      {showError ? <p className="text-xs text-red-800 font-semibold">Remarks are required to archive.</p> : null}
      {hint ? <p className="text-xs text-amber-900/70">{hint}</p> : null}
      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={busy} className={smallButton}>
          {busy ? busyLabel : confirmLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className={smallButton}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ArchivePrompt;
