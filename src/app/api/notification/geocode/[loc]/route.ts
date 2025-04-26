import app from "@/lib/firebase";
import { Expo } from "expo-server-sdk";
import { child, get, getDatabase, ref } from "firebase/database";





export async function POST(req: Request, params:any) {

    //console.log("shall we", params?.params.loc);
    const { data } = await req.json();

    //console.log("checkingggg",data, params.params.loc);
    try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${25.0806704},${-77.4311452}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,{
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        })
        console.log("should be geocode result",res);
      } catch (err) {
        console.log(err)
      }
    
    return Response.json({ data: "success" });
}