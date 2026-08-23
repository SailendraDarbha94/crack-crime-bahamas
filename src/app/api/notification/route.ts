import { Expo } from "expo-server-sdk";
import { verifyAdmin } from "@/lib/serverAuth";

// True circular geofence: haversine distance between the two points must be
// within the requested radius (metres).
const isWithinRadius = (
  deviceLat: number,
  deviceLon: number,
  targetLat: number,
  targetLon: number,
  radiusMetres: number
): boolean => {
  if ([deviceLat, deviceLon, targetLat, targetLon, radiusMetres].some((n) => !Number.isFinite(n))) {
    return false;
  }
  const earthRadius = 6371000; // metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(deviceLat - targetLat);
  const dLon = toRad(deviceLon - targetLon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(targetLat)) * Math.cos(toRad(deviceLat)) * Math.sin(dLon / 2) ** 2;
  const distance = 2 * earthRadius * Math.asin(Math.sqrt(a));
  return distance <= radiusMetres;
};

export async function POST(req: Request) {
  // Only allowlisted admins may broadcast through the Expo account
  if (!(await verifyAdmin(req))) {
    return Response.json({ data: "unauthorized" }, { status: 401 });
  }

  let somePushTokens: string[] = [];
  const { data } = await req.json();

  if (!data || !Array.isArray(data.devices) || typeof data.message !== "string") {
    return Response.json({ data: "request failure" }, { status: 400 });
  }
  if (data.devices.length > 500) {
    return Response.json({ data: "request failure" }, { status: 400 });
  }

  const targetLat = Number(data.lat);
  const targetLon = Number(data.lon);
  const radius = Number(data.rad);

  data.devices.forEach((element: any) => {
    if (
      isWithinRadius(
        Number(element[1]?.Location?.coords?.latitude),
        Number(element[1]?.Location?.coords?.longitude),
        targetLat,
        targetLon,
        radius
      )
    ) {
      somePushTokens.push(`ExponentPushToken[{token}]`.replace("{token}", element[0]));
    }
  });

  let expo = new Expo({
    accessToken: process.env.EXPO_ACCESS_TOKEN,
    useFcmV1: true, // this can be set to true in order to use the FCM v1 API
  });

  // Create the messages that you want to send to clients
  let messages: any = [];
  for (let pushToken of somePushTokens) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.log(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
      to: pushToken,
      sound: "default",
      body: data.message,
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  let tickets: any = [];
  async function pushNotifs() {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
        console.error(error);
      }
    }
  }




  pushNotifs();
  return Response.json({ data: "success" });
}
