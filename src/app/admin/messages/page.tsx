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
          if (messages[index].encrypted === true || typeof messages[index].message !== "string") {
            // Server-encrypted string tips (encrypted flag) and mobile-app
            // cipher objects both go through AES decryption
            const decrypted = decryptMessage(messages[index]);
            list.push({
              id: index,
              message: decrypted ?? "[Could not decrypt this tip]",
              created_at: messages[index].created_at,
            });
          } else {
            // Legacy plaintext tips
            list.push({
              id: index,
              message: messages[index].message,
              created_at: messages[index].created_at,
            });
          }
        }
      }
      // Newest tips first
      list.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
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
