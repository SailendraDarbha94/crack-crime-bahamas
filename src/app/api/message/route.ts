import app from "@/lib/firebase";
import mongoClient from "@/lib/mongo";
import { child, get, getDatabase, push, ref, update } from "firebase/database";

export async function GET() {
    console.log("MESSAGE GET REQUEST RECEIVED : ==================================================")
    const db = await getDatabase(app);
    const dbRef = await ref(db);
    try {
      const data = await get(child(dbRef, 'messages'))
      if(data.exists()){
        const messages = await data.val()
        return Response.json({data : messages})
      }
    } catch (err) {
      console.log(err)
      return Response.json({data: "request failure"})
    }
}

export async function POST(req:Request) {
    console.log("MESSAGE POST REQUEST RECEIVED : ==================================================", req)
    const db = await getDatabase(app);
    const body = await req.json();
    body['created_at'] = Date.now();
    const newKey = await push(child(ref(db), 'messages')).key;
    try {
      const updates:any = {};
      updates['/messages/' + newKey] = body;
      await update(ref(db), updates);
      return Response.json({ data: newKey });
    } catch (err) {
      console.log(err);
      return Response.json({ data: "request failure" });
    }
}