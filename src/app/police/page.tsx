"use client";
import { database } from "@/lib/firebase";
import { readAsStaff } from "@/lib/staffRead";
import { get, ref } from "firebase/database";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/**
 * A number on a tile: still being read, read, or could not be read. The last
 * two are kept apart on purpose. A count that failed used to stay as "…" for
 * good, which reads as "still loading", and must never read as 0 either.
 */
type Count = number | "loading" | "unknown";
type CountKey = "tips" | "missing" | "wanted";

/** How many records a node read with readAsStaff holds. */
const entryCount = (node: unknown): number => {
  if (node === null) return 0; // nothing stored is a real count of 0
  if (typeof node !== "object") throw new Error("The node does not hold a list of records.");
  // Numbered children come back as an array, with null wherever a number is
  // unused. Those are gaps, not records.
  return Object.values(node).filter((entry) => entry !== null && entry !== undefined).length;
};

/** How many children a node has, asked through the SDK. */
const childCount = async (path: string): Promise<number> => {
  const snap = await get(ref(database, path));
  return snap.exists() ? snap.size : 0;
};

const READERS: Record<CountKey, () => Promise<number>> = {
  // The copies sent to officers hold fields copied verbatim from tips, and a
  // tip is a record anyone may have written. One key in one of them makes the
  // SDK's get() of the whole node fail (see staffRead.ts), so this count is
  // read over REST, which nothing in a record can break.
  tips: async () => entryCount(await readAsStaff<unknown>("policeTips", { records: true })),
  // Written only by admins, so the SDK is safe to ask.
  missing: () => childCount("missings"),
  wanted: () => childCount("wanteds"),
};

const COUNT_KEYS = Object.keys(READERS) as CountKey[];

// Defined out here rather than inside the page: each count now arrives on its
// own, and a component declared during a render is a new one every time, so
// the tiles (and their pictures) would be rebuilt on each arrival.
const Card = ({ href, label, count, onRetry, thumb, alt }: {
  href: string; label: string; count: Count; onRetry: () => void; thumb: string; alt: string;
}) => (
  <div className="w-full md:w-1/3 lg:w-1/4 min-h-80 flex flex-col bg-white/30 backdrop-blur-md border border-white/50 rounded-3xl hover:bg-white/40 transition-all duration-200">
    <Link href={href} className="block flex-1 p-3 hover:cursor-pointer">
      <p className="text-center text-3xl font-bold text-amber-950">
        {label} : {count === "loading" ? "…" : count === "unknown" ? "–" : count}
      </p>
      {count === "unknown" ? (
        <p className="text-center text-sm text-amber-900/80 pb-2">could not be read</p>
      ) : null}
      <img src={thumb} alt={alt} className="rounded-3xl" loading="lazy" />
    </Link>
    {/* Outside the link: a button inside it would open the section as well. */}
    {count === "unknown" ? (
      <button
        type="button"
        onClick={onRetry}
        className="mx-auto mb-3 bg-white/40 border border-white/60 hover:bg-white/55 text-amber-950 font-bold text-sm px-3 py-1.5 rounded-lg transition-colors duration-200"
      >
        Try again
      </button>
    ) : null}
  </div>
);

// Police portal home: what officers can open, with live counts.
const PolicePage = () => {
  const [counts, setCounts] = useState<Record<CountKey, Count>>({
    missing: "loading",
    wanted: "loading",
    tips: "loading",
  });

  // Each count stands alone, so one failing read does not blank the others,
  // and each shows as soon as it is known rather than waiting for the slowest.
  const loadCount = useCallback(async (key: CountKey) => {
    setCounts((current) => ({ ...current, [key]: "loading" }));
    let result: Count;
    try {
      result = await READERS[key]();
    } catch (err) {
      console.error(`Could not count ${key}:`, err);
      result = "unknown";
    }
    setCounts((current) => ({ ...current, [key]: result }));
  }, []);

  useEffect(() => {
    COUNT_KEYS.forEach((key) => {
      loadCount(key);
    });
  }, [loadCount]);

  return (
    <div className="min-h-fit font-nunito flex flex-wrap p-4 md:p-14">
      <div className="w-full font-nunito text-lg">
        <h1 className="font-bold text-5xl pb-4 mb-2 text-center text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)]">
          POLICE PORTAL
        </h1>
        <p className="text-center text-amber-900/80 mb-6">
          Read-only access to the cases Crack Crime Bahamas shares with you.
        </p>
        <div className="flex flex-wrap w-full p-4 rounded-2xl gap-4 bg-white/20 backdrop-blur-xl border border-white/50">
          <Card href="/police/tips" label="Tips" count={counts.tips} onRetry={() => loadCount("tips")} thumb="/thumbnails/tips.png" alt="Forwarded tips" />
          <Card href="/police/missing" label="Missing" count={counts.missing} onRetry={() => loadCount("missing")} thumb="/thumbnails/missingThumbnail.png" alt="Missing persons" />
          <Card href="/police/wanted" label="Wanted" count={counts.wanted} onRetry={() => loadCount("wanted")} thumb="/thumbnails/wantedThumbnail3.png" alt="Wanted persons" />
        </div>
      </div>
    </div>
  );
};

export default PolicePage;
