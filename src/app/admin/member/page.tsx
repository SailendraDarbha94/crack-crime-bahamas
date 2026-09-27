"use client";

import { DatabaseService } from "@/lib/firebaseService";
import { dateReader } from "@/lib/utils";
import { useEffect, useState } from "react";

type Pledge = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  support: string;
  donation: string;
  created_at?: number;
};

// What each tier meant on the old forms.
const TIERS: Record<string, string> = {
  friend: "Friend · $25",
  supporter: "Supporter · $100",
  bronze: "Bronze · $250",
  silver: "Silver · $500",
  gold: "Gold · $1000",
  platinum: "Platinum · $2500",
};

// Pledges arrived in two shapes: the 2024 app sent underscore-prefixed fields
// and no timestamp; the website form sent plain names with created_at. Read
// either. Other features once wrote unrelated records here too, so anything
// without a name is not a pledge and is left out.
const pick = (record: any, key: string): string => {
  const value = record[key] ?? record[`_${key}`];
  if (value == null) return "";
  return typeof value === "string" ? value.trim() : String(value);
};

const toPledge = (record: any): Pledge | null => {
  const name = pick(record, "name");
  if (!name) return null;
  return {
    id: record.id,
    name,
    email: pick(record, "email"),
    mobile: pick(record, "mobile"),
    address: pick(record, "address"),
    support: pick(record, "support").toLowerCase(),
    donation: pick(record, "donation"),
    created_at: typeof record.created_at === "number" ? record.created_at : undefined,
  };
};

const Page = () => {
  const [pledges, setPledges] = useState<Pledge[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Reads /members directly as the signed-in admin.
        const rows = await DatabaseService.getAll("members");
        const parsed = rows.map(toPledge);
        const kept = parsed.filter((p): p is Pledge => p !== null);
        // Newest first; records without a date sink to the bottom.
        kept.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
        setPledges(kept);
        setSkipped(parsed.length - kept.length);
      } catch (err) {
        console.error("Could not load pledges:", err);
        setError(true);
        setPledges([]);
      }
    };
    load();
  }, []);

  return (
    <main className="w-full min-h-screen font-nunito p-4 md:p-10">
      <h1 className="font-bold text-4xl md:text-5xl text-center text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)] mb-2">
        Membership Pledges
      </h1>
      <p className="text-center text-amber-900/80 max-w-2xl mx-auto mb-8">
        Everyone who offered a donation or an annual contribution through the app or the website.
        These were pledges only — no payment was taken. The forms are closed while payments are
        rebuilt, so nothing new will appear here until then.
      </p>

      <div className="max-w-3xl mx-auto">
        {pledges === null ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-800"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-800 py-16">Could not load the pledges. Please refresh the page.</p>
        ) : pledges.length === 0 ? (
          <p className="text-center text-amber-900/70 py-16">No pledges on record.</p>
        ) : (
          <>
            <p className="text-sm text-amber-900/70 mb-3">
              {pledges.length} {pledges.length === 1 ? "pledge" : "pledges"}
              {skipped ? ` · ${skipped} unrelated ${skipped === 1 ? "record" : "records"} in this list not shown` : ""}
            </p>
            <ul className="flex flex-col gap-3">
              {pledges.map((p) => (
                <li
                  key={p.id}
                  className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-2xl p-5 shadow-[0_8px_32px_rgba(120,72,10,0.12)] text-amber-950"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-xl font-extrabold">{p.name}</h2>
                    {p.support || p.donation ? (
                      <span className="rounded-full bg-white/50 border border-white/70 px-3 py-1 text-sm font-bold">
                        {p.support ? TIERS[p.support] ?? p.support : `Donation · $${p.donation}`}
                      </span>
                    ) : null}
                  </div>
                  <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    {p.email ? (
                      <div><dt className="text-amber-900/70">Email</dt><dd><a className="underline break-all" href={`mailto:${p.email}`}>{p.email}</a></dd></div>
                    ) : null}
                    {p.mobile ? (
                      <div><dt className="text-amber-900/70">Mobile</dt><dd><a className="underline" href={`tel:${p.mobile}`}>{p.mobile}</a></dd></div>
                    ) : null}
                    {p.address ? (
                      <div className="sm:col-span-2"><dt className="text-amber-900/70">Address</dt><dd>{p.address}</dd></div>
                    ) : null}
                    <div className="sm:col-span-2">
                      <dt className="text-amber-900/70">Received</dt>
                      <dd>{p.created_at ? dateReader(p.created_at) : "Date not recorded (sent from the 2024 app)"}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
};

export default Page;
