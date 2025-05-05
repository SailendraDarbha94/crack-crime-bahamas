


export async function POST(req: Request, params:any) {
    let address = 'No Address Found';
    //console.log("shall we", params?.params.loc);
    const { data } = await req.json();
    console.log(data?.latitude, data?.longitude);
    //console.log("checkingggg",data, params.params.loc);
    try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${data?.latitude},${data?.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,{
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        })
        const geocodeData = await res.json();
        console.log("should be geocode result",geocodeData?.results[0]?.formatted_address);
        address = geocodeData?.results[0]?.formatted_address as string
      } catch (err) {
        console.log(err)
      }
    
    return Response.json({ data: address });
}