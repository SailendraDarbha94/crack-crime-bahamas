/**
 * Sending a push notification through Expo (server only): what both
 * notification routes do once they have decided who should get it.
 */
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import { MIXED_APPS_CODE, splitByApp } from "./pushGroups";

/**
 * How many groups a batch that Expo refused for mixing apps is sent as, at
 * most. The app's own devices are one group, and the largest; a planted token
 * or two make one or two more. Without a limit, a batch salted with tokens
 * from dozens of different apps would turn one request into dozens, sent one
 * after another, and the send could run out of time before real devices in
 * later batches were reached.
 */
const MOST_GROUPS = 5;

/** An error's message with any push token in it blanked: tokens are not written to the logs. */
export const withoutTokens = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).replace(
    /Expo(?:nent)?PushToken\[[^\]]*\]/g,
    "ExponentPushToken[...]"
  );

/**
 * Sends `body` to every token and counts what Expo answered for each message.
 * A token is the part between the brackets of "ExponentPushToken[...]", which
 * is what the device register is keyed by.
 *
 * The caller awaits this before answering. On a serverless host, work left
 * running after the response may never run at all, so a notification sent
 * that way can be lost with nobody told.
 */
export async function pushToAll(
  tokens: Iterable<string>,
  body: string
): Promise<{ sent: number; failed: number; skipped: number }> {
  const expo = new Expo({
    accessToken: process.env.EXPO_ACCESS_TOKEN,
    useFcmV1: true, // this can be set to true in order to use the FCM v1 API
  });

  // Create the messages that you want to send to clients
  // (see https://docs.expo.io/push-notifications/sending-notifications/)
  const messages: ExpoPushMessage[] = [];
  let skipped = 0;
  for (const token of tokens) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
    const pushToken = `ExponentPushToken[${token}]`;
    if (!Expo.isExpoPushToken(pushToken)) {
      skipped += 1;
      continue;
    }
    messages.push({ to: pushToken, sound: "default", body });
  }

  let sent = 0;
  let failed = 0;
  // Why Expo turned messages down, by its error code, for the server log.
  const refusals = new Map<string, number>();

  /** Counts the tickets Expo gave for a batch of `size` messages. */
  const count = (tickets: ExpoPushTicket[], size: number) => {
    let accepted = 0;
    for (const ticket of tickets) {
      if (ticket?.status === "ok") {
        accepted += 1;
        continue;
      }
      // The error codes are listed in the Expo documentation:
      // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      const code = ticket?.details?.error;
      const reason = typeof code === "string" ? code : "unknown";
      refusals.set(reason, (refusals.get(reason) ?? 0) + 1);
    }
    sent += accepted;
    // A message with no ticket at all was not accepted either.
    failed += Math.max(0, size - accepted);
  };

  // Send one chunk at a time, which spreads the load out over time.
  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      count(await expo.sendPushNotificationsAsync(chunk), chunk.length);
    } catch (error) {
      // Expo refuses a whole batch when its tokens belong to more than one
      // app, and nothing in it is sent. One record planted in the register
      // with another app's token would otherwise cost every device in its
      // batch every notification (see pushGroups.ts). Expo says which tokens
      // belong together, so each app's share is sent on its own, once.
      const refusal = error as { code?: unknown; details?: unknown } | null;
      const groups = refusal?.code === MIXED_APPS_CODE ? splitByApp(chunk, refusal.details) : null;
      if (!groups) {
        // The whole chunk counts as not sent. Only the message is logged: the
        // error object itself can carry tickets and tokens.
        failed += chunk.length;
        console.error("A batch of push notifications was not sent:", withoutTokens(error));
        continue;
      }
      // Largest first: that is this app's own devices, which must not wait
      // behind a stranger's, and any group past the limit is not sent.
      groups.sort((a, b) => b.length - a.length);
      const sending = groups.slice(0, MOST_GROUPS);
      const dropped = groups.slice(MOST_GROUPS);
      for (const group of dropped) failed += group.length;
      // Sizes only, never the tokens. More than one group means the register
      // holds records that are not this app's devices; the log says how many,
      // not which.
      console.error(
        "A batch held push tokens from more than one app, so it was sent as separate groups of:",
        JSON.stringify(sending.map((group) => group.length)),
        dropped.length ? `(${dropped.length} more small groups were not sent)` : ""
      );
      for (const group of sending) {
        try {
          count(await expo.sendPushNotificationsAsync(group), group.length);
        } catch (groupError) {
          // Not split a second time: a group that still fails is not sent.
          failed += group.length;
          console.error("A group of push notifications was not sent:", withoutTokens(groupError));
        }
      }
    }
  }

  if (refusals.size > 0) {
    console.error("Push notifications refused by Expo:", JSON.stringify(Array.from(refusals)));
  }
  return { sent, failed, skipped };
}
