import app from "@/lib/firebase";
import { child, get, getDatabase, push, ref, remove, set, update } from "firebase/database";


export async function GET() {
  // const mongoDb = (await mongoClient).db("members");
  // const members = await mongoDb.collection("dev").find({}).toArray();
  // console.log("server hitted")

  // return Response.json({data : members})
  const db = await getDatabase(app);
  const dbRef = await ref(db);
  try {
    const data = await get(child(dbRef, 'notifications_register'))
    if (data.exists()) {
      const list = await data.val()
      return Response.json({ data: list })
    }
  } catch (err) {
    console.log(err)
    return Response.json({ data: "request failure" })
  }
}


export async function POST(req: Request) {
  const data = await req.json();
  console.log("this is the request data", data);
  const db = await getDatabase(app);
  const dataRef = ref(db, `/notifications_register/${data.Token}`);
  try {
    // const updates: any = {};
    // updates["/notifications_register/" + newKey] = { ...data };
    // await update(ref(db), updates);
    await set(dataRef, data);
    return Response.json({ data: "success" });
  } catch (err) {
    console.log(err);
    return Response.json({ data: "request failure" });
  }
}

export async function PUT(req: Request) {
  const data = await req.json();
  console.log("this is the update data", data);
  const db = await getDatabase(app);
  const dataRef = ref(db, `/notifications_register/${data.Token}`);

  try {
    // const updates: any = {};
    // updates["/notifications_register/" + newKey] = { ...data };
    // await update(ref(db), updates);
    await update(dataRef, data);
    return Response.json({ data: "success" });
  } catch (err) {
    console.log(err);
    return Response.json({ data: "request failure" });
  }
}

export async function DELETE(req: Request) {
  const data = await req.json();
  console.log("this is the request data", data);
  const db = await getDatabase(app);
  const dataRef = ref(db, `/notifications_register/${data}`);
  try {
    await remove(dataRef);
    return Response.json({ data: "data removed at resource"})
  } catch (err) {
    console.log(err)
    return Response.json({ data: "request failure" })
  }
}
