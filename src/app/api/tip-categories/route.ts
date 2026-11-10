import { TIP_CATEGORIES } from "@/lib/tipCategories";

// The type-of-crime list for the mobile app's tip form. The app asks for it
// each time the form opens (falling back to the copy it was built with), so
// the list in src/lib/tipCategories.ts can change without a store release.
export const dynamic = "force-static";

export async function GET() {
  return Response.json(
    { data: TIP_CATEGORIES },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
  );
}
