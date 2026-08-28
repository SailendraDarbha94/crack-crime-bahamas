"use client";

import PublicPersonCard, { PublicPerson } from "@/components/PublicPersonCard";
import { WantedPersonService } from "@/lib/firebaseService";
import Link from "next/link";
import { useEffect, useState } from "react";

const WantedPage = () => {
  const [wanteds, setWanteds] = useState<PublicPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [queryText, setQueryText] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const results = await WantedPersonService.getAllWantedPersons();
        // Newest first
        results.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
        setWanteds(results);
      } catch (err) {
        console.error("Could not load wanted persons:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = wanteds.filter((p) => {
    if (!queryText.trim()) return true;
    const q = queryText.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.alias?.toLowerCase().includes(q) ||
      p.wanted_for?.toLowerCase().includes(q)
    );
  });

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-20 font-nunito">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-center text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.55)] mb-3">
          Wanted Persons
        </h1>
        <p className="text-center text-amber-900/80 max-w-2xl mx-auto mb-6">
          If you recognise anyone below, do not approach them. Report what you
          know anonymously &mdash; every tip helps keep our community safe.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search by name, alias or charge…"
            className="w-full sm:w-96 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 px-4 py-2.5 text-amber-950 placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
          />
          <Link
            href="/submit-tip"
            className="whitespace-nowrap bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
          >
            Submit a Tip
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-800 py-16">
            Could not load the list right now. Please try again later.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-amber-900/70 py-16">
            {wanteds.length === 0
              ? "There are currently no wanted persons listed."
              : "No results match your search."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((person) => (
              <PublicPersonCard key={person.id} person={person} kind="wanted" />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default WantedPage;
