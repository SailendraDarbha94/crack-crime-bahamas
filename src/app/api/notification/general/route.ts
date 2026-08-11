import app from "@/lib/firebase";
import { Expo } from "expo-server-sdk";
import { child, get, getDatabase, ref } from "firebase/database";





export async function POST(req: Request) {

    let somePushTokens:any[] = [];

  
    const { data } = await req.json();
    console.log(data);
    const db = await getDatabase(app);
    const dbRef = await ref(db);
    try {
      const data = await get(child(dbRef, '/notifications_register'))
      if(data.exists()){
        const tokens = await data.val()
        somePushTokens = Object.keys(tokens).map(token => 'ExponentPushToken[{token}]'.replace("{token}", token))
      } else {
        console.log("errrorrrrrrr")
      }
    } catch (err) {
      console.log(err)
      return Response.json({data: "request failure"})
    }
  
    let expo = new Expo({
      accessToken: process.env.NEXT_PUBLIC_EXPO_ACCESS_TOKEN,
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
        body: data.notification,
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