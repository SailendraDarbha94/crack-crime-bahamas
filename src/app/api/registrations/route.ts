import app from "@/lib/firebase";
import { child, get, getDatabase, ref, remove, set, update } from "firebase/database";


export async function GET() {
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
  const db = await getDatabase(app);
  const dataRef = ref(db, `/notifications_register/${data.Token}`);
  try {
    await set(dataRef, data);
    return Response.json({ data: "success" });
  } catch (err) {
    console.log(err);
    return Response.json({ data: "request failure" });
  }
}

export async function PUT(req: Request) {
  const data = await req.json();
  const db = await getDatabase(app);
  const dataRef = ref(db, `/notifications_register/${data.Token}`);

  try {
    await update(dataRef, data);
    return Response.json({ data: "success" });
  } catch (err) {
    console.log(err);
    return Response.json({ data: "request failure" });
  }
}

export async function DELETE(req: Request) {
  const data = await req.json();
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
