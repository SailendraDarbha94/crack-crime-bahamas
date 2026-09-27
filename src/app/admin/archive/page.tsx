"use client";
import PublicPersonCard, { PublicPerson } from "@/components/PublicPersonCard";
import { archiveHistory, tipArchiveStatus, type ArchiveLogEntry, type PeopleKind } from "@/lib/archive";
import app from "@/lib/firebase";
import { FirebaseErrorHandler } from "@/lib/firebaseErrorHandler";
import { PersonArchiveService } from "@/lib/firebaseService";
import { deleteTipRecords, removePoliceCopy, restoreTip } from "@/lib/tipAdmin";
import { readTipText } from "@/lib/tipCrypto";
import { useToast } from "@/lib/toastContext";
import { dateReader } from "@/lib/utils";
import { getAuth } from "firebase/auth";
import { child, get, getDatabase, ref } from "firebase/database";
import { useEffect, useState } from "react";

type Tab = "tips" | PeopleKind;

type HistoryEntry = { action: "archived" | "restored"; at: number; by: string; remarks: string };
type ArchivedTip = {
  id: string;
  message: string;
  pin: string | null;
  created_at?: number;
  followUps: { id: string; message: string; created_at?: number }[];
  archive: { at: number; by: string; remarks: string };
  history: HistoryEntry[];
  stillWithPolice: boolean;
};
type ArchivedPerson = PublicPerson & {
  created_at?: number;
  archived: { at: number; by: string; remarks: string };
};

const smallButton =
  "bg-white/40 border border-white/60 hover:bg-white/55 text-amber-950 font-bold text-sm px-3 py-1.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
const dangerButton =
  "bg-red-700 hover:bg-red-600 text-white font-bold text-sm px-3 py-1.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

const TABS: { key: Tab; label: string }[] = [
  { key: "tips", label: "Tips" },
  { key: "missings", label: "Missing" },
  { key: "wanteds", label: "Wanted" },
];

const decryptRemarks = (cipher: unknown) =>
  typeof cipher === "string" && cipher
    ? readTipText({ message: cipher, encrypted: true }, "[Could not read the remarks]")
    : "";

/**
 * Everything that has been archived, with the remarks that were given. Tips
 * stay where they are in the database and are listed here while nothing new
 * has arrived on them; people were moved here out of the public lists.
 */
const ArchivePage = () => {
  const [tab, setTab] = useState<Tab>("tips");
  const [tips, setTips] = useState<ArchivedTip[] | null>(null);
  const [people, setPeople] = useState<Record<PeopleKind, ArchivedPerson[]> | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    const db = getDatabase(app);
    const root = ref(db);
    const problems: string[] = [];

    // Each read stands alone so one failure never blanks the others.
    const readNode = async (path: string): Promise<Record<string, any>> => {
      try {
        const snap = await get(child(root, path));
        return snap.exists() ? snap.val() : {};
      } catch (err) {
        console.error(`Could not read ${path}:`, err);
        problems.push(path);
        return {};
      }
    };

    const [messages, policeCopies, archivedWanteds, archivedMissings, users] = await Promise.all([
      readNode("messages"),
      readNode("policeTips"),
      readNode("archive/wanteds"),
      readNode("archive/missings"),
      readNode("users"),
    ]);

    // Who did what, where we know a name. Admins are allowlisted by uid in
    // the Console and may have no profile, so "an admin" is the fallback.
    const nameOf: Record<string, string> = {};
    for (const [uid, profile] of Object.entries(users) as [string, any][]) {
      const full = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
      if (full) nameOf[uid] = full;
    }
    setNames(nameOf);

    const tipList: ArchivedTip[] = [];
    for (const [id, raw] of Object.entries(messages) as [string, any][]) {
      if (tipArchiveStatus(raw) !== "archived") continue;
      const followUps = Object.entries(raw.followUps ?? {})
        .map(([followUpId, entry]: [string, any]) => ({
          id: followUpId,
          message: readTipText(entry),
          created_at: entry.created_at,
        }))
        .sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));
      tipList.push({
        id,
        message: readTipText(raw, "[Could not decrypt this tip]"),
        pin: raw.pin ?? null,
        created_at: raw.created_at,
        followUps,
        archive: {
          at: typeof raw.archive?.at === "number" ? raw.archive.at : 0,
          by: raw.archive?.by ?? "",
          remarks: decryptRemarks(raw.archive?.remarks),
        },
        history: archiveHistory(raw.archiveLog).map((e: ArchiveLogEntry) => ({
          action: e.action,
          at: e.at,
          by: e.by,
          remarks: decryptRemarks(e.remarks),
        })),
        // Archiving withdraws the police copy; if that step failed, the copy
        // is still readable by officers and must be dealt with from here,
        // since the inbox no longer lists this tip.
        stillWithPolice: Boolean(policeCopies[id]),
      });
    }
    tipList.sort((a, b) => b.archive.at - a.archive.at);
    setTips(tipList);

    const toPeople = (node: Record<string, any>): ArchivedPerson[] =>
      Object.entries(node)
        .map(([id, record]) => ({
          ...record,
          id,
          archived: {
            at: typeof record.archived?.at === "number" ? record.archived.at : 0,
            by: record.archived?.by ?? "",
            remarks: decryptRemarks(record.archived?.remarks),
          },
        }))
        .sort((a, b) => b.archived.at - a.archived.at);
    setPeople({ wanteds: toPeople(archivedWanteds), missings: toPeople(archivedMissings) });
    setFailed(problems);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const who = (uid: string) => names[uid] ?? "an admin";

  type Outcome = { message: string; type: "success" | "warning" };
  // `work` may return its own outcome (a partial success, say); otherwise
  // the plain success message is shown. One toast per action.
  const run = async (id: string, work: () => Promise<Outcome | void>, success: string, failure: string) => {
    setBusyId(id);
    try {
      const outcome = await work();
      toast(outcome ?? { message: success, type: "success" });
      await load();
    } catch (err) {
      console.error(failure, err);
      toast({ message: `${failure}: ${FirebaseErrorHandler.handleError(err)}`, type: "error" });
      // Most failures here mean the page had gone stale (another admin acted
      // on the same item); showing the current state is the honest response.
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const restoreThisTip = (tip: ArchivedTip) => {
    if (!confirm("Restore this tip to the inbox?")) return;
    const admin = getAuth(app).currentUser;
    if (!admin) {
      toast({ message: "Your session has expired — please sign in again.", type: "error" });
      return;
    }
    run(tip.id, () => restoreTip(getDatabase(app), tip.id, admin.uid), "Tip restored to the inbox", "Could not restore the tip");
  };

  const deleteThisTip = (tip: ArchivedTip) => {
    if (!confirm("Delete this tip permanently? Its remarks and history go with it.")) return;
    run(
      tip.id,
      async () => {
        const { copyLeftBehind } = await deleteTipRecords(getDatabase(app), tip.id, tip.pin);
        if (copyLeftBehind) {
          return {
            message: "Tip deleted, but its police copy could not be removed — it will show in the inbox as a leftover to withdraw.",
            type: "warning",
          };
        }
      },
      "Tip deleted",
      "Could not delete the tip"
    );
  };

  const withdrawThisTip = (tip: ArchivedTip) => {
    if (!confirm("Withdraw this archived tip from the police? Officers lose access to it immediately.")) return;
    run(
      tip.id,
      async () => {
        if (!(await removePoliceCopy(getDatabase(app), tip.id))) throw new Error("permission denied");
      },
      "Withdrawn from police",
      "Could not withdraw the tip"
    );
  };

  const restorePerson = (kind: PeopleKind, person: ArchivedPerson) => {
    if (!confirm(`Restore ${person.name} to the public ${kind === "wanteds" ? "wanted" : "missing"} list? They reappear on the website and in the app.`)) return;
    run(person.id, () => PersonArchiveService.restore(kind, person.id), `${person.name} restored to the public list`, "Could not restore");
  };

  const deletePerson = (kind: PeopleKind, person: ArchivedPerson) => {
    if (!confirm(`Delete ${person.name} permanently, picture included?`)) return;
    run(person.id, () => PersonArchiveService.deleteArchived(kind, person.id, person.image), `${person.name} deleted`, "Could not delete");
  };

  const loading = tips === null || people === null;
  const counts: Record<Tab, number> = {
    tips: tips?.length ?? 0,
    missings: people?.missings.length ?? 0,
    wanteds: people?.wanteds.length ?? 0,
  };

  return (
    <div className="w-full min-h-fit font-nunito text-amber-950">
      <h1 className="font-bold text-3xl text-center my-2 p-2">Archive</h1>
      <p className="text-center text-sm text-amber-900/70 max-w-2xl mx-auto mb-4 px-4">
        Closed tips and people taken off the public lists, with the remarks given when they were archived.
        Restore puts something back exactly where it was. A tipster who writes again reopens their tip on their own.
      </p>

      <div className="flex justify-center gap-2 mb-4 px-4" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-2xl font-bold border transition-colors duration-200 ${
              tab === t.key
                ? "bg-white/55 border-white/80 shadow-sm"
                : "bg-white/25 border-white/50 hover:bg-white/40"
            }`}
          >
            {t.label}
            <span className="ml-2 text-sm text-amber-900/70">{loading ? "…" : counts[t.key]}</span>
          </button>
        ))}
      </div>

      {failed.length ? (
        <p className="text-center text-sm text-red-800 mb-3 px-4">
          Some of the archive could not be loaded ({failed.join(", ")}). Refresh to try again.
        </p>
      ) : null}

      {loading ? (
        <div className="w-full min-h-96 flex justify-center items-center">
          <div role="status" className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : tab === "tips" ? (
        tips.length === 0 ? (
          <p className="text-center text-amber-900/70 py-16">No archived tips.</p>
        ) : (
          <div>
            {tips.map((tip) => (
              <div
                key={tip.id}
                className="bg-white/25 backdrop-blur-xl border border-white/50 max-w-md mx-auto rounded-2xl shadow-[0_8px_32px_rgba(120,72,10,0.12)] my-2 p-4 flex flex-col gap-3"
              >
                <div className="rounded-xl bg-amber-100/60 border border-amber-300/60 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-amber-900/70">
                    Archived {dateReader(tip.archive.at)} by {who(tip.archive.by)}
                  </p>
                  <p className="text-sm font-semibold whitespace-pre-wrap">{tip.archive.remarks}</p>
                </div>

                {tip.stillWithPolice ? (
                  <div className="rounded-xl border border-red-400/60 bg-white/40 px-3 py-2 flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-wide text-red-800">Still with the police</p>
                    <p className="text-sm text-amber-900/80">
                      Archiving should have withdrawn this tip from officers, but the copy is still there.
                    </p>
                    <div>
                      <button onClick={() => withdrawThisTip(tip)} disabled={busyId === tip.id} className={smallButton}>
                        Withdraw from police
                      </button>
                    </div>
                  </div>
                ) : null}

                <p className="font-bold text-xl whitespace-pre-wrap">{tip.message}</p>

                {tip.followUps.length ? (
                  <div className="border-l-2 border-amber-900/25 pl-3 flex flex-col gap-3">
                    <p className="text-xs uppercase tracking-wide text-amber-900/70">
                      {tip.followUps.length === 1 ? "1 later message" : `${tip.followUps.length} later messages`}
                    </p>
                    {tip.followUps.map((f) => (
                      <div key={f.id}>
                        <p className="whitespace-pre-wrap">{f.message}</p>
                        {f.created_at ? <p className="text-xs text-amber-900/70 pt-0.5">{dateReader(f.created_at)}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                <p className="text-sm text-amber-900/80">
                  {tip.pin ? (
                    <>
                      PIN <span className="font-mono font-extrabold tracking-[0.2em]">{tip.pin}</span> ·{" "}
                    </>
                  ) : null}
                  {tip.created_at ? `Sent ${dateReader(tip.created_at)}` : "Sent date unknown"}
                </p>

                {tip.history.length > 1 ? (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-amber-900/80 font-semibold">
                      History ({tip.history.length} {tip.history.length === 1 ? "event" : "events"})
                    </summary>
                    <ul className="mt-2 flex flex-col gap-1 text-amber-900/90">
                      {tip.history.map((h, i) => (
                        <li key={i}>
                          <span className="font-semibold">{h.action === "archived" ? "Archived" : "Restored"}</span>{" "}
                          {dateReader(h.at)} by {who(h.by)}
                          {h.remarks ? <span className="italic whitespace-pre-wrap"> — “{h.remarks}”</span> : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                <div className="flex gap-2 pt-1">
                  <button onClick={() => restoreThisTip(tip)} disabled={busyId === tip.id} className={smallButton}>
                    Restore to inbox
                  </button>
                  <button onClick={() => deleteThisTip(tip)} disabled={busyId === tip.id} className={dangerButton}>
                    Delete permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : people[tab].length === 0 ? (
        <p className="text-center text-amber-900/70 py-16">
          No archived {tab === "wanteds" ? "wanted" : "missing"} persons.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {people[tab].map((person) => (
            <div key={person.id} className="flex flex-col gap-2">
              <PublicPersonCard person={person} kind={tab === "wanteds" ? "wanted" : "missing"} />
              <div className="rounded-xl bg-amber-100/60 border border-amber-300/60 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-amber-900/70">
                  Archived {dateReader(person.archived.at)} by {who(person.archived.by)}
                </p>
                <p className="text-sm font-semibold whitespace-pre-wrap">{person.archived.remarks}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => restorePerson(tab, person)} disabled={busyId === person.id} className={smallButton}>
                  Restore to public list
                </button>
                <button onClick={() => deletePerson(tab, person)} disabled={busyId === person.id} className={dangerButton}>
                  Delete permanently
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchivePage;
