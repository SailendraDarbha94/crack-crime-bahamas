"use client";
import { BUTTON, BUTTON_SM, BUTTON_SOLID, BUTTON_SOLID_SM } from "@/components/ui/buttonStyles";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import CardBoundary from "@/components/CardBoundary";
import app, { database } from "@/lib/firebase";
import { textOf } from "@/lib/safeRecord";
import { readAsStaff } from "@/lib/staffRead";
import { ToastContext } from "@/lib/toastContext";
import { Card, CardBody, CardFooter, CardHeader, Divider, Input } from "@nextui-org/react";
import { getAuth } from "firebase/auth";
import { ref, remove } from "firebase/database";
import { useContext, useEffect, useState } from "react";

// The notification APIs require an admin ID token (verified server-side
// against the /admins allowlist).
const getAuthHeader = async (): Promise<Record<string, string>> => {
  const idToken = await getAuth(app).currentUser?.getIdToken();
  return idToken ? { authorization: `Bearer ${idToken}` } : {};
};

// The device register can be written by anyone on the internet: the app
// registers without signing in, so the database cannot tell a phone from a
// stranger. Nothing below trusts what a record holds. Each record is turned
// into a DeviceView first, and only the view is drawn or sent.

/**
 * What a record's key must look like to be sent to: the part of an Expo push
 * token between the brackets. Kept in step with the sending routes, which
 * check it again.
 */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

/** Both sending routes refuse more than this many devices in one request. */
const BATCH_SIZE = 500;

/** Rows drawn at first, and added by each "Show more": a register stuffed with records must not freeze the page. */
const ROWS_PER_STEP = 100;

/** The longest piece of stored text a row shows. */
const MAX_TEXT_SHOWN = 200;

type DeviceView = {
  /** The record's key in the register. Delete removes this. */
  key: string;
  /** The key again when it has the shape of a push token; null for a record that is never sent to. */
  token: string | null;
  /** True when the record could not be turned into a view: only its key is known. */
  unreadable: boolean;
  brand: string;
  modelName: string;
  deviceName: string;
  productName: string;
  /** Memory in bytes, or null when the record does not say. */
  totalMemory: number | null;
  /** Whether the record holds a location at all (older app versions sent one). */
  hasLocation: boolean;
  latitude: number | null;
  longitude: number | null;
};

/** What a sending route is given for one device: its token and, for the area check, its coordinates. */
type PushTarget = [string] | [string, { Location: { coords: { latitude: number; longitude: number } } }];

type SendOutcome = {
  /** How many requests the list was split into, and how many of those failed outright. */
  batches: number;
  batchesFailed: number;
  /** Devices in the failed requests: whether any of them was reached is not known. */
  unanswered: number;
  sent: number;
  failed: number;
  skipped: number;
  outside: number;
};

/** What the last send did, kept on the page: a toast is gone in four seconds. */
type SendReport = { title: string; at: string; ok: boolean; lines: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** Stored text for a row: text or nothing, and never more than a row can sensibly show. */
const shortText = (value: unknown): string => {
  const text = textOf(value);
  return text.length > MAX_TEXT_SHOWN ? `${text.slice(0, MAX_TEXT_SHOWN)}…` : text;
};

/** A stored coordinate: a real number within `limit` degrees, or null. */
const coordinate = (value: unknown, limit: number): number | null =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit ? value : null;

const blankDevice = (key: string): DeviceView => ({
  key,
  token: TOKEN_PATTERN.test(key) ? key : null,
  unreadable: false,
  brand: "",
  modelName: "",
  deviceName: "",
  productName: "",
  totalMemory: null,
  hasLocation: false,
  latitude: null,
  longitude: null,
});

function deviceView(key: string, stored: unknown): DeviceView {
  const record = isRecord(stored) ? stored : {};
  const device = isRecord(record.Device) ? record.Device : {};
  const location = isRecord(record.Location) ? record.Location : null;
  const coords = location && isRecord(location.coords) ? location.coords : {};
  const memory = device.totalMemory;
  return {
    ...blankDevice(key),
    brand: shortText(device.brand),
    modelName: shortText(device.modelName),
    deviceName: shortText(device.deviceName),
    productName: shortText(device.productName),
    totalMemory: typeof memory === "number" && Number.isFinite(memory) && memory > 0 ? memory : null,
    hasLocation: location !== null,
    latitude: coordinate(coords.latitude, 90),
    longitude: coordinate(coords.longitude, 180),
  };
}

/**
 * Every record in the register as a view. One record that cannot be read
 * becomes one placeholder row, never an empty page. Throws only when the
 * register itself is not a set of records.
 */
function deviceViews(register: unknown): DeviceView[] {
  if (register === null || register === undefined) return [];
  if (typeof register !== "object") throw new Error("The device register is not a set of records.");
  const views: DeviceView[] = [];
  for (const [storedKey, stored] of Object.entries(register)) {
    // A register whose keys are all numbers arrives as a list with gaps.
    if (stored === null || stored === undefined) continue;
    const key = textOf(storedKey);
    try {
      views.push(deviceView(key, stored));
    } catch (err) {
      console.error("A device record could not be read:", err);
      views.push({ ...blankDevice(key), unreadable: true });
    }
  }
  return views;
}

/**
 * Whether the SDK can address a record by this key. Every key the database
 * really holds can be, but the check costs nothing, and an empty key would
 * address the whole register.
 */
const isAddressable = (key: string): boolean => {
  if (key.length === 0 || /[.#$\/\[\]]/.test(key)) return false;
  for (let i = 0; i < key.length; i += 1) {
    const code = key.charCodeAt(i);
    if (code < 32 || code === 127) return false;
  }
  return true;
};

/** A count in a route's answer: a whole number or, for anything else, nothing. */
const countOf = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;

const formatBytesToGB = (bytes: number) => {
  return (bytes / (1024 ** 3)).toFixed(2) + " GB";
};

const counted = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

/**
 * Posts the devices to a sending route in batches the route accepts, one
 * after another, and adds up what each answer says. A batch that fails does
 * not stop the ones after it: an alert should reach as many phones as it can.
 */
async function sendInBatches(
  url: string,
  payload: Record<string, unknown>,
  targets: PushTarget[],
  onProgress: (text: string) => void
): Promise<SendOutcome> {
  const outcome: SendOutcome = {
    batches: Math.ceil(targets.length / BATCH_SIZE),
    batchesFailed: 0,
    unanswered: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    outside: 0,
  };
  for (let start = 0, batchNumber = 1; start < targets.length; start += BATCH_SIZE, batchNumber += 1) {
    const batch = targets.slice(start, start + BATCH_SIZE);
    onProgress(outcome.batches > 1 ? `Sending batch ${batchNumber} of ${outcome.batches}…` : "Sending…");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(await getAuthHeader()),
        },
        body: JSON.stringify({ data: { ...payload, devices: batch } }),
      });
      const reply = await res.json();
      const sent = countOf(reply?.sent);
      // Only an answer that says how many were sent counts as an answer.
      if (!res.ok || reply?.data !== "success" || sent === null) {
        throw new Error(`The server answered ${res.status} without a result`);
      }
      outcome.sent += sent;
      outcome.failed += countOf(reply.failed) ?? 0;
      outcome.skipped += countOf(reply.skipped) ?? 0;
      outcome.outside += countOf(reply.outside) ?? 0;
    } catch (err) {
      console.error(`Notification batch ${batchNumber} of ${outcome.batches} failed:`, err);
      outcome.batchesFailed += 1;
      outcome.unanswered += batch.length;
    }
  }
  return outcome;
}

/** The lines every report shares: refusals, entries left out, and how many of the batches went through. */
function detailLines(outcome: SendOutcome): string[] {
  const lines: string[] = [];
  if (outcome.failed > 0) {
    lines.push(`${counted(outcome.failed, "device")} could not be sent to: the push service refused the message or could not be reached.`);
  }
  if (outcome.skipped > 0) {
    lines.push(`${counted(outcome.skipped, "entry", "entries")} in the list ${outcome.skipped === 1 ? "was" : "were"} not a valid device and ${outcome.skipped === 1 ? "was" : "were"} left out.`);
  }
  if (outcome.batches > 1) {
    lines.push(
      outcome.batchesFailed === 0
        ? `All ${outcome.batches} batches went through.`
        : `${outcome.batches - outcome.batchesFailed} of ${outcome.batches} batches went through. The ${counted(outcome.batchesFailed, "batch", "batches")} that failed covered ${counted(outcome.unanswered, "device")}, which may not have received it.`
    );
  }
  return lines;
}

const frostedButton = BUTTON;

/**
 * A record that is not drawn as a device: its key is not a push token, it
 * could not be read, or drawing its card failed. It can still be deleted.
 */
const PlaceholderRow = ({ recordKey, title, note, onDelete }: {
  recordKey: string;
  title: string;
  note: string;
  onDelete: () => void;
}) => (
  <div className="m-4 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/35 backdrop-blur-md border border-white/60 rounded-2xl text-amber-950">
    <div className="min-w-0">
      <p className="font-bold">{title}</p>
      <p className="text-sm text-amber-900/80">{note}</p>
      <p className="text-sm text-amber-900/80 break-all">Record: {textOf(recordKey)}</p>
    </div>
    <button type="button" className={`${BUTTON_SM} shrink-0`} onClick={onDelete}>
      Delete
    </button>
  </div>
);

const DeviceCard = ({ device, onDelete, onDecode }: {
  device: DeviceView;
  onDelete: () => void;
  onDecode: () => void;
}) => (
  <Card className="m-4 p-3 max-w-full">
    <CardHeader className="flex gap-3">
      <div className="flex flex-col min-w-0">
        <p className="text-md break-all">Token: {device.key}</p>
        <p className="text-small text-default-500">Brand : {device.brand}</p>
        <p className="text-small text-default-500">Model : {device.modelName}</p>
        <p className="text-small text-default-500">Device Name : {device.deviceName}</p>
      </div>
    </CardHeader>
    <CardBody>
      <p>Product Name : {device.productName}</p>
      <p>RAM : {device.totalMemory === null ? "unknown" : formatBytesToGB(device.totalMemory)}</p>
      <div>
        {device.hasLocation ? (<><Divider />
          <p><span className="block text-center mt-2 font-bold">Last Known Location</span> <br /> Latitude : {device.latitude ?? "unknown"} <br /> Longitude : {device.longitude ?? "unknown"}</p></>) : null}
      </div>
    </CardBody>
    <Divider />
    <CardFooter>
      {/* On a white card, so the solid tone: frosted glass would be white on white. */}
      <button type="button" className={`${BUTTON_SOLID_SM} mx-auto mt-2`} onClick={onDelete}>
        Delete
      </button>
      <button type="button" className={`${BUTTON_SOLID_SM} mx-auto mt-2`} onClick={onDecode}>
        Decode Address
      </button>
    </CardFooter>
  </Card>
);

const Page = () => {

  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  // null until the register has been read once. An empty list means it was
  // read and holds no devices, which is a different thing.
  const [devices, setDevices] = useState<DeviceView[] | null>(null);
  // The latest read failed. Whatever list was already loaded stays on screen.
  const [loadFailed, setLoadFailed] = useState<boolean>(false);
  // The register is being read or a record removed.
  const [loading, setLoading] = useState<boolean>(false);
  // What a send in progress is doing, or null when none is. A second send
  // cannot be started meanwhile: several batches can take a while, and a
  // second press would notify every device twice.
  const [sending, setSending] = useState<string | null>(null);
  const [report, setReport] = useState<SendReport | null>(null);
  const [shown, setShown] = useState<number>(ROWS_PER_STEP);
  const [unusableShown, setUnusableShown] = useState<number>(ROWS_PER_STEP);
  const [notif, setNotif] = useState<string | null>(null);
  const [radius, setRadius] = useState<string | null>('500');
  const [latitude, setLatitude] = useState<string | null>(null);
  const [longitude, setLongtitude] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { toast } = useContext(ToastContext);

  // Records whose key is a push token are devices. The rest are listed apart,
  // can be deleted, and are never sent to.
  const usable = (devices ?? []).filter((device) => device.token !== null);
  const unusable = (devices ?? []).filter((device) => device.token === null);

  /**
   * The devices a send may go to, or null (having said why) when there are
   * none. A send must never be reported as made when the list was not loaded
   * or is empty: an empty list used to be posted and answered with success.
   */
  const devicesToSendTo = (): DeviceView[] | null => {
    if (devices === null) {
      toast({
        type: "error",
        message: loading
          ? "The device list is still loading. Nothing was sent: try again in a moment."
          : "The device list could not be loaded, so nothing was sent. Use Try again below.",
      });
      return null;
    }
    if (usable.length === 0) {
      toast({ type: "error", message: "There are no registered devices to send to. Nothing was sent." });
      return null;
    }
    return usable;
  };

  const sendNotification = async () => {
    if (sending) return;
    if (!notif?.trim() || !latitude?.trim() || !longitude?.trim()) {
      toast({ type: "warning", message: "Message, latitude and longitude are required" });
      return;
    }
    // Checked here as well as on the server: a circle that cannot be drawn
    // matches no device, and that must not look like a notification sent.
    const lat = Number(latitude);
    const lon = Number(longitude);
    const rad = Number(radius?.trim() ? radius : NaN);
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180) {
      toast({ type: "warning", message: "Latitude must be a number from -90 to 90 and longitude from -180 to 180" });
      return;
    }
    if (!Number.isFinite(rad) || rad <= 0) {
      toast({ type: "warning", message: "Radius must be a number of metres greater than 0" });
      return;
    }
    const all = devicesToSendTo();
    if (!all) return;

    // Only a device with a recorded location can be inside the area, and only
    // its token and coordinates are posted, not the whole stored record.
    const targets: PushTarget[] = [];
    for (const device of all) {
      if (device.token === null || device.latitude === null || device.longitude === null) continue;
      targets.push([device.token, { Location: { coords: { latitude: device.latitude, longitude: device.longitude } } }]);
    }
    const title = "Location based notification";
    const at = new Date().toLocaleTimeString();
    if (targets.length === 0) {
      const line = `None of the ${counted(all.length, "registered device")} has a recorded location, so a location based notification cannot reach any of them. Nothing was sent.`;
      setReport({ title, at, ok: false, lines: [line] });
      toast({ type: "error", message: "No registered device has a recorded location. Nothing was sent." });
      return;
    }

    setSending("Sending…");
    try {
      const outcome = await sendInBatches("/api/notification", { message: notif, lat, lon, rad }, targets, setSending);
      const answered = outcome.batchesFailed === 0;
      const inArea = outcome.sent + outcome.failed;
      const lines: string[] = [];
      if (outcome.batchesFailed === outcome.batches) {
        lines.push("The notification could not be sent. It is not known to have reached any device.");
        toast({ type: "error", message: "Notification could not be sent" });
      } else if (outcome.sent === 0 && inArea === 0 && answered) {
        lines.push("No registered device has a last known location inside that area, so nothing was sent.");
        toast({ type: "warning", message: "No registered device is inside that area. Nothing was sent." });
      } else if (outcome.sent === 0) {
        lines.push("The notification did not reach any device.");
        toast({ type: "error", message: "Notification could not be sent" });
      } else {
        lines.push(`Sent to ${counted(outcome.sent, "device")} in the selected area.`);
        if (answered && outcome.failed === 0) {
          toast({ type: "success", message: "Notification sent to devices in the selected area" });
        } else {
          toast({ type: "warning", message: `Notification sent to ${counted(outcome.sent, "device")} in the selected area, but not to all of them. See the details on the page.` });
        }
      }
      lines.push(...detailLines(outcome));
      if (outcome.outside > 0) {
        lines.push(`${counted(outcome.outside, "device")} with a recorded location ${outcome.outside === 1 ? "is" : "are"} outside the area.`);
      }
      if (targets.length < all.length) {
        lines.push(`${counted(all.length - targets.length, "registered device")} with no recorded location could not be considered.`);
      }
      setReport({ title, at, ok: answered && outcome.sent > 0 && outcome.failed === 0, lines });
      // Cleared only when every batch was answered and it reached someone.
      // Otherwise it stays, so it can be sent again without retyping.
      if (answered && outcome.sent > 0) setNotif(null);
    } catch (err) {
      console.error("Location notification failed:", err);
      setReport({ title, at, ok: false, lines: ["The notification could not be sent."] });
      toast({ type: "error", message: "Notification could not be sent" });
    } finally {
      setSending(null);
    }
  };

  const sendNotificationGeneral = async () => {
    if (sending) return;
    if (!message?.trim()) {
      toast({ type: "warning", message: "Notification message is required" });
      return;
    }
    const all = devicesToSendTo();
    if (!all) return;

    // The route needs nothing but each device's token.
    const targets: PushTarget[] = [];
    for (const device of all) {
      if (device.token !== null) targets.push([device.token]);
    }
    const title = "General notification";
    const at = new Date().toLocaleTimeString();

    setSending("Sending…");
    try {
      const outcome = await sendInBatches("/api/notification/general", { notification: message }, targets, setSending);
      const answered = outcome.batchesFailed === 0;
      const lines: string[] = [];
      if (outcome.batchesFailed === outcome.batches) {
        lines.push("The notification could not be sent. It is not known to have reached any device.");
        toast({ type: "error", message: "Notification could not be sent" });
      } else if (outcome.sent === 0) {
        lines.push("The notification did not reach any device.");
        toast({ type: "error", message: "Notification could not be sent" });
      } else if (outcome.sent === targets.length) {
        lines.push(`Sent to all ${counted(targets.length, "registered device")}.`);
        toast({ type: "success", message: "Notification sent to all registered devices" });
      } else {
        lines.push(`Sent to ${outcome.sent.toLocaleString()} of ${counted(targets.length, "registered device")}.`);
        toast({ type: "warning", message: `Notification sent to ${outcome.sent.toLocaleString()} of ${counted(targets.length, "registered device")}. See the details on the page.` });
      }
      lines.push(...detailLines(outcome));
      setReport({ title, at, ok: outcome.sent === targets.length, lines });
      // Cleared only when every batch was answered and it reached someone.
      // Otherwise it stays, so it can be sent again without retyping.
      if (answered && outcome.sent > 0) setMessage(null);
    } catch (err) {
      console.error("General notification failed:", err);
      setReport({ title, at, ok: false, lines: ["The notification could not be sent."] });
      toast({ type: "error", message: "Notification could not be sent" });
    } finally {
      setSending(null);
    }
  }

  const getProbableAddress = async (lat: number | null, long: number | null) => {
    // Reset so the modal never shows a previous device's address
    setAddress(null);
    if (lat === null || long === null) {
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
      if (!res.ok) throw new Error(`The server answered ${res.status}`);
      setAddress(textOf(data) || "No Address Found");
    } catch (err) {
      console.error("Geocoding failed:", err);
      setAddress("Could not resolve address. Please try again later.");
    }
  }


  // Reads the device register directly as the signed-in admin — the
  // unauthenticated GET /api/registrations endpoint (a device-PII leak)
  // was removed. The read goes through readAsStaff, not the Firebase SDK:
  // the SDK's get() rejects the whole register if any one record holds a key
  // named "hasOwnProperty".
  const fetchDeviceRegister = async () => {
    setLoading(true);
    try {
      const register = await readAsStaff<unknown>("notifications_register", { records: true });
      setDevices(deviceViews(register));
      setLoadFailed(false);
    } catch (err) {
      // The list already on screen, if any, is left as it is.
      setLoadFailed(true);
      toast({
        type: "error",
        message: "List Not Fetched! Try again Later",
      });
      console.error("Device list fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const deleteDeviceFromRegister = async (key: string) => {
    if (!isAddressable(key)) {
      toast({ type: "error", message: "This record cannot be removed from here. Remove it in the Firebase console." });
      return;
    }
    if (!confirm("Remove this device from the notification register?")) {
      return;
    }
    setLoading(true);
    try {
      await remove(ref(database, `notifications_register/${key}`));
      toast({ type: "success", message: "Device removed from register" });
      // Taken off the screen now, in case the fresh read below fails.
      setDevices((current) => (current ? current.filter((device) => device.key !== key) : current));
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


  useEffect(() => {
    fetchDeviceRegister();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  return (
    <div className="w-full min-h-screen">
      <h1 className="text-center font-bold text-4xl md:text-5xl text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)] py-4 my-6">Notifications Center</h1>
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
                <button type="button" className={BUTTON_SOLID} onClick={onClose}>
                  Close
                </button>
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
            <button type="button" className={`${BUTTON_SOLID} mx-auto`} disabled={sending !== null} onClick={() => sendNotificationGeneral()}>Send Notification</button>
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
            <button type="button" className={`${BUTTON_SOLID} mx-auto`} disabled={sending !== null} onClick={() => sendNotification()}>Push Notification</button>
          </CardFooter>
        </Card>
      </div>

      {sending ? (
        <p role="status" className="text-center font-bold text-amber-950 mt-4 animate-pulse">{sending}</p>
      ) : null}

      {report ? (
        <div
          role="status"
          className="max-w-3xl mx-4 md:mx-auto mt-4 p-5 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl text-amber-950 shadow-[0_8px_32px_rgba(120,72,10,0.12)]"
        >
          <p className="font-bold text-lg">{report.title}, {report.at}</p>
          {report.lines.map((line, index) => (
            // The first line says what happened; it stands out when that was
            // anything short of a clean send.
            <p key={index} className={index === 0 && !report.ok ? "font-bold mt-1" : "text-sm text-amber-900/80 mt-1"}>{line}</p>
          ))}
        </div>
      ) : null}

      <Divider className="mt-4" />

      {loadFailed ? (
        <div
          role="alert"
          className="max-w-3xl mx-4 md:mx-auto mt-6 p-5 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl text-center text-amber-950 shadow-[0_8px_32px_rgba(120,72,10,0.12)]"
        >
          <p className="font-bold text-lg">Could not load the registered devices</p>
          <p className="text-sm text-amber-900/80 mb-4">
            {devices === null
              ? "The device register could not be read, so no devices are shown and no notification can be sent. That does not mean there are none. Check your connection and try again."
              : "The register could not be read again. What is below is as it was when it last loaded."}
          </p>
          <button type="button" onClick={fetchDeviceRegister} disabled={loading} className={frostedButton}>
            {loading ? "Trying again…" : "Try again"}
          </button>
        </div>
      ) : null}

      {devices === null ? (
        loadFailed ? null : (
          <p className="text-center text-amber-900/80 py-6 animate-pulse">Loading the registered devices…</p>
        )
      ) : (
        <div>
          <p className="text-center font-bold text-3xl text-amber-950 py-4 mt-6">Registered Devices List</p>
          {usable.length > 0 ? (
            <p className="text-center text-amber-900/80">
              {counted(usable.length, "device")} registered
              {usable.length > shown ? `, showing the first ${shown.toLocaleString()}` : ""}
            </p>
          ) : loadFailed ? null : (
            <p className="text-center text-amber-900/80">No devices are registered yet.</p>
          )}
          {usable.slice(0, shown).map((device) => {
            const onDelete = () => deleteDeviceFromRegister(device.key);
            // Shown in place of the card when the record could not be read,
            // or when drawing the card fails.
            const placeholder = (
              <PlaceholderRow
                recordKey={device.key}
                title="This record could not be displayed"
                note="It is still sent general notifications, because its name is a push token."
                onDelete={onDelete}
              />
            );
            return (
              <CardBoundary key={device.key} resetKey={devices} fallback={placeholder}>
                {device.unreadable ? placeholder : (
                  <DeviceCard
                    device={device}
                    onDelete={onDelete}
                    onDecode={() => {
                      getProbableAddress(device.latitude, device.longitude);
                      onOpen();
                    }}
                  />
                )}
              </CardBoundary>
            );
          })}
          {usable.length > shown ? (
            <div className="text-center my-4">
              <button type="button" onClick={() => setShown(shown + ROWS_PER_STEP)} className={frostedButton}>
                Show {Math.min(ROWS_PER_STEP, usable.length - shown)} more
              </button>
            </div>
          ) : null}

          {unusable.length > 0 ? (
            <div>
              <p className="text-center font-bold text-xl text-amber-950 pt-6">
                Records that are not device registrations ({unusable.length.toLocaleString()})
              </p>
              <p className="text-center text-sm text-amber-900/80 px-4">
                Their names are not push tokens, so no notification is ever sent to them. They can be deleted.
              </p>
              {unusable.slice(0, unusableShown).map((device) => (
                <CardBoundary
                  key={device.key}
                  resetKey={devices}
                  fallback={
                    <p className="m-4 p-4 bg-white/35 backdrop-blur-md border border-white/60 rounded-2xl text-amber-950">
                      This record could not be displayed. Remove it in the Firebase console.
                    </p>
                  }
                >
                  <PlaceholderRow
                    recordKey={device.key}
                    title="Not a device registration"
                    note="Never sent to."
                    onDelete={() => deleteDeviceFromRegister(device.key)}
                  />
                </CardBoundary>
              ))}
              {unusable.length > unusableShown ? (
                <div className="text-center my-4">
                  <button type="button" onClick={() => setUnusableShown(unusableShown + ROWS_PER_STEP)} className={frostedButton}>
                    Show {Math.min(ROWS_PER_STEP, unusable.length - unusableShown)} more
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Page;
