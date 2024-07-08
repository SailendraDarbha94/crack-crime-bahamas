import app from "@/lib/firebase";
import { child, get, getDatabase, push, ref, update } from "firebase/database";

export async function POST(req:Request) {
  console.log("WANTED POST REQUEST RECEIVED : ==================================================", req)
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
  console.log("WANTED GET REQUEST RECEIVED : ==================================================", req)
  // await dbConnect();
  // try {
  //   const wanteds = await Wanted.find({});
  //   return Response.json({ data: wanteds });
  // } catch (error) {
  //   return Response.json({ data: "request failure"})
  // }
  const db = await getDatabase(app);
  const dbRef = await ref(db);
  try {
    const data = await get(child(dbRef, 'wanteds'))
    if(data.exists()){
      const wanteds = await data.val()
      return Response.json({data : wanteds})
    }
  } catch (err) {
    console.log(err)
    return Response.json({data: "request failure"})
  }

}
