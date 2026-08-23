import { verifyAdmin } from "@/lib/serverAuth";

// Reverse-geocode a device's coordinates for the admin notifications page.
// Admin-gated so the Maps API key can't be farmed through this relay.
// The key is server-only (no NEXT_PUBLIC_ prefix).

export async function POST(req: Request) {
    if (!(await verifyAdmin(req))) {
      return Response.json({ data: "unauthorized" }, { status: 401 });
    }

    let address = 'No Address Found';
    const { data } = await req.json();
    if (!data?.latitude || !data?.longitude) {
      return Response.json({ data: address });
    }
    try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${data.latitude},${data.longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`,{
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        })
        const geocodeData = await res.json();
        address = geocodeData?.results?.[0]?.formatted_address ?? 'No Address Found';
      } catch (err) {
        console.error("Geocoding request failed:", err);
      }

    return Response.json({ data: address });
}
