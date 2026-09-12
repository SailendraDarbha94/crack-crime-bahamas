"use client";
import app from "@/lib/firebase";
import { dateReader } from "@/lib/utils";
import { useToast } from "@/lib/toastContext";
import { getDatabase, ref, remove } from "firebase/database";
import { useState } from "react";

const MessageItem = ({ item, refreshFunc }: any) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const { toast } = useToast();

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(item.pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ message: "Could not copy the PIN", type: "error" });
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this tip permanently?")) {
      return;
    }
    setLoading(true);
    try {
      const db = getDatabase(app);
      // The tip goes first, on its own: that is what was asked for, and it
      // must not depend on anything else succeeding.
      await remove(ref(db, `messages/${id}`));

      // Clearing the PIN index is then a courtesy. Its rules may not be
      // deployed yet (see FIREBASE_ROLLOUT.md), and a leftover entry only
      // points at a tip that no longer exists — harmless, and nothing reads
      // it. Bundling it with the delete above is what broke deletion before.
      if (item.pin) {
        try {
          await remove(ref(db, `tipPins/${item.pin}`));
        } catch (err) {
          console.warn("Tip deleted, but its PIN index could not be cleared:", err);
        }
      }

      toast({ message: "Tip deleted", type: "success" });
      await refreshFunc();
    } catch (err) {
      toast({ message: "Could not delete tip. Please try again.", type: "error" });
      console.error("Could not delete tip:", err);
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
    <div className="bg-white/25 backdrop-blur-xl border border-white/50 text-amber-950 max-w-md mx-auto rounded-2xl shadow-[0_8px_32px_rgba(120,72,10,0.12)] my-2 p-4 flex flex-col min-h-40 justify-between">
      <p className="font-bold font-nunito text-xl whitespace-pre-wrap">{item.message}</p>

      {item.followUps?.length ? (
        <div className="mt-4 border-l-2 border-amber-900/25 pl-3 flex flex-col gap-3">
          <p className="font-nunito text-xs uppercase tracking-wide text-amber-900/70">
            {item.followUps.length === 1
              ? "1 later message"
              : `${item.followUps.length} later messages`}
          </p>
          {item.followUps.map((followUp: any) => (
            <div key={followUp.id}>
              <p className="font-nunito whitespace-pre-wrap">{followUp.message}</p>
              <p className="font-nunito text-xs text-amber-900/70 pt-0.5">
                {dateReader(followUp.created_at)}
              </p>
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

      <p className="font-nunito font-semibold text-sm text-amber-900/80 pt-2">
        Sent : {dateReader(item.created_at)}
      </p>
      <div className="flex justify-center pt-8">
        <button
          onClick={() => deleteMessage(item.id)}
          className="bg-red-700 hover:bg-red-600 text-white w-full p-2 min-w-40 rounded-md font-mono tracking-wider font-extrabold"
        >
          DELETE
        </button>
      </div>
    </div>
  );
};

export default MessageItem;
