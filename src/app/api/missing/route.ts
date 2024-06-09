import dbConnect from "@/lib/dbConnect";
import Missing from "@/models/Missing";

import { NextApiRequest, NextApiResponse } from "next";

export async function POST(req:Request) {
  const body = await req.json()
  console.log(body);
  await dbConnect();
  const missingPerson = await Missing.create(body);
  if(missingPerson){
    return Response.json({ data: missingPerson });
  } else {
    return Response.json({ data: "request failure"})
  }
}

export async function GET(req:Request) {
  await dbConnect();
  try {
    const missings = await Missing.find({});
    return Response.json({ data: missings });
  } catch (error) {
    return Response.json({ data: "request failure"})
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