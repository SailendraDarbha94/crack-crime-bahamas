"use client";
import { Coordinates } from "@/constants/interfaces";
import { supabase } from "@/lib/supabase";
import { Loader } from "@googlemaps/js-api-loader";
import { Button, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";

const ClinicsMapper = () => {
  const [coords, setCoords] = useState<Coordinates>({
    lat: 12.9716,
    lng: 77.5946,
  });
  const [address, setAddress] = useState<string>(
    "67/1, KG Halli, D' Souza Layout, Ashok Nagar, Bengaluru, Karnataka 560002, India"
  );
  const mapRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  //const [searchInput, setSearchInput] = useState<string>("");

  const [locations, setLocations] = useState<any[]>();
  // async function placeLocations() {
  //   locations?.map()
  // }
  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: "weekly",
      });
      const { Map } = await loader.importLibrary("maps");
      const { Geocoder } = await loader.importLibrary("geocoding");
      const { Marker } = (await loader.importLibrary(
        "marker"
      )) as google.maps.MarkerLibrary;
      const { Place, Autocomplete } = (await loader.importLibrary(
        "places"
      )) as google.maps.PlacesLibrary;
      const mapOptions = {
        zoom: 13,
        mapId: "c0182cb60ad4699b",
        draggable: true,
      };
      const { data, error } = await supabase
        .from("clinics")
        .select("coordinates");
      if (data) {
        setLocations(data);
        console.log(data);
        data.map((location) => {
          //const marker:any = new google.maps.Marker({position: location.coordinates, map:map})
        });
      }
      const map = new Map(mapRef.current as HTMLDivElement, mapOptions);
      let marker = new google.maps.Marker({
        position: {
          lat: 12.814093182211606,
          lng: 77.58171017196652,
        },
        map: map,
      });
      marker = new google.maps.Marker({
        position: {
          lat: 12.87606191142509,
          lng: 77.59545471979065
        },
        map: map,
      });
      marker = new google.maps.Marker({
        position: {
          lat: 12.8288,
          lng: 77.5878
        },
        map: map,
      });
      marker = new google.maps.Marker({
        position: {
          lat: 12.8564,
          lng: 77.5888
        },
        map: map,
      });
      marker = new google.maps.Marker({
        position: {
          lat: 12.8432,
          lng: 77.5765
        },
        map: map,
      });
      marker = new google.maps.Marker({
        position: {
          lat: 12.3177,
          lng: 77.6375
        },
        map: map,
      });
      map.setCenter({
        lat: 12.8288,
        lng: 77.5878
      });
    };

    //getLocations()
    initMap();
  }, []);

  return (
    <div className="flex w-full mx-auto flex-wrap rounded-lg shadow-lg shadow-slate-300 p-4">
      <div className="w-full flex justify-between items-center mb-3">
        {/* <Input
          //isRequired
          ref={searchRef}
          type="text"
          label=""
          // onChange={(e) => setSearchInput(e.target.value)}
          defaultValue=""
          className="w-8/12"
        /> */}
        {/* <Button
          color="warning"
          onClick={() => {
            console.log("coordinates : ", coords);
            console.log("addresss : ", address);
            onAddressSelect({
              address: address,
              coords: coords
            })
          }}
          variant="flat"
          className="w-3/12 h-full hover:bg-black hover:text-white"
        >
          Fill Address
        </Button> */}
      </div>
      <div className="w-full h-screen">
        <div
          id=""
          className="h-[70%] border-2 border-black min-w-80 mx-auto rounded-xl"
          ref={mapRef}
        />
      </div>
    </div>
  );
};

export default ClinicsMapper;
