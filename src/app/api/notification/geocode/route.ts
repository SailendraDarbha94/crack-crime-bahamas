import { verifyAdmin } from "@/lib/serverAuth";

// Reverse-geocode a device's coordinates for the admin notifications page.
// Admin-gated so the Maps API key can't be farmed through this relay.
// The key is server-only (no NEXT_PUBLIC_ prefix).

/**
 * A coordinate as a real number within `limit` degrees, or null. The
 * coordinates come from a device record, which anyone can write, and they go
 * into the address of a request to Google: nothing but a number may get there.
 */
const coordinate = (value: unknown, limit: number): number | null => {
  // Number() alone reads "", null and [] as 0.
  const usable = typeof value === "number" || (typeof value === "string" && value.trim() !== "" && value.length <= 40);
  const parsed = usable ? Number(value) : NaN;
  return Number.isFinite(parsed) && Math.abs(parsed) <= limit ? parsed : null;
};

export async function POST(req: Request) {
    if (!(await verifyAdmin(req))) {
      return Response.json({ data: "unauthorized" }, { status: 401 });
    }

    let data: any;
    try {
      data = (await req.json())?.data;
    } catch {
      return Response.json({ data: "request failure" }, { status: 400 });
    }

    const latitude = coordinate(data?.latitude, 90);
    const longitude = coordinate(data?.longitude, 180);
    if (latitude === null || longitude === null) {
      return Response.json({ data: "request failure" }, { status: 400 });
    }

    let address = 'No Address Found';
    try {
        // toFixed keeps a very small number from being written as "1e-7";
        // six places is about ten centimetres, finer than the service uses.
        const query = new URLSearchParams({
          latlng: `${latitude.toFixed(6)},${longitude.toFixed(6)}`,
          key: process.env.GOOGLE_MAPS_API_KEY ?? "",
        });
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${query}`,{
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        })
        const geocodeData = await res.json();
        const found: unknown = geocodeData?.results?.[0]?.formatted_address;
        // The page shows this as text, so only text is passed on.
        if (typeof found === "string" && found) address = found;
      } catch (err) {
        console.error("Geocoding request failed:", err);
      }

    return Response.json({ data: address });
}
