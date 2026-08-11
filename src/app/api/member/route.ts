import app from "@/lib/firebase";
import { child, get, getDatabase, push, ref, update } from "firebase/database";

export async function GET() {
    const db = await getDatabase(app);
    const dbRef = await ref(db);
    try {
      const data = await get(child(dbRef, 'members'))
      if(data.exists()){
        const members = await data.val()
        return Response.json({data : members})
      }
    } catch (err) {
      console.log(err)
      return Response.json({data: "request failure"})
    }
}

export async function POST(req:Request) {
    const db = await getDatabase(app);
    const body = await req.json();
    const newKey = await push(child(ref(db), 'members')).key;
    try {
      const updates:any = {};
      updates['/members/' + newKey] = body;
      await update(ref(db), updates);
      return Response.json({ data: newKey });
    } catch (err) {
      console.log(err);
      return Response.json({ data: "request failure" });
    }
}