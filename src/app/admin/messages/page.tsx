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
          if (typeof messages[index].message === "string") {
            list.push({
              id: index,
              message: messages[index].message,
              created_at: messages[index].created_at,
            });
          } else {
            const decrypted = decryptMessage(messages[index]);
            list.push({
              id: index,
              message: decrypted ?? "[Could not decrypt this tip]",
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
      <h1 className=" font-nunito text-3xl text-center my-2 p-2  border-b-2 border-slate-600">
        Tip Messages
      </h1>
      {loading ? (
        <div className="w-full min-h-96 flex justify-center items-center">
          <div
            role="status"
            className="flex min-h-96 max-h-full justify-center items-center"
          >
            <svg
              aria-hidden="true"
              className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
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
