"use client";

import { ToastContext } from "@/lib/toastContext";
import { Button, Card, CardBody, CardFooter, CardHeader, Input, Spinner } from "@nextui-org/react";
import { useContext, useEffect, useState } from "react";
const Page = () => {

  const [devicesList, setDevicesList] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notif, setNotif] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<string | null>(null);
  const [longitude, setLongtitude] = useState<string | null>(null);

  const { toast } = useContext(ToastContext);

  const sendNotification = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notification", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ data: { "message": notif, "lat": latitude, "lon": longitude } }),
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

  const fetchDeviceRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notification", {
        method: "GET",
        headers: {
          "content-type": "application/json",
        }
      });
      const { data } = await res.json();
      console.log(Object.entries(data));
      setDevicesList(Object.entries(data));
      setLoading(false);
    } catch (err) {
      toast({
        type: "error",
        message: "List Fetched",
      });
      console.log(err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeviceRegister();
  }, [])


  return (
    <div className="w-full min-h-screen">
      Notifications Center
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
          <div className="w-full flex justify-around mt-8">
            <Input
              label="Latitude"
              className="max-w-md"
              value={latitude ? latitude : ""}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <Input
              label="Longitude"
              className="max-w-md"
              value={longitude ? longitude : ""}
              onChange={(e) => setLongtitude(e.target.value)}
            />
          </div>
          <div className="w-full flex justify-center mt-4">
            <Button className="" radius="md" color="primary" onPress={sendNotification}>Send</Button>
          </div>
        </div>
      )}
      {/* {loading ? (
        <div className="flex justify-center p-4">
          <Spinner size="lg" />
        </div>
      ) : (
        <div>
          <h1>ExponentPushToken[imCwVMKCbO3liQllzT_HfU]</h1>
        </div>
      )} */}
      {devicesList ? (
        <div>
          <p className="text-center text-2xl my-4 font-semibold">List of Devices Registered For Notifications</p>
          {devicesList.map((device: any) => {
            return (
              <Card className="my-4 mx-auto p-3 max-w-lg" key={device[0]}>
                <CardHeader className="flex gap-3">
                  {/* <Image
                    alt="heroui logo"
                    height={40}
                    radius="sm"
                    src="https://avatars.githubusercontent.com/u/86160567?s=200&v=4"
                    width={40}
                  /> */}
                  <div className="flex flex-col">
                    <p className="text-md">Token: {device[0]}</p>
                    <p className="text-small text-default-500">Brand : {device[1]?.Device?.brand}</p>
                    <p className="text-small text-default-500">Model : {device[1]?.Device?.modelName}</p>
                    <p className="text-small text-default-500">Device Name : {device[1]?.Device?.deviceName}</p>
                  </div>
                </CardHeader>
                <CardBody>
                  <p>Product Name : {device[1]?.Device?.productName}</p>
                  <p>Product Name : {device[1]?.Device?.totalMemory}</p>
                </CardBody>
                <CardFooter>
                  {/* <p>{JSON.stringify(device)}</p> */}
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
