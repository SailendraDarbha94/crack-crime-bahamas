"use client";

import { StorageService } from "@/lib/firebaseService";
import { useEffect, useState } from "react";

export interface PublicPerson {
  id: string;
  name: string;
  age?: number | string;
  gender?: string;
  alias?: string;
  image?: string;
  description?: string;
  wanted_for?: string;
  last_known_address?: string;
}

// A single amber-glass card used on the public /wanted and /missing pages.
// Images are loaded through getDownloadURL (CDN-cached) rather than the
// admin blob approach, so they cache across page loads.
const PublicPersonCard = ({
  person,
  kind,
}: {
  person: PublicPerson;
  kind: "wanted" | "missing";
}) => {
  const [imgSrc, setImgSrc] = useState<string>("/newfavicon.png");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!person.image || person.image === "Image Not Available") return;
      try {
        const url = await StorageService.getDownloadURL(person.image);
        if (!cancelled) setImgSrc(url);
      } catch {
        // keep the fallback logo
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [person.image]);

  const accent = kind === "wanted" ? "text-red-700" : "text-amber-800";
  const label = kind === "wanted" ? "Wanted For" : "Description";
  const detail = kind === "wanted" ? person.wanted_for : person.description;

  return (
    <article className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(120,72,10,0.12)] flex flex-col">
      <div className="aspect-[4/3] w-full bg-white/20 flex items-center justify-center overflow-hidden">
        <img
          src={imgSrc}
          alt={`${kind === "wanted" ? "Wanted" : "Missing"} person: ${person.name}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgSrc("/newfavicon.png")}
        />
      </div>
      <div className="p-4 flex flex-col gap-1 text-amber-950">
        <h3 className="text-xl font-extrabold font-nunito">{person.name}</h3>
        <div className="text-sm text-amber-900/80 flex flex-wrap gap-x-3">
          {person.age ? <span>Age: {person.age}</span> : null}
          {person.gender ? <span>Gender: {person.gender}</span> : null}
          {person.alias ? <span>Alias: {person.alias}</span> : null}
        </div>
        {detail ? (
          <div className="mt-2">
            <h4 className={`font-semibold ${accent}`}>{label}:</h4>
            <p className="text-sm text-amber-900/90">{detail}</p>
          </div>
        ) : null}
        {person.last_known_address ? (
          <div className="mt-1">
            <h4 className="font-semibold text-amber-800">Last Known Address:</h4>
            <p className="text-sm text-amber-900/90">{person.last_known_address}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default PublicPersonCard;
