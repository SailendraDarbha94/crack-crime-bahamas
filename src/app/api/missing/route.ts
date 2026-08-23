import app from "@/lib/firebase";
import { getDatabase, ref, child, get } from "firebase/database";

// Always serve live data — without this, a GET-only route gets statically
// pre-rendered at build time and would return a stale snapshot forever.
export const dynamic = "force-dynamic";

// Public read of missing persons (the data is public by design — it powers
// the public gallery and the mobile app feed).
//
// The POST handler was removed: it duplicated the authed client-side write
// the admin UI performs via MissingPersonService, and allowed anyone to
// publish records. Admin writes go through the database rules directly.

export async function GET(req: Request) {
  const db = getDatabase(app);
  const dbRef = ref(db);
  try {
    const data = await get(child(dbRef, 'missings'))
    if(data.exists()){
      const missings = data.val()
      return Response.json({data : missings})
    }
    return Response.json({ data: {} })
  } catch (err) {
    console.error("Missing persons fetch failed:", err);
    return Response.json({data: "request failure"}, { status: 500 })
  }
}
