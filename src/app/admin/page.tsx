"use client";
import { tipArchiveStatus } from "@/lib/archive";
import { database } from "@/lib/firebase";
import { readAsStaff } from "@/lib/staffRead";
import { ref, get } from "firebase/database";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/**
 * A number on a tile: still being read, read, or could not be read. A count
 * that could not be read is shown as unknown, never as 0: "Tips : 0" on a day
 * the inbox failed to load tells an admin there is nothing to look at.
 */
type Count = number | "loading" | "unknown";

/** What each read brings back. Tips come from one read that feeds two tiles. */
type Loaded = {
  missing: number;
  wanted: number;
  tips: { open: number; archived: number };
  archivedPeople: number;
};
type Source = keyof Loaded;
type Results = { [S in Source]: Loaded[S] | "loading" | "unknown" };

/** The records in a node read with readAsStaff. */
const entriesOf = (node: unknown): unknown[] => {
  if (node === null || node === undefined) return []; // nothing stored is a real count of 0
  if (typeof node !== "object") throw new Error("The node does not hold a list of records.");
  // Numbered children come back as an array, with null wherever a number is
  // unused. Those are gaps, not records.
  return Object.values(node).filter((entry) => entry !== null && entry !== undefined);
};

/** How many children a node has, asked through the SDK. */
const childCount = async (path: string): Promise<number> => {
  const snapshot = await get(ref(database, path));
  // An empty node is a valid count of 0.
  return snapshot.exists() ? snapshot.size : 0;
};

const READERS: { [S in Source]: () => Promise<Loaded[S]> } = {
  // Written only by admins, so the SDK is safe to ask. Archived people are no
  // longer under these nodes, so they fall out of the counts on their own.
  missing: () => childCount("missings"),
  wanted: () => childCount("wanteds"),

  // Anyone may write a tip, and one key in one tip makes the SDK's get() of
  // every tip fail (see staffRead.ts), so tips are read over REST instead.
  tips: async () => {
    // Tips are archived in place, so split them: open and reopened tips
    // count as tips, archived ones count under Archive.
    let open = 0;
    let archived = 0;
    let notJudged = 0;
    for (const tip of entriesOf(await readAsStaff<unknown>("messages", { records: true }))) {
      // One at a time: a tip that cannot be judged is still a tip, and is
      // counted as open so that it sends an admin to the inbox to look.
      try {
        if (tipArchiveStatus(tip as Parameters<typeof tipArchiveStatus>[0]) === "archived") archived += 1;
        else open += 1;
      } catch {
        notJudged += 1;
        open += 1;
      }
    }
    // Said once, not once per tip: there may be a great many of them.
    if (notJudged) console.error(`${notJudged} tip(s) could not be judged open or archived, and were counted as open.`);
    return { open, archived };
  },

  archivedPeople: async () => {
    const archive = await readAsStaff<unknown>("archive");
    if (archive === null) return 0;
    if (typeof archive !== "object") throw new Error("The archive does not hold lists of records.");
    const { wanteds, missings } = archive as { wanteds?: unknown; missings?: unknown };
    return entriesOf(wanteds).length + entriesOf(missings).length;
  },
};

const SOURCES = Object.keys(READERS) as Source[];

/** The number as a tile shows it. */
const shown = (count: Count) => (count === "loading" ? "…" : count === "unknown" ? "–" : count);

const tileStyle =
  "w-full md:w-1/3 lg:w-1/4 min-h-80 flex flex-col bg-white/30 backdrop-blur-md border border-white/50 rounded-3xl hover:bg-white/40 transition-all duration-200";
const tileLinkStyle = "flex-1 p-3 hover:cursor-pointer";

/** Said under a number that could not be read. Plain text, so it can sit inside the tile's link. */
const UnreadNote = ({ count }: { count: Count }) =>
  count === "unknown" ? (
    <p className="text-center text-sm text-amber-900/80 pb-2">could not be read</p>
  ) : null;

/** Goes below the tile's link, not inside it: a button in a link would open the section as well. */
const RetryButton = ({ count, onRetry }: { count: Count; onRetry: () => void }) =>
  count === "unknown" ? (
    <button
      type="button"
      onClick={onRetry}
      className="mx-auto mb-3 bg-white/40 border border-white/60 hover:bg-white/55 text-amber-950 font-bold text-sm px-3 py-1.5 rounded-lg transition-colors duration-200"
    >
      Try again
    </button>
  ) : null;

const Page = () => {
  const [results, setResults] = useState<Results>({
    missing: "loading",
    wanted: "loading",
    tips: "loading",
    archivedPeople: "loading",
  });

  // Each read stands alone. They used to share one Promise.all, so a single
  // tip that could not be read left every tile at 0 with nothing to say why.
  // A tile shows its number as soon as that is known, and the tiles are on
  // screen from the start: they are the way into each section, and are not
  // held back by a slow or failing count.
  const load = useCallback(async (source: Source) => {
    setResults((current) => ({ ...current, [source]: "loading" }));
    let result: Results[Source];
    try {
      result = await READERS[source]();
    } catch (error) {
      console.error(`Error fetching the ${source} count:`, error);
      result = "unknown";
    }
    setResults((current) => ({ ...current, [source]: result }));
  }, []);

  useEffect(() => {
    SOURCES.forEach((source) => {
      load(source);
    });
  }, [load]);

  const { tips, archivedPeople } = results;
  const openTips: Count = typeof tips === "object" ? tips.open : tips;
  const archivedTips: Count = typeof tips === "object" ? tips.archived : tips;

  // The Archive tile adds two reads together, and half a sum is not a count:
  // it is known only when both parts are.
  const archived: Count =
    archivedTips === "loading" || archivedPeople === "loading"
      ? "loading"
      : archivedTips === "unknown" || archivedPeople === "unknown"
        ? "unknown"
        : archivedTips + archivedPeople;

  const retryArchived = () => {
    if (tips === "unknown") load("tips");
    if (archivedPeople === "unknown") load("archivedPeople");
  };

  return (
    <div className="min-h-fit font-nunito flex flex-wrap p-4 md:p-14">
      <div className="w-full font-nunito text-lg">
        <h1 className="font-bold text-5xl pb-4 mb-4 text-center text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)]">ADMIN DASHBOARD</h1>

        <div className="flex flex-wrap w-full p-4 rounded-2xl gap-4 bg-white/20 backdrop-blur-xl border border-white/50">
          <div className={tileStyle}>
            <Link href="/admin/missing" className={`block ${tileLinkStyle}`}>
              <p className="text-center text-3xl font-bold text-amber-950">Missing : {shown(results.missing)}</p>
              <UnreadNote count={results.missing} />
              <img src="/thumbnails/missingThumbnail.png" alt="Missing Person Thumbnail" className="rounded-lg" loading="lazy" />
            </Link>
            <RetryButton count={results.missing} onRetry={() => load("missing")} />
          </div>
          <div className={tileStyle}>
            <Link href="/admin/wanted" className={`block ${tileLinkStyle}`}>
              <p className="text-center text-3xl font-bold text-amber-950">Wanted : {shown(results.wanted)}</p>
              <UnreadNote count={results.wanted} />
              <img src="/thumbnails/wantedThumbnail3.png" alt="Wanted Person Thumbnail" className="rounded-3xl" loading="lazy" />
            </Link>
            <RetryButton count={results.wanted} onRetry={() => load("wanted")} />
          </div>
          <div className={tileStyle}>
            <Link href="/admin/messages" className={`block ${tileLinkStyle}`}>
              <p className="text-center text-3xl font-bold text-amber-950">Tips : {shown(openTips)}</p>
              <UnreadNote count={openTips} />
              <img src="/thumbnails/tips.png" alt="Messages Thumbnail" className="rounded-xl" loading="lazy" />
            </Link>
            <RetryButton count={openTips} onRetry={() => load("tips")} />
          </div>
          <div className={tileStyle}>
            <Link href="/admin/archive" className={`flex flex-col ${tileLinkStyle}`}>
              <p className="text-center text-3xl font-bold text-amber-950">Archive : {shown(archived)}</p>
              <UnreadNote count={archived} />
              <div className="flex-1 flex items-center justify-center">
                <svg aria-hidden="true" className="w-28 h-28 text-amber-900/60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <p className="text-center text-sm text-amber-900/70 pb-2">Closed tips and people taken off the lists</p>
            </Link>
            <RetryButton count={archived} onRetry={retryArchived} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
