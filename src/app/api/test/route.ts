import mongoClient from "@/lib/mongo";

export async function GET() {
    const mongoDb = (await mongoClient).db("test_view");
    const sampleData = await mongoDb.collection("sample_collection").find({}).toArray();
    console.log("server hitted")
    return Response.json({data : sampleData})
}

export async function POST(req:Request) {
    const body = await req.json()
    const mongoDb = (await mongoClient).db("test_view");
    const { acknowledged, insertedId } = await mongoDb.collection("sample_collection").insertOne(body)
    return Response.json({data: insertedId})
}