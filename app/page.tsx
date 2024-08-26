import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";
import { button as buttonStyles } from "@nextui-org/theme";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { subtitle, title } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block text-center justify-center">
        <h1 className={`text-5xl font-extrabold w-full`}>
          Crack Crime Bahamas
        </h1>
        <h2 className={subtitle()}>
          The worst amongst us have no chance of perpetrating any crimes if the
          rest of us come together
        </h2>
      </div>
      <div className="max-w-md w-full h-full min-h-60 relative">
        <Image
          fill
          alt="Banner"
          className="rounded-xl"
          src={"/images/landingPageTop.jpg"}
        />
      </div>
      <div className="flex gap-3">
        <Link
          isExternal
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "solid",
          })}
          href={siteConfig.links.docs}
        >
          Download App
        </Link>
        <Link
          isExternal
          className={buttonStyles({
            variant: "faded",
            radius: "full",
            color: "primary",
          })}
          href={siteConfig.links.github}
        >
          {/* <GithubIcon size={20} /> */}
          Join Us
        </Link>
      </div>
    </section>
  );
}
