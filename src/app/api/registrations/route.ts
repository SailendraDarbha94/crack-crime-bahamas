import app from "@/lib/firebase";
import { child, getDatabase, push, ref, set, update } from "firebase/database";

export async function POST(req: Request) {
  const data = await req.json();
  console.log("this is the request data", data);
  const db = await getDatabase(app);
  const dataRef = ref(db, `/notifications_register/${data.Token}`);
  try {
    // const updates: any = {};
    // updates["/notifications_register/" + newKey] = { ...data };
    // await update(ref(db), updates);
    //await set(dataRef, data);
    return Response.json({ data: "success" });
  } catch (err) {
    console.log(err);
    return Response.json({ data: "request failure" });
  }
}
