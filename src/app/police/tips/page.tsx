"use client";
import { database } from "@/lib/firebase";
import { readTipText } from "@/lib/tipCrypto";
import { dateReader } from "@/lib/utils";
import { get, ref } from "firebase/database";
import { useEffect, useState } from "react";

type FollowUp = { id: string; message: string; created_at?: number };
type ForwardedTip = {
  id: string;
  pin: string | null;
  message: string;
  note: string;
  created_at?: number;
  forwarded_at: number;
  followUps: FollowUp[];
  lastActivity: number;
};

// Tips that Crime Stoppers has forwarded. This reads /policeTips, which
// holds only what an admin chose to share — never the full inbox.
const PoliceTipsPage = () => {
  const [tips, setTips] = useState<ForwardedTip[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await get(ref(database, "policeTips"));
        const raw = snap.exists() ? snap.val() : {};
        const list: ForwardedTip[] = Object.entries(raw).map(([id, entry]: [string, any]) => {
          const followUps: FollowUp[] = Object.entries(entry.followUps ?? {})
            .map(([followUpId, f]: [string, any]) => ({
              id: followUpId,
              message: readTipText(f),
              created_at: f.created_at,
            }))
            .sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));
          return {
            id,
            pin: entry.pin ?? null,
            message: readTipText(entry, "[Could not read this tip]"),
            note: entry.note ? readTipText({ message: entry.note, encrypted: true }, "") : "",
            created_at: typeof entry.created_at === "number" ? entry.created_at : undefined,
            forwarded_at: entry.forwarded_at,
            followUps,
            lastActivity: Math.max(entry.forwarded_at ?? 0, ...followUps.map((f) => f.created_at ?? 0)),
          };
        });
        // Most recently forwarded or added-to first
        list.sort((a, b) => b.lastActivity - a.lastActivity);
        setTips(list);
      } catch (err) {
        console.error("Could not load forwarded tips:", err);
        setError(true);
        setTips([]);
      }
    };
    load();
  }, []);

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
        {tips === null ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-800"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-800 py-16">Could not load the tips. Please refresh the page.</p>
        ) : tips.length === 0 ? (
          <p className="text-center text-amber-900/70 py-16">No tips have been forwarded to you yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {tips.map((tip) => (
              <li
                key={tip.id}
                className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-2xl p-5 shadow-[0_8px_32px_rgba(120,72,10,0.12)] text-amber-950"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  {tip.pin ? (
                    <span className="inline-flex items-center gap-2 bg-white/40 border border-white/60 rounded-lg px-3 py-1.5">
                      <span className="text-xs uppercase tracking-wide text-amber-900/70">PIN</span>
                      <span className="font-mono font-extrabold tracking-[0.2em] text-lg">{tip.pin}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-amber-900/60 italic">No PIN (older tip)</span>
                  )}
                  <span className="text-sm text-amber-900/80">Forwarded {dateReader(tip.forwarded_at)}</span>
                </div>

                {tip.note ? (
                  <div className="rounded-xl bg-amber-100/60 border border-amber-300/60 px-3 py-2 mb-3">
                    <p className="text-xs uppercase tracking-wide text-amber-900/70">From Crime Stoppers</p>
                    <p className="text-sm whitespace-pre-wrap">{tip.note}</p>
                  </div>
                ) : null}

                <p className="text-xs uppercase tracking-wide text-amber-900/70">
                  Tip{tip.created_at ? ` · received ${dateReader(tip.created_at)}` : ""}
                </p>
                <p className="font-bold text-lg whitespace-pre-wrap">{tip.message}</p>

                {tip.followUps.length ? (
                  <div className="mt-4 border-l-2 border-amber-900/25 pl-3 flex flex-col gap-3">
                    <p className="text-xs uppercase tracking-wide text-amber-900/70">
                      {tip.followUps.length === 1
                        ? "1 later message from the tipster"
                        : `${tip.followUps.length} later messages from the tipster`}
                    </p>
                    {tip.followUps.map((f) => (
                      <div key={f.id}>
                        <p className="whitespace-pre-wrap">{f.message}</p>
                        {f.created_at ? (
                          <p className="text-xs text-amber-900/70 pt-0.5">{dateReader(f.created_at)}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};

export default PoliceTipsPage;
