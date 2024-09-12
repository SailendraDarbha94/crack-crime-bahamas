import app from "@/lib/firebase";
import { Expo } from "expo-server-sdk";
import { child, getDatabase, push, ref, update } from "firebase/database";

export async function POST(req: Request) {
  const data = await req.json();
  console.log(data);
  const db = await getDatabase(app);
  const newKey = push(child(ref(db), "notifications_register")).key;
  try {
    const updates: any = {};
    updates["/notifications_register/" + newKey] = { ...data };
    await update(ref(db), updates);
    return Response.json({ data: newKey });
  } catch (err) {
    console.log(err);
    return Response.json({ data: "request failure" });
  }
  return Response.json({ data: "success" });
}
