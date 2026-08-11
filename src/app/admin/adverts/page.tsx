"use client";
import AdvertChanger from "./AdvertChanger";

const Page = () => {
  return (
    <div className="w-full font-nunito">
      <h1 className="text-2xl font-bold rounded-3xl border-2 border-black py-2 text-center">Manage Advertisements</h1>
      <p className="text-lg text-center">
        Supported formats: <span className="px-1 font-extrabold">JPEG, PNG or GIF</span> (max 5MB)
      </p>
      <div className="flex flex-wrap w-full justify-evenly">
        <AdvertChanger group="home" />
        <AdvertChanger group="emergency" />
        <AdvertChanger group="whoWeAre" />
        <AdvertChanger group="police" />
        <AdvertChanger group="supportAndSafety" />
        <AdvertChanger group="fullpageHome" />
        <AdvertChanger group="fullpageSecond" />
      </div>
    </div>
  );
};

export default Page;
