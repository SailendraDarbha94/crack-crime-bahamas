import { MongoClient } from "mongodb"

const uri:string = process.env.NEXT_PUBLIC_MONGODB_URI!
const options:any = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}

const client = new MongoClient(uri, options)
const mongoClient = client.connect()

export default mongoClient