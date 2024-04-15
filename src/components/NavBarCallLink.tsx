"use client"
import { Divider } from "@nextui-org/react"

interface NavBarLinkProps {
    title: string;
    number: string;
}

const NavBarCallLink = (Props:NavBarLinkProps) => {
    return (
        <div className="min-h-14 bg-blue-900 text-white rounded-xl flex justify-around items-center max-w-md min-w-80 mx-auto mt-4 ">
          <div className="w-1/5 flex justify-center">
          <svg
          xmlns="http://www.w3.org/2000/svg"
          width="2em"
          height="4em"
          viewBox="0 0 24 24"
        >
          <path
            fill="#58EA26"
            fill-rule="evenodd"
            d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75z"
            clip-rule="evenodd"
          />
        </svg>
          </div>
        <div className="w-4/5">
          <h1 className="text-xl font-bold">{Props.title}</h1>
          <Divider />
          <h1 className="text-2xl font-semibold">{Props.number}</h1>
        </div>
      </div>
    )
}

export default NavBarCallLink