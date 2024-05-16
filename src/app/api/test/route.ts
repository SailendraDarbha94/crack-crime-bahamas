import mongoClient from "@/lib/mongo";

export async function GET() {
    const mongoDb = (await mongoClient).db("test_view");
    const sampleData = await mongoDb.collection("sample_collection").find({}).toArray();
    console.log("server hitted")
    return Response.json({data : sampleData})
}