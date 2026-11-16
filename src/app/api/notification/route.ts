import { pushToAll, withoutTokens } from "@/lib/expoPush";
import { verifyAdmin } from "@/lib/serverAuth";

// Send a push notification to the registered devices whose last known
// location is inside a circle. The device list comes from the
// (admin-authenticated) notifications page, which reads the device register
// client-side: this route does not read the database itself.
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

/**
 * A number sent as one, or typed into a form field. Null for anything else:
 * Number() alone reads "", null and [] as 0, which would put the centre of
 * the circle (or a device) on the equator.
 */
const numberFrom = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim() || value.length > 40) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** A stored coordinate: a real number or nothing. */
const coordinate = (value: unknown, limit: number): number | null =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit ? value : null;

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

  if (!data || !Array.isArray(data.devices) || typeof data.message !== "string") {
    return Response.json({ data: "request failure" }, { status: 400 });
  }
  if (data.devices.length > MAX_DEVICES) {
    return Response.json({ data: "request failure" }, { status: 400 });
  }

  // A circle that cannot be drawn is refused. It used to match no device and
  // still be answered with "success", which the page reported as sent.
  const targetLat = numberFrom(data.lat);
  const targetLon = numberFrom(data.lon);
  const radius = numberFrom(data.rad);
  if (
    targetLat === null || targetLon === null || radius === null ||
    Math.abs(targetLat) > 90 || Math.abs(targetLon) > 180 || radius <= 0
  ) {
    return Response.json({ data: "request failure" }, { status: 400 });
  }

  // Each entry should be [token, { Location: { coords: { latitude, longitude } } }].
  // Entries that are not, and tokens listed twice, are counted and left out.
  const tokens = new Set<string>();
  let skipped = 0;
  let outside = 0;
  for (const entry of data.devices as unknown[]) {
    const token: unknown = Array.isArray(entry) ? entry[0] : undefined;
    if (typeof token !== "string" || !TOKEN_PATTERN.test(token) || tokens.has(token)) {
      skipped += 1;
      continue;
    }
    const coords = (entry as any[])[1]?.Location?.coords;
    const deviceLat = coordinate(coords?.latitude, 90);
    const deviceLon = coordinate(coords?.longitude, 180);
    // A device with no usable location is never "inside" the circle.
    if (
      deviceLat === null || deviceLon === null ||
      !isWithinRadius(deviceLat, deviceLon, targetLat, targetLon, radius)
    ) {
      outside += 1;
      continue;
    }
    tokens.add(token);
  }

  try {
    const result = await pushToAll(tokens, data.message);
    // "success" means the request was processed. How many devices it reached
    // is in the numbers, and the page reports those.
    return Response.json({
      data: "success",
      sent: result.sent, // messages Expo accepted
      failed: result.failed, // messages Expo refused, or in a chunk that could not be sent
      skipped: skipped + result.skipped, // entries that were not a device
      outside, // devices not inside the circle, or with no known location
    });
  } catch (error) {
    console.error("Location notification failed:", withoutTokens(error));
    return Response.json({ data: "request failure" }, { status: 500 });
  }
}
