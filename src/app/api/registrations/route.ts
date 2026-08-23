import app from "@/lib/firebase";
import { getDatabase, ref, set, update } from "firebase/database";

// Mobile-app device registration endpoints (create + location refresh).
// Both remain public because the app calls them anonymously; the database
// rules permit public create/update on /notifications_register/$token but
// deny public reads and deletes.
//
// The GET handler (returned every device's push token, model and GPS
// coordinates to any caller) and the DELETE handler were removed — the
// admin notifications page now reads and deletes as an authed admin
// directly against the database.

export async function POST(req: Request) {
  const data = await req.json();
  if (!data?.Token || typeof data.Token !== "string") {
    return Response.json({ data: "request failure" }, { status: 400 });
  }
  const db = getDatabase(app);
  const dataRef = ref(db, `/notifications_register/${data.Token}`);
  try {
    await set(dataRef, data);
    return Response.json({ data: "success" });
  } catch (err) {
    console.error("Device registration failed:", err);
    return Response.json({ data: "request failure" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const data = await req.json();
  if (!data?.Token || typeof data.Token !== "string") {
    return Response.json({ data: "request failure" }, { status: 400 });
  }
  const db = getDatabase(app);
  const dataRef = ref(db, `/notifications_register/${data.Token}`);

  try {
    await update(dataRef, data);
    return Response.json({ data: "success" });
  } catch (err) {
    console.error("Device update failed:", err);
    return Response.json({ data: "request failure" }, { status: 500 });
  }
}
