"use client";

import PublicPersonCard, { PublicPerson } from "@/components/PublicPersonCard";
import { MissingPersonService, WantedPersonService } from "@/lib/firebaseService";
import Link from "next/link";
import { useEffect, useState } from "react";

type Kind = "wanted" | "missing";

// Per-kind wording and data source, so the public and police galleries stay
// identical without two copies of the page.
const COPY: Record<Kind, {
  title: string;
  intro: string;
  officerIntro: string;
  placeholder: string;
  empty: string;
  load: () => Promise<any[]>;
  matches: (p: PublicPerson, q: string) => boolean;
}> = {
  wanted: {
    title: "Wanted Persons",
    intro:
      "If you recognise anyone below, do not approach them. Report what you know anonymously — every tip helps keep our community safe.",
    officerIntro: "Everyone currently listed as wanted, exactly as the public sees them.",
    placeholder: "Search by name, alias or charge…",
    empty: "There are currently no wanted persons listed.",
    load: () => WantedPersonService.getAllWantedPersons(),
    matches: (p, q) =>
      !!(p.name?.toLowerCase().includes(q) || p.alias?.toLowerCase().includes(q) || p.wanted_for?.toLowerCase().includes(q)),
  },
  missing: {
    title: "Missing Persons",
    intro:
      "Help bring these people home. If you have seen anyone below or know their whereabouts, please share what you know — you can report anonymously.",
    officerIntro: "Everyone currently listed as missing, exactly as the public sees them.",
    placeholder: "Search by name, alias or area…",
    empty: "There are currently no missing persons listed.",
    load: () => MissingPersonService.getAllMissingPersons(),
    matches: (p, q) =>
      !!(p.name?.toLowerCase().includes(q) || p.alias?.toLowerCase().includes(q) || p.last_known_address?.toLowerCase().includes(q)),
  },
};

/**
 * Searchable gallery of wanted or missing persons. `audience="public"` is the
 * public page (with a "Submit a Tip" call to action); `audience="police"` is
 * the read-only police portal view of the same list.
 */
const PersonGallery = ({ kind, audience = "public" }: { kind: Kind; audience?: "public" | "police" }) => {
  const copy = COPY[kind];
  const [people, setPeople] = useState<PublicPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [queryText, setQueryText] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const results = await copy.load();
        // Newest first
        results.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
        setPeople(results);
      } catch (err) {
        console.error(`Could not load ${kind} persons:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const q = queryText.trim().toLowerCase();
  const filtered = q ? people.filter((p) => copy.matches(p, q)) : people;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-20 font-nunito">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-center text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.55)] mb-3">
          {copy.title}
        </h1>
        <p className="text-center text-amber-900/80 max-w-2xl mx-auto mb-6">
          {audience === "police" ? copy.officerIntro : copy.intro}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={copy.placeholder}
            className="w-full sm:w-96 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 px-4 py-2.5 text-amber-950 placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
          />
          {audience === "public" ? (
            <Link
              href="/submit-tip"
              className="whitespace-nowrap bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
            >
              Submit a Tip
            </Link>
          ) : null}
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
            {people.length === 0 ? copy.empty : "No results match your search."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((person) => (
              <PublicPersonCard key={person.id} person={person} kind={kind} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default PersonGallery;
