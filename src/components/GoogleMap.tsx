"use client"
import { Coordinates } from "@/constants/interfaces";
import { Loader } from "@googlemaps/js-api-loader";
import { Button, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";

const GoogleMap = ({ onAddressSelect }: { onAddressSelect:Function }) => {
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

  let marker: any = null;
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
      const autoComplete = new google.maps.places.Autocomplete(
        searchRef.current as HTMLInputElement,
        {
          types: ["geocode"],
          componentRestrictions: { country: "in" },
        }
      );
      const mapOptions = {
        zoom: 14,
        mapId: "c0182cb60ad4699b",
        draggable: true,
      };
      // const position = {
      //   lat: 12.9716,
      //   lng: 77.5946,
      // };
      marker = new google.maps.Marker({
        position: coords,
        draggable: true,
      });
      const map = new Map(mapRef.current as HTMLDivElement, mapOptions);
      marker.setMap(map);
      map.setCenter(marker.getPosition()!);
      autoComplete.addListener("place_changed", async function () {
        const plcs = await autoComplete.getPlace();
        const fullAddress = await plcs.formatted_address;
        const latitude = await plcs.geometry?.location?.lat();
        const longitude = await plcs.geometry?.location?.lng();
        setCoords({
          lat: latitude as number,
          lng: longitude as number,
        });
        setAddress(fullAddress as string);
        marker.setPosition({
          lat: latitude,
          lng: longitude,
        });
        map.setCenter(marker.getPosition()!);
      });

      const geocoder = new google.maps.Geocoder();

      //marker.setPosition(map.getCenter())

      google.maps.event.addListener(marker, "dragend", async function () {
        const geo = await geocoder.geocode({
          location: marker.getPosition(),
        });
        const latlngposition = await marker.getPosition()!;

        map.setCenter(latlngposition);
        console.log(geo, marker);
        const latitude = await latlngposition.lat();
        const longitude = await latlngposition.lng();
        // console.log(
        //   geo.results.length > 0
        //     ? geo.results[0].formatted_address
        //     : "No Results"
        // );
        if (geo.results.length > 0) {
          setAddress(geo.results[0].formatted_address);
          setCoords({
            lat: latitude,
            lng: longitude,
          });
        }
        //setMapPosition()
      });
      google.maps.event.addListener(map, "dragend", async function () {
        marker.setPosition(map.getCenter());
      });
    };

    initMap();
  }, []);

  return (
    <div className="flex w-full mx-auto flex-wrap rounded-lg shadow-lg shadow-slate-300 p-4">
      <div className="w-full flex justify-between items-center mb-3">
        <Input
          //isRequired
          ref={searchRef}
          type="text"
          label=""
          // onChange={(e) => setSearchInput(e.target.value)}
          defaultValue=""
          className="w-8/12"
        />
        <Button
          color="warning"
          onClick={() => {
            console.log("coordinates : ", coords);
            console.log("addresss : ", address);
            onAddressSelect(address)
          }}
          variant="flat"
          className="w-3/12 h-full hover:bg-black hover:text-white"
        >
          Fill Address
        </Button>
      </div>
      <div className="w-full">
        <div
          id=""
          className="min-h-80 min-w-80 mx-auto rounded-xl"
          ref={mapRef}
        />
      </div>
    </div>
  );
};

export default GoogleMap;
