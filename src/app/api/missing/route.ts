import dbConnect from "@/lib/dbConnect";
import app from "@/lib/firebase";
import mongoClient from "@/lib/mongo";
import Missing from "@/models/Missing";
import { getDatabase, ref, child, get, set, push, update } from "firebase/database";

export async function POST(req: Request) {
  // const body = await req.json()
  // console.log(body);
  // await dbConnect();
  // const missingPerson = await Missing.create(body);
  // if(missingPerson){
  //   return Response.json({ data: missingPerson });
  // } else {
  //   return Response.json({ data: "request failure"})
  // }

  // old method above and new method below

  // console.log("MESSAGE POST REQUEST RECEIVED : ==================================================", req)
  // const body = await req.json()
  // const mongoDb = (await mongoClient).db("test");
  // const { acknowledged, insertedId } = await mongoDb.collection("missings").insertOne(body)
  // if(acknowledged){
  //     return Response.json({data: insertedId})
  // } else {
  //   return Response.json({data: "request failed"})
  // }

  const db = await getDatabase(app);
  const body = await req.json();
  const newKey = await push(child(ref(db), 'missings')).key;
  try {
    const updates:any = {};
    updates['/missings/' + newKey] = body;
    //set(ref(db, "missings/"), body);
    await update(ref(db), updates);
    return Response.json({ data: newKey });
  } catch (err) {
    console.log(err);
    return Response.json({ data: "request failure" });
  }
}

export async function GET(req: Request) {
  // await dbConnect();
  // try {
  //   const missings = await Missing.find({});
  //   return Response.json({ data: missings });
  // } catch (error) {
  //   return Response.json({ data: "request failure"})
  // }
  // const mongoDb = (await mongoClient).db("test");
  // const data = await mongoDb.collection("missings").find({}).toArray();
  // if (data) {
  //   return Response.json({ data: data });
  // } else {
  //   return Response.json({ data: "request failed" });
  // }
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

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse,
// ) {
//   const { method } = req;

//   await dbConnect();

//   switch (method) {
//     case "GET":
//       try {
//         const missings = await Missing.find({}); /* find all the data in our database */
//         res.status(200).json({ success: true, data: missings });
//       } catch (error) {
//         res.status(400).json({ success: false });
//       }
//       break;
//     case "POST":
//       try {
//         const missingPerson = await Missing.create(
//           req.body,
//         ); /* create a new model in the database */
//         //await missingPerson.save()
//         res.status(201).json({ success: true, data: missingPerson });
//       } catch (error) {
//         res.status(400).json({ success: false });
//       }
//       break;
//     default:
//       res.status(400).json({ success: false });
//       break;
//   }
// }
