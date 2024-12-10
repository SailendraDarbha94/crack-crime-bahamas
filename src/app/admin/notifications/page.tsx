"use client";

import { ToastContext } from "@/lib/toastContext";
import { Button, Input, Spinner } from "@nextui-org/react";
import { useContext, useState } from "react";
const Page = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [notif, setNotif] = useState<string | null>(null);
  const { toast } = useContext(ToastContext);
  const sendNotification = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notification", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ data: notif }),
      });
      const data = await res.json();
      console.log(data);
      setNotif(null);
      toast({
        type: "error",
        message: "Notification sent to registered devices",
      });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.log(JSON.stringify(err));
    }
  };

  return (
    <div className="w-full min-h-screen">
      Notifications Center
      {/* <div className="bg-purple-500 max-w-md p-2 min-h-40 flex flex-col">
        <label htmlFor="notif">Set Notification</label>
        <input
          value={notif ? notif : ""}
          className="p-1 m-2 rounded-lg focus:outline-none"
          id="notif"
          name="notif"
          type="text"
          onChange={(e) => setNotif(e.target.value)}
        />
        <button
          className="p-2 m-2 bg-green-500 rounded-lg"
          onClick={() => setLoading(!loading)}
        >
          Send Notification
        </button>
      </div> */}
      {loading ? (
        <div className="flex justify-center p-4">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className=" p-4 flex justify-center flex-wrap">
          <Input
            label="Notification Message"
            className="max-w-md"
            value={notif ? notif : ""}
            onChange={(e) => setNotif(e.target.value)}
          />
          <div className="w-full flex justify-center mt-4">
            <Button className="" radius="md" color="primary" onPress={sendNotification}>Send</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
