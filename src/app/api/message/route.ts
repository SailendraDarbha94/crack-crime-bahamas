import app from "@/lib/firebase";
import mongoClient from "@/lib/mongo";
import { child, get, getDatabase, push, ref, update } from "firebase/database";

export async function GET() {
    // const mongoDb = (await mongoClient).db("messages");
    // const data = await mongoDb.collection("dev").find({}).toArray();
    // if(data) {
    //     return Response.json({data : data})
    // } else {
    //     return Response.json({data : "request failed"})
    // }
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
    // const body = await req.json()
    // const mongoDb = (await mongoClient).db("messages");
    // const { acknowledged, insertedId } = await mongoDb.collection("dev").insertOne(body)
    // if(acknowledged){
    //     return Response.json({data: insertedId})
    // }
    const db = await getDatabase(app);
    const body = await req.json();
    const newKey = await push(child(ref(db), 'members')).key;
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