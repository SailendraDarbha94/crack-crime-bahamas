import app from "@/lib/firebase";
import { Expo } from "expo-server-sdk";
import { child, get, getDatabase, ref } from "firebase/database";

export async function GET() {
  // const mongoDb = (await mongoClient).db("members");
  // const members = await mongoDb.collection("dev").find({}).toArray();
  // console.log("server hitted")
  
  // return Response.json({data : members})
  const db = await getDatabase(app);
  const dbRef = await ref(db);
  try {
    const data = await get(child(dbRef, 'notifications_register'))
    if(data.exists()){
      const list = await data.val()
      return Response.json({data : list})
    }
  } catch (err) {
    console.log(err)
    return Response.json({data: "request failure"})
  }
}


export async function POST(req: Request) {
  
  const { data } = await req.json();

  let somePushTokens = [
    `ExponentPushToken[${process.env.NEXT_PUBLIC_TEST_EXPONENT_TOKEN}]`,
  ];
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
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
      to: pushToken,
      sound: "default",
      body: data,
      data: { body: "o stree kal notification lana" },
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


  const isWithin50Meters = (targetLat: any, targetLon: any, receivedLat: any, receivedLon: any) => {
    const earthRadius = 6371000; // Radius of the Earth in meters

    // Approximate degree conversions
    const latDiff = 50 / earthRadius * (180 / Math.PI); // Convert 50m to latitude degrees
    const lonDiff = 50 / (earthRadius * Math.cos(targetLat * Math.PI / 180)) * (180 / Math.PI); // Convert 50m to longitude degrees

    // Define bounding box
    const minLat = targetLat - latDiff;
    const maxLat = targetLat + latDiff;
    const minLon = targetLon - lonDiff;
    const maxLon = targetLon + lonDiff;

    // Check if received coordinates fall within the bounding box
    if (receivedLat >= minLat && receivedLat <= maxLat) {
      if (receivedLon >= minLon && receivedLon <= maxLon) {
        console.log("Within Radius")
      }
    } else {
      console.log("Should Not Fire Notification")
    }
  };

  // Later, after the Expo push notification service has delivered the
  // notifications to Apple or Google (usually quickly, but allow the service
  // up to 30 minutes when under load), a "receipt" for each notification is
  // created. The receipts will be available for at least a day; stale receipts
  // are deleted.
  //
  // The ID of each receipt is sent back in the response "ticket" for each
  // notification. In summary, sending a notification produces a ticket, which
  // contains a receipt ID you later use to get the receipt.
  //
  // The receipts may contain error codes to which you must respond. In
  // particular, Apple or Google may block apps that continue to send
  // notifications to devices that have blocked notifications or have uninstalled
  // your app. Expo does not control this policy and sends back the feedback from
  // Apple and Google so you can handle it appropriately.
  // let receiptIds = [];
  // for (let ticket of tickets) {
  //   // NOTE: Not all tickets have IDs; for example, tickets for notifications
  //   // that could not be enqueued will have error information and no receipt ID.
  //   if (ticket.status === "ok") {
  //     receiptIds.push(ticket.id);
  //   }
  // }

  // let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  // (async () => {
  //   // Like sending notifications, there are different strategies you could use
  //   // to retrieve batches of receipts from the Expo service.
  //   for (let chunk of receiptIdChunks) {
  //     try {
  //       let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
  //       console.log(receipts);

  //       // The receipts specify whether Apple or Google successfully received the
  //       // notification and information about an error, if one occurred.
  //       for (let receiptId in receipts) {
  //         let { status, details } = receipts[receiptId];
  //         //
  //         if (status === "ok") {
  //           continue;
  //         } else if (status === "error") {
  //           console.error(`There was an error sending a notification`);
  //           if (details) {
  //             // The error codes are listed in the Expo documentation:
  //             // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
  //             // You must handle the errors appropriately.
  //             console.error(`The error code is ${JSON.stringify(details)}`);
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   }
  // })();

  console.log(
    "PUSH NOTIFICATION REQUEST RECEIVED : ==================================================",
    data
  );
  //pushNotifs();
  return Response.json({ data: "success" });
}
