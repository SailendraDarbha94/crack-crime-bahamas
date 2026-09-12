"use client";
import app from "@/lib/firebase";
import { useToast } from "@/lib/toastContext";
import { child, get, getDatabase, ref } from "firebase/database";
import { useEffect, useState } from "react";
import CryptoES from "crypto-es";
import MessageItem from "./MessageItem";

const Page = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [decryptedMessages, setDecryptedMessages] = useState<any[]>([]);
  const { toast } = useToast();

  const decryptMessage = (obj: any): string | null => {
    try {
      const decryptedCipher = CryptoES.AES.decrypt(obj.message, "ebiz242");
      const decryptedMessage = decryptedCipher.toString(CryptoES.enc.Utf8);
      return decryptedMessage || null;
    } catch (err) {
      console.error("Failed to decrypt tip:", err);
      return null;
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const db = getDatabase(app);
      const dbRef = ref(db);
      const data = await get(child(dbRef, "messages"));
      // Rebuild the list from scratch so refreshes never duplicate entries
      const list: any[] = [];
      if (data.exists()) {
        const messages = data.val();
        for (const index of Object.keys(messages)) {
          const raw = messages[index];
          // Server-encrypted string tips (encrypted flag) and mobile-app
          // cipher objects both go through AES decryption; anything else is a
          // legacy plaintext tip.
          const isCipher = raw.encrypted === true || typeof raw.message !== "string";
          const body = isCipher
            ? decryptMessage(raw) ?? "[Could not decrypt this tip]"
            : raw.message;

          // Later messages the tipster sent by quoting their PIN, oldest first
          // so the card reads top to bottom as a conversation.
          const followUps = Object.entries(raw.followUps ?? {})
            .map(([followUpId, entry]: [string, any]) => ({
              id: followUpId,
              message:
                entry.encrypted === true || typeof entry.message !== "string"
                  ? decryptMessage(entry) ?? "[Could not decrypt this message]"
                  : entry.message,
              created_at: entry.created_at,
            }))
            .sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));

          list.push({
            id: index,
            message: body,
            created_at: raw.created_at,
            // Tips submitted before PINs existed have none.
            pin: raw.pin ?? null,
            followUps,
            // A thread someone added to should surface like an email thread,
            // not sink to wherever it first arrived.
            lastActivity: Math.max(
              raw.created_at ?? 0,
              ...followUps.map((f) => f.created_at ?? 0)
            ),
          });
        }
      }
      // Most recently active threads first
      list.sort((a, b) => (b.lastActivity ?? 0) - (a.lastActivity ?? 0));
      setDecryptedMessages(list);
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

  return (
    <div className="w-full min-h-fit">
      <h1 className="font-nunito font-bold text-3xl text-center my-2 p-2 text-amber-950">
        Tip Messages
      </h1>
      {loading ? (
        <div className="w-full min-h-96 flex justify-center items-center">
          <div role="status" className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <div>
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
