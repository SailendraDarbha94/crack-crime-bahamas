import { pushToAll, withoutTokens } from "@/lib/expoPush";
import { verifyAdmin } from "@/lib/serverAuth";

// Broadcast a push notification to all registered devices. The token list
// comes from the (admin-authenticated) notifications page, which reads the
// device register client-side — this route no longer reads the database
// itself, so it works under the locked database rules.
//
// The register can be written by anyone, so the list is checked entry by
// entry here as well as on the page, and the answer says what happened to the
// messages instead of a bare "success".

/**
 * The part of a push token the register is keyed by: what goes between the
 * brackets of "ExponentPushToken[...]". Kept in step with /api/registrations.
 */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

/** The most devices one request may carry. The page sends the register in batches of this size. */
const MAX_DEVICES = 500;

export async function POST(req: Request) {
  // Only allowlisted admins may broadcast through the Expo account
  if (!(await verifyAdmin(req))) {
    return Response.json({ data: "unauthorized" }, { status: 401 });
  }

  let data: any;
  try {
    data = (await req.json())?.data;
  } catch {
    return Response.json({ data: "request failure" }, { status: 400 });
  }

  if (!data || typeof data.notification !== "string" || !Array.isArray(data.devices)) {
    return Response.json({ data: "request failure" }, { status: 400 });
  }
  if (data.devices.length > MAX_DEVICES) {
    return Response.json({ data: "request failure" }, { status: 400 });
  }

  // Each entry should be [token, ...]. Entries that are not, and tokens
  // listed twice, are counted and left out.
  const tokens = new Set<string>();
  let skipped = 0;
  for (const entry of data.devices as unknown[]) {
    const token: unknown = Array.isArray(entry) ? entry[0] : undefined;
    if (typeof token !== "string" || !TOKEN_PATTERN.test(token) || tokens.has(token)) {
      skipped += 1;
      continue;
    }
    tokens.add(token);
  }

  try {
    const result = await pushToAll(tokens, data.notification);
    // "success" means the request was processed. How many devices it reached
    // is in the numbers, and the page reports those.
    return Response.json({
      data: "success",
      sent: result.sent, // messages Expo accepted
      failed: result.failed, // messages Expo refused, or in a chunk that could not be sent
      skipped: skipped + result.skipped, // entries that were not a device
    });
  } catch (error) {
    console.error("General notification failed:", withoutTokens(error));
    return Response.json({ data: "request failure" }, { status: 500 });
  }
}
