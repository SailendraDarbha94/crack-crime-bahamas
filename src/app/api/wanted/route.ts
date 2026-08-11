import app from "@/lib/firebase";
import { child, get, getDatabase, push, ref, update } from "firebase/database";

export async function POST(req:Request) {
  const db = await getDatabase(app);
  const body = await req.json();
  const newKey = await push(child(ref(db), 'wanteds')).key;
  try {
    const updates:any = {};
    updates['/wanteds/' + newKey] = body;
    await update(ref(db), updates);
    return Response.json({ data: newKey });
  } catch (err) {
    console.log(err);
    return Response.json({ data: "request failure" });
  }
}

export async function GET(req:Request) {
  const db = await getDatabase(app);
  const dbRef = await ref(db);
  try {
    const data = await get(child(dbRef, 'wanteds'))
    if(data.exists()){
      const wanteds = await data.val()
      return Response.json({data : wanteds})
    }
    return Response.json({ data: {} })
  } catch (err) {
    console.log(err)
    return Response.json({data: "request failure"})
  }

}
