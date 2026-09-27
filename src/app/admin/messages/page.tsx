"use client";
import app from "@/lib/firebase";
import { tipArchiveStatus } from "@/lib/archive";
import { useToast } from "@/lib/toastContext";
import { readTipText } from "@/lib/tipCrypto";
import { child, get, getDatabase, ref } from "firebase/database";
import Link from "next/link";
import { useEffect, useState } from "react";
import MessageItem from "./MessageItem";

// The exact stored fields, kept verbatim so forwarding to police copies the
// ciphertext as-is rather than decrypting and re-encrypting it. Archive
// fields are deliberately not among them: officers never see remarks.
const rawOf = (entry: any) => {
  const raw: Record<string, unknown> = { message: entry.message, created_at: entry.created_at };
  if (typeof entry.encrypted === "boolean") raw.encrypted = entry.encrypted;
  return raw;
};

const Page = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [decryptedMessages, setDecryptedMessages] = useState<any[]>([]);
  const [archivedCount, setArchivedCount] = useState<number>(0);
  const { toast } = useToast();

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const db = getDatabase(app);
      const dbRef = ref(db);
      const data = await get(child(dbRef, "messages"));

      // Which tips are with the police, and which of their follow-ups. Read
      // separately so a problem here never hides the inbox itself.
      let policeCopies: Record<string, any> = {};
      try {
        const snap = await get(child(dbRef, "policeTips"));
        policeCopies = snap.exists() ? snap.val() : {};
      } catch (err) {
        console.error("Could not read which tips are forwarded to police:", err);
      }

      // Rebuild the list from scratch so refreshes never duplicate entries
      const list: any[] = [];
      let archived = 0;
      const messages = data.exists() ? data.val() : {};
      {
        for (const index of Object.keys(messages)) {
          const raw = messages[index];

          // Archived tips live on the Archive page — unless the tipster has
          // written since, which brings the tip back here, flagged.
          const status = tipArchiveStatus(raw);
          if (status === "archived") {
            archived += 1;
            continue;
          }

          const body = readTipText(raw, "[Could not decrypt this tip]");

          // Later messages the tipster sent by quoting their PIN, oldest first
          // so the card reads top to bottom as a conversation.
          const followUps = Object.entries(raw.followUps ?? {})
            .map(([followUpId, entry]: [string, any]) => ({
              id: followUpId,
              message: readTipText(entry),
              created_at: entry.created_at,
              raw: rawOf(entry),
            }))
            .sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));

          const copy = policeCopies[index];
          const police = copy
            ? {
                forwarded_at: copy.forwarded_at,
                note: copy.note ? readTipText({ message: copy.note, encrypted: true }, "") : "",
                sharedFollowUps: Object.keys(copy.followUps ?? {}),
              }
            : null;

          list.push({
            id: index,
            message: body,
            created_at: raw.created_at,
            // Tips submitted before PINs existed have none.
            pin: raw.pin ?? null,
            followUps,
            raw: rawOf(raw),
            police,
            status,
            // Present only when reopened: the remarks from the archive that
            // the new message has just undone.
            archive:
              status === "reopened" && raw.archive
                ? {
                    at: raw.archive.at,
                    remarks: readTipText({ message: raw.archive.remarks, encrypted: true }, "[Could not read the remarks]"),
                  }
                : null,
            // A thread someone added to should surface like an email thread,
            // not sink to wherever it first arrived.
            lastActivity: Math.max(
              raw.created_at ?? 0,
              ...followUps.map((f) => f.created_at ?? 0)
            ),
          });
        }
      }
      // Copies whose original tip is gone — deleted from a stale view, or the
      // cleanup failed. Officers can still read them, so they must stay
      // visible here until withdrawn.
      for (const [copyId, copy] of Object.entries(policeCopies) as [string, any][]) {
        if (messages[copyId]) continue;
        list.push({
          id: copyId,
          orphanPoliceCopy: true,
          message: readTipText(copy, "[Could not decrypt this tip]"),
          pin: copy.pin ?? null,
          forwarded_at: copy.forwarded_at,
          lastActivity: copy.forwarded_at ?? 0,
        });
      }
      // Most recently active threads first
      list.sort((a, b) => (b.lastActivity ?? 0) - (a.lastActivity ?? 0));
      setDecryptedMessages(list);
      setArchivedCount(archived);
    } catch (err) {
      console.error("Error fetching tips:", err);
      toast({ message: "Could not load tips. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tips = decryptedMessages.filter((m) => !m.orphanPoliceCopy);
  const leftovers = decryptedMessages.length - tips.length;
  const forwardedCount = tips.filter((m) => m.police).length;
  const reopenedCount = tips.filter((m) => m.status === "reopened").length;

  return (
    <div className="w-full min-h-fit">
      <h1 className="font-nunito font-bold text-3xl text-center my-2 p-2 text-amber-950">
        Tip Messages
      </h1>
      {!loading && (decryptedMessages.length || archivedCount) ? (
        <p className="font-nunito text-center text-sm text-amber-900/70 mb-2">
          {tips.length} {tips.length === 1 ? "tip" : "tips"} · {forwardedCount} with the police
          {reopenedCount ? ` · ${reopenedCount} reopened by ${reopenedCount === 1 ? "the tipster" : "tipsters"}` : ""}
          {leftovers ? ` · ${leftovers} leftover police ${leftovers === 1 ? "copy" : "copies"} to withdraw` : ""}
          {archivedCount ? (
            <>
              {" · "}
              <Link href="/admin/archive" className="underline hover:text-amber-950">
                {archivedCount} archived
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      {loading ? (
        <div className="w-full min-h-96 flex justify-center items-center">
          <div role="status" className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <div>
          {!decryptedMessages.length ? (
            <p className="font-nunito text-center text-amber-900/70 py-16">
              No open tips.{archivedCount ? " Everything else is in the archive." : ""}
            </p>
          ) : null}
          {decryptedMessages.map((item:any) => {
            return (
              <MessageItem key={item.id} item={item} refreshFunc={fetchMessages} />
            )
          })}
        </div>
      )}
    </div>
  );
};

export default Page;
