"use client";

import app from "@/lib/firebase";
import { ToastContext } from "@/lib/toastContext";
import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Input, Spinner } from "@nextui-org/react";
import { getDatabase, ref, update } from "firebase/database";
import { useContext, useEffect, useState } from "react";
const Page = () => {


  const [devicesList, setDevicesList] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notif, setNotif] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<string | null>(null);
  const [longitude, setLongtitude] = useState<string | null>(null);
  const [coords, setCoords] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { toast } = useContext(ToastContext);

  const sendNotification = async () => {
    console.log(JSON.stringify({ data: { "message": notif, "lat": latitude, "lon": longitude } }));
    setLoading(true);
    try {
      const res = await fetch("/api/notification", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ data: { "message": notif, "lat": latitude, "lon": longitude, devices: devicesList } }),
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

  const sendNotificationGeneral = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notification/general", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ data: { "notification": message, } }),
      });
      const data = await res.json();
      console.log(data);
      setMessage(null);
      toast({
        type: "error",
        message: "Notification sent to registered devices",
      });
      setLoading(false);
    } catch (err) {
      console.log(err)
      toast({
        type: "error",
        message: "Error Occurred! Try Debugging"
      });
      setLoading(false);
    }
  }

  const getProbableAddress = async (lat:string='25.0806704', long:string='-77.4311452') => {
    console.log(lat, long);
    try {
      const res = await fetch('/api/notification/geocode',{
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ data: { "latitude": lat, "longitude": long } }),
      })
      const { data } = await res.json();
      console.log(data)
      return data;
    } catch (err) {
      console.log(err)
      return 'Error Occurred! Please Try Again Later';
    }
  }


  const sendNotificationSpecific = async (parmas:string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notification/specific/${parmas}`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
        },
      });
      const data = await res.json();
      console.log(data);
      setMessage(null);
      toast({
        type: "error",
        message: "Notification sent to registered devices",
      });
      setLoading(false);
    } catch (err) {
      console.log(err)
      toast({
        type: "error",
        message: "Error Occurred! Try Debugging"
      });
      setLoading(false);
    }
  }


  const fetchDeviceRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "GET",
        headers: {
          "content-type": "application/json",
        }
      });
      const { data } = await res.json();
      console.log(Object.entries(data));
      setDevicesList(Object.entries(data));
      setLoading(false);
      toast({
        type: "",
        message: "List of Devices Fetched!",
      });
    } catch (err) {
      toast({
        type: "error",
        message: "List Not Fetched! Try again Later",
      });
      console.log(err)
      setLoading(false)
    }
  }

  const deleteDeviceFromRegister = async (params: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(params)
      });
      const { data } = await res.json();
      console.log(data)
      setLoading(false);
      window.location.reload();
    } catch (err) {
      toast({
        type: "error",
        message: "Server Error Occurred! Try again Later",
      });
      console.log(err);
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
              className=""
              value={longitude ? longitude as string : ""}
              onChange={(e) => setLongtitude(e.target.value)}
            />

          </CardBody>
          <CardFooter>
            <Button className="hover:bg-primary-500 hover:text-white mx-auto" variant="bordered" radius="md" color="primary" onPress={sendNotification}>Push Notification</Button>
          </CardFooter>
        </Card>
        <div>


        </div>
      </div>
      {/* {loading ? (
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
              value={latitude ? latitude as string : ""}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <Input
              label="Longitude"
              className="max-w-md"
              value={longitude ? longitude as string : ""}
              onChange={(e) => setLongtitude(e.target.value)}
            />
          </div>
          <div className="w-full flex justify-center mt-4">
            <Button className="" radius="md" color="primary" onPress={sendNotification}>Send</Button>
          </div>
        </div>
      )} */}
      {/* {loading ? (
        <div className="flex justify-center p-4">
          <Spinner size="lg" />
        </div>
      ) : (
        <div>
          <h1>ExponentPushToken[imCwVMKCbO3liQllzT_HfU]</h1>
        </div>
      )} */}
      <Divider className="mt-4" />
      {devicesList ? (
        <div>
          <p className="text-center font-bold text-3xl bg-white py-4 my-6 rounded-tl-lg rounded-bl-lg">Registered Devices List</p>
          {devicesList.map((device: any) => {
            // let address:any = 'Address Not Found';
            // if(device[1]?.Location) {
            //   address = getProbableAddress(device[1]?.Location?.coords?.latitude, device[1]?.Location?.coords?.longitude);
            // }

            return (
              <Card className="m-4 p-3 max-w-full" key={device[0]}>
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
                  <p>RAM : {formatBytesToGB(Number(device[1]?.Device?.totalMemory))}</p>
                  <div>
                    {device[1]?.Location ? (<><Divider />
                      <p><span className="block text-center mt-2 font-bold">Last Known Location</span> <br /> Latitude : {device[1]?.Location?.coords?.latitude} <br /> Longitude : {device[1]?.Location?.coords?.longitude}</p></>) : null}
                  </div>
                  {/* <div>
                    Probable Address : {testRun(device[1]?.Location?.coords?.latitude,device[1]?.Location?.coords?.longitude)}
                  </div> */}
                </CardBody>
                <Divider />
                <CardFooter>
                  <Button variant="flat" color="danger" className="mx-auto mt-2" onPress={() => deleteDeviceFromRegister(device[0])}>
                    Delete
                  </Button>
                  <Button variant="flat" color="secondary" className="mx-auto mt-2" onPress={() => sendNotificationSpecific(device[0])}>
                    Send Notif
                  </Button>
                  <Button variant="light" color="warning" className="mx-auto mt-2" onPress={() => getProbableAddress(device[1]?.Location?.coords?.latitude, device[1]?.Location?.coords?.longitude)}>
                    Log Address
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
