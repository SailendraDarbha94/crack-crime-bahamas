"use client";
import AdvertChanger from "./AdvertChanger";

// The 12 banner slots the mobile app reads from Firebase Storage
// (adverts/<group>/advertisement.png). Order/labels mirror the storage
// contract; changing a `group` key would break the app's fixed paths.
const LANDSCAPE_SLOTS: { group: string; label: string; where: string }[] = [
  { group: "home", label: "Home", where: "Text a Tip, Crime Stoppers caller" },
  { group: "whoWeAre", label: "Who We Are", where: "About Us, Mission & Vision" },
  { group: "supportAndSafety", label: "Support & Safety", where: "Support Us, donation forms" },
  { group: "missing", label: "Missing", where: "Missing list screen" },
  { group: "wanted", label: "Wanted", where: "Wanted list screen" },
  { group: "events", label: "Events", where: "Events screen" },
  { group: "howitworks", label: "How It Works", where: "How It Works screen" },
  { group: "safety", label: "Safety", where: "Safety Tips screen" },
  { group: "emergency", label: "Emergency", where: "Hotline / Ambulance sub-screens" },
  { group: "police", label: "Police", where: "Police station sub-screens" },
];

const PORTRAIT_SLOTS: { group: string; label: string; where: string }[] = [
  { group: "fullpageHome", label: "Full-page (Home)", where: "Full-screen interstitial, home flows" },
  { group: "fullpageSecond", label: "Full-page (Who We Are)", where: "Full-screen interstitial, Who We Are flows" },
];

const Page = () => {
  return (
    <div className="w-full font-nunito p-2 md:p-4">
      <h1 className="text-2xl font-bold rounded-3xl border border-white/50 bg-white/25 backdrop-blur-sm py-2 text-center text-amber-950">
        Manage Advertisements
      </h1>
      <p className="text-lg text-center text-amber-900/80 mt-2">
        Supported formats: <span className="px-1 font-extrabold text-amber-950">JPEG, PNG or GIF</span> (max 5MB).
        Images are downscaled to 1600px on upload; the previous banner is kept as a timestamped backup.
      </p>

      <h2 className="text-xl font-bold text-amber-950 mt-8 mb-2 px-2">
        Screen banners <span className="font-normal text-amber-900/70 text-base">— landscape 3:2 (≈1536×1024), dark-edged art works best</span>
      </h2>
      <div className="flex flex-wrap w-full justify-evenly">
        {LANDSCAPE_SLOTS.map((slot) => (
          <AdvertChanger key={slot.group} group={slot.group} label={slot.label} where={slot.where} aspect="3:2" />
        ))}
      </div>

      <h2 className="text-xl font-bold text-amber-950 mt-8 mb-2 px-2">
        Full-screen interstitials <span className="font-normal text-amber-900/70 text-base">— portrait ~9:16 (≈1080×1870)</span>
      </h2>
      <div className="flex flex-wrap w-full justify-evenly">
        {PORTRAIT_SLOTS.map((slot) => (
          <AdvertChanger key={slot.group} group={slot.group} label={slot.label} where={slot.where} aspect="9:16" />
        ))}
      </div>
    </div>
  );
};

export default Page;
