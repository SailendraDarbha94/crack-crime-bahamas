import { db } from "@/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  console.log("entering POST request");
  console.log(body);

  const res = await db.jobPosting.create({
    data: {
      title: body.title,
      timings: body.timings,
      salary: body.salary,
      location: body.location,
      type: body.type,
      qualification: body.qualification,
    },
  });

  if (!res) {
    return new Response("Error creating job", { status: 500 });
  }

  return new NextResponse("Db operation successful");
};
