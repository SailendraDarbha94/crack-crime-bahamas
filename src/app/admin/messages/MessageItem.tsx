"use client";
import app from "@/lib/firebase";
import { dateReader } from "@/lib/utils";
import { useToast } from "@/lib/toastContext";
import { getDatabase, ref, remove } from "firebase/database";
import { useState } from "react";

const MessageItem = ({ item, refreshFunc }: any) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this tip permanently?")) {
      return;
    }
    setLoading(true);
    try {
      const db = getDatabase(app);
      const postRef = ref(db, `messages/${id}`);
      await remove(postRef);
      toast({ message: "Tip deleted", type: "success" });
      await refreshFunc();
    } catch (err) {
      toast({ message: "Could not delete tip. Please try again.", type: "error" });
      console.error("Could not delete tip:", err);
    } finally {
      setLoading(false);
    }
  };

  return loading ? (
    <div className="w-full min-h-40 flex justify-center items-center">
      <div role="status" className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800"></div>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  ) : (
    <div className="bg-white/25 backdrop-blur-xl border border-white/50 text-amber-950 max-w-md mx-auto rounded-2xl shadow-[0_8px_32px_rgba(120,72,10,0.12)] my-2 p-4 flex flex-col min-h-40 justify-between">
      <p className="font-bold font-nunito text-xl">{item.message}</p>

      <p className="font-nunito font-semibold text-sm text-amber-900/80">
        Sent : {dateReader(item.created_at)}
      </p>
      <div className="flex justify-center pt-8">
        <button
          onClick={() => deleteMessage(item.id)}
          className="bg-red-700 hover:bg-red-600 text-white w-full p-2 min-w-40 rounded-md font-mono tracking-wider font-extrabold"
        >
          DELETE
        </button>
      </div>
    </div>
  );
};

export default MessageItem;
