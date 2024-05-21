import mongoClient from "@/lib/mongo";

export async function GET() {
    const mongoDb = (await mongoClient).db("members");
    const members = await mongoDb.collection("dev").find({}).toArray();
    console.log("server hitted")
    
    return Response.json({data : members})
}

export async function POST(req:Request) {
    const body = await req.json()
    const mongoDb = (await mongoClient).db("members");
    const { acknowledged, insertedId } = await mongoDb.collection("dev").insertOne(body)
    if(acknowledged){
        return Response.json({data: insertedId})
    }
}