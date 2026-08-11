import { Expo } from "expo-server-sdk";
import { verifyAdmin } from "@/lib/serverAuth";

// Broadcast a push notification to all registered devices. The token list
// comes from the (admin-authenticated) notifications page, which reads the
// device register client-side — this route no longer reads the database
// itself, so it works under the locked database rules.

export async function POST(req: Request) {
  // Only allowlisted admins may broadcast through the Expo account
  if (!(await verifyAdmin(req))) {
    return Response.json({ data: "unauthorized" }, { status: 401 });
  }

  const { data } = await req.json();

  if (!data || typeof data.notification !== "string" || !Array.isArray(data.devices)) {
    return Response.json({ data: "request failure" }, { status: 400 });
  }
  if (data.devices.length > 500) {
    return Response.json({ data: "request failure" }, { status: 400 });
  }

  const somePushTokens: string[] = data.devices.map((element: any) =>
    `ExponentPushToken[{token}]`.replace("{token}", element[0])
  );

  let expo = new Expo({
    accessToken: process.env.EXPO_ACCESS_TOKEN,
    useFcmV1: true, // this can be set to true in order to use the FCM v1 API
  });

  // Create the messages that you want to send to clients
  let messages: any = [];
  for (let pushToken of somePushTokens) {
    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn(`Push token is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: "default",
      body: data.notification,
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  let tickets: any = [];
  async function pushNotifs() {
    // Send one chunk at a time to spread the load
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
  }

  await pushNotifs();
  return Response.json({ data: "success" });
}
