import dbConnect from "@/lib/dbConnect";
import Wanted from "@/models/Wanted";


import { NextApiRequest, NextApiResponse } from "next";

export async function POST(req:Request) {
  const body = await req.json()
  console.log(body);
  await dbConnect();
  const wantedPerson = await Wanted.create(body);
  if(wantedPerson){
    return Response.json({ data: wantedPerson });
  } else {
    return Response.json({ data: "request failure"})
  }
}

export async function GET(req:Request) {
  await dbConnect();
  try {
    const wanteds = await Wanted.find({});
    return Response.json({ data: wanteds });
  } catch (error) {
    return Response.json({ data: "request failure"})
  }
}
