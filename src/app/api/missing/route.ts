import app from "@/lib/firebase";
import { getDatabase, ref, child, get, push, update } from "firebase/database";

export async function POST(req: Request) {
  const db = await getDatabase(app);
  const body = await req.json();
  const newKey = await push(child(ref(db), 'missings')).key;
  try {
    const updates:any = {};
    updates['/missings/' + newKey] = body;
    await update(ref(db), updates);
    return Response.json({ data: newKey });
  } catch (err) {
    console.log(err);
    return Response.json({ data: "request failure" });
  }
}

export async function GET(req: Request) {
  // await dbConnect();

  const db = await getDatabase(app);
  const dbRef = await ref(db);
  try {
    const data = await get(child(dbRef, 'missings'))
    if(data.exists()){
      const missings = await data.val()
      return Response.json({data : missings})
    }
  } catch (err) {
    console.log(err)
    return Response.json({data: "request failure"})
  }

}