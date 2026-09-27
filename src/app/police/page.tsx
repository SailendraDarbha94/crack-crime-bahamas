"use client";
import { database } from "@/lib/firebase";
import { get, ref } from "firebase/database";
import Link from "next/link";
import { useEffect, useState } from "react";

// Police portal home: what officers can open, with live counts.
const PolicePage = () => {
  const [counts, setCounts] = useState<{ missing: number | null; wanted: number | null; tips: number | null }>({
    missing: null,
    wanted: null,
    tips: null,
  });

  useEffect(() => {
    const load = async () => {
      // Each count stands alone, so one failing read does not blank the other.
      const count = async (path: string) => {
        try {
          const snap = await get(ref(database, path));
          return snap.exists() ? snap.size : 0;
        } catch (err) {
          console.error(`Could not count ${path}:`, err);
          return null;
        }
      };
      const [missing, wanted, tips] = await Promise.all([count("missings"), count("wanteds"), count("policeTips")]);
      setCounts({ missing, wanted, tips });
    };
    load();
  }, []);

  const Card = ({ href, label, count, thumb, alt }: {
    href: string; label: string; count: number | null; thumb: string; alt: string;
  }) => (
    <Link
      href={href}
      className="w-full md:w-1/3 lg:w-1/4 min-h-80 hover:cursor-pointer bg-white/30 backdrop-blur-md border border-white/50 rounded-3xl p-3 hover:bg-white/40 transition-all duration-200"
    >
      <p className="text-center text-3xl font-bold text-amber-950">
        {label} : {count === null ? "…" : count}
      </p>
      <img src={thumb} alt={alt} className="rounded-3xl" loading="lazy" />
    </Link>
  );

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
          <Card href="/police/tips" label="Tips" count={counts.tips} thumb="/thumbnails/tips.png" alt="Forwarded tips" />
          <Card href="/police/missing" label="Missing" count={counts.missing} thumb="/thumbnails/missingThumbnail.png" alt="Missing persons" />
          <Card href="/police/wanted" label="Wanted" count={counts.wanted} thumb="/thumbnails/wantedThumbnail3.png" alt="Wanted persons" />
        </div>
      </div>
    </div>
  );
};

export default PolicePage;
