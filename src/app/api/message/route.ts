import mongoClient from "@/lib/mongo";

export async function GET() {
    const mongoDb = (await mongoClient).db("messages");
    const data = await mongoDb.collection("dev").find({}).toArray();
    //console.log("server hitted")
    return Response.json({data : data})
}

export async function POST(req:Request) {
    console.log("MESSAGE POST REQUEST RECEIVED : ==================================================", req)
    const body = await req.json()
    const mongoDb = (await mongoClient).db("messages");
    const { acknowledged, insertedId } = await mongoDb.collection("dev").insertOne(body)
    if(acknowledged){
        return Response.json({data: insertedId})
    }
}