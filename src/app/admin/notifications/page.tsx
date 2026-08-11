"use client";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import app, { database } from "@/lib/firebase";
import { ToastContext } from "@/lib/toastContext";
import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Input } from "@nextui-org/react";
import { getAuth } from "firebase/auth";
import { get, ref, remove } from "firebase/database";
import { useContext, useEffect, useState } from "react";

// The notification APIs require an admin ID token (verified server-side
// against the /admins allowlist).
const getAuthHeader = async (): Promise<Record<string, string>> => {
  const idToken = await getAuth(app).currentUser?.getIdToken();
  return idToken ? { authorization: `Bearer ${idToken}` } : {};
};

const Page = () => {

  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [devicesList, setDevicesList] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notif, setNotif] = useState<string | null>(null);
  const [radius, setRadius] = useState<string | null>('500');
  const [latitude, setLatitude] = useState<string | null>(null);
  const [longitude, setLongtitude] = useState<string | null>(null);
  const [address, setAddress] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { toast } = useContext(ToastContext);

  const sendNotification = async () => {
    if (!notif?.trim() || !latitude?.trim() || !longitude?.trim()) {
      toast({ type: "warning", message: "Message, latitude and longitude are required" });
      return;
    }
    if (!devicesList || devicesList.length === 0) {
      toast({ type: "error", message: "No registered devices loaded yet" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/notification", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(await getAuthHeader()),
        },
        body: JSON.stringify({ data: { "message": notif, "lat": latitude, "lon": longitude, devices: devicesList, rad : radius } }),
      });
      const { data } = await res.json();
      if (data === "success") {
        setNotif(null);
        toast({ type: "success", message: "Notification sent to devices in the selected area" });
      } else {
        toast({ type: "error", message: "Notification could not be sent" });
      }
    } catch (err) {
      console.error("Location notification failed:", err);
      toast({ type: "error", message: "Notification could not be sent" });
    } finally {
      setLoading(false);
    }
  };

  const sendNotificationGeneral = async () => {
    if (!message?.trim()) {
      toast({ type: "warning", message: "Notification message is required" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/notification/general", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(await getAuthHeader()),
        },
        body: JSON.stringify({ data: { "notification": message, devices: devicesList ?? [] } }),
      });
      const { data } = await res.json();
      if (data === "success") {
        setMessage(null);
        toast({ type: "success", message: "Notification sent to all registered devices" });
      } else {
        toast({ type: "error", message: "Notification could not be sent" });
      }
    } catch (err) {
      console.error("General notification failed:", err);
      toast({ type: "error", message: "Notification could not be sent" });
    } finally {
      setLoading(false);
    }
  }

  const getProbableAddress = async (lat?: string, long?: string) => {
    // Reset so the modal never shows a previous device's address
    setAddress(null);
    if (!lat || !long) {
      setAddress("No location data recorded for this device");
      return;
    }
    try {
      const res = await fetch('/api/notification/geocode',{
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(await getAuthHeader()),
        },
        body: JSON.stringify({ data: { "latitude": lat, "longitude": long } }),
      })
      const { data } = await res.json();
      setAddress(data);
    } catch (err) {
      console.error("Geocoding failed:", err);
      setAddress("Could not resolve address. Please try again later.");
    }
  }


  // Reads the device register directly as the signed-in admin — the
  // unauthenticated GET /api/registrations endpoint (a device-PII leak)
  // was removed.
  const fetchDeviceRegister = async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(database, "notifications_register"));
      setDevicesList(snapshot.exists() ? Object.entries(snapshot.val()) : []);
    } catch (err) {
      toast({
        type: "error",
        message: "List Not Fetched! Try again Later",
      });
      console.error("Device list fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const deleteDeviceFromRegister = async (token: string) => {
    if (!confirm("Remove this device from the notification register?")) {
      return;
    }
    setLoading(true);
    try {
      await remove(ref(database, `notifications_register/${token}`));
      toast({ type: "success", message: "Device removed from register" });
      await fetchDeviceRegister();
    } catch (err) {
      toast({
        type: "error",
        message: "Could not remove device. Try again later.",
      });
      console.error("Device delete failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatBytesToGB = (bytes: number) => {
    return (bytes / (1024 ** 3)).toFixed(2) + " GB";
  };


  useEffect(() => {
    fetchDeviceRegister();
  }, [])


  return (
    <div className="w-full min-h-screen">
      <h1 className="text-center font-bold text-5xl bg-white py-4 my-6 rounded-tl-lg rounded-bl-lg">Notifications Center</h1>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 underline">Probable Address</ModalHeader>
              <ModalBody>
                <p className={`${address ? 'animate-none' : 'animate-pulse'} font-bold text-xl`}>
                  {address ? address : "Loading..."}
                </p>
                <Divider />
                <p className="text-red-400">Note : The address is provided by Google Maps Geocoding service based on the latitude and longitude and may not be accurate all the time</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="flex flex-wrap justify-evenly">
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <span className="mx-auto mt-2 font-bold text-2xl">General Notification</span>
          </CardHeader>
          <CardBody>
            <Input
              label="Notification Message"
              className=""
              value={message ? message : ""}
              onChange={(e) => setMessage(e.target.value)}
            />
          </CardBody>
          <CardFooter>
            <Button className="hover:bg-primary-500 hover:text-white mx-auto" variant="bordered" radius="md" color="primary" onPress={sendNotificationGeneral}>Send Notification</Button>
          </CardFooter>
        </Card>
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <span className="mx-auto mt-2 font-bold text-2xl">Location Based Notification</span>
          </CardHeader>
          <CardBody>
            <Input
              label="Notification Message"
              className="mb-2"
              value={notif ? notif : ""}
              onChange={(e) => setNotif(e.target.value)}
            />
            <Input
              label="Latitude"
              className="mb-2"
              value={latitude ? latitude as string : ""}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <Input
              label="Longitude"
              className="mb-2"
              value={longitude ? longitude as string : ""}
              onChange={(e) => setLongtitude(e.target.value)}
            />
            <Input
              label="Radius in Metres"
              className=""
              value={radius ? radius as string : ""}
              onChange={(e) => setRadius(e.target.value)}
            />
          </CardBody>
          <CardFooter>
            <Button className="hover:bg-primary-500 hover:text-white mx-auto" variant="bordered" radius="md" color="primary" onPress={sendNotification}>Push Notification</Button>
          </CardFooter>
        </Card>
      </div>
      <Divider className="mt-4" />
      {devicesList ? (
        <div>
          <p className="text-center font-bold text-3xl bg-white py-4 my-6 rounded-tl-lg rounded-bl-lg">Registered Devices List</p>
          {devicesList.map((device: any) => {
            return (
              <Card className="m-4 p-3 max-w-full" key={device[0]}>
                <CardHeader className="flex gap-3">
                  <div className="flex flex-col">
                    <p className="text-md">Token: {device[0]}</p>
                    <p className="text-small text-default-500">Brand : {device[1]?.Device?.brand}</p>
                    <p className="text-small text-default-500">Model : {device[1]?.Device?.modelName}</p>
                    <p className="text-small text-default-500">Device Name : {device[1]?.Device?.deviceName}</p>
                  </div>
                </CardHeader>
                <CardBody>
                  <p>Product Name : {device[1]?.Device?.productName}</p>
                  <p>RAM : {formatBytesToGB(Number(device[1]?.Device?.totalMemory))}</p>
                  <div>
                    {device[1]?.Location ? (<><Divider />
                      <p><span className="block text-center mt-2 font-bold">Last Known Location</span> <br /> Latitude : {device[1]?.Location?.coords?.latitude} <br /> Longitude : {device[1]?.Location?.coords?.longitude}</p></>) : null}
                  </div>
                </CardBody>
                <Divider />
                <CardFooter>
                  <Button variant="flat" color="danger" className="mx-auto mt-2" onPress={() => deleteDeviceFromRegister(device[0])}>
                    Delete
                  </Button>
                  <Button variant="ghost" color="warning" className="mx-auto mt-2" onPress={() => {
                    getProbableAddress(device[1]?.Location?.coords?.latitude, device[1]?.Location?.coords?.longitude),
                    onOpen();
                  }}>
                    Decode Address
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : null}
    </div>
  );
};

export default Page;
