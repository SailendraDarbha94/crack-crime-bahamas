"use client";
import Link from "next/link";

type NavItem = { href: string; label: string };

// What each role can reach. The database rules enforce this; the sidebar only
// avoids showing links that would lead to a permission error.
const NAV: Record<"admin" | "police", NavItem[]> = {
  admin: [
    { href: "/admin", label: "Home" },
    { href: "/admin/messages", label: "Manage Messages" },
    { href: "/admin/missing", label: "Manage Missings" },
    { href: "/admin/wanted", label: "Manage Wanteds" },
    { href: "/admin/adverts", label: "Advertisements" },
    { href: "/admin/notifications", label: "Notifications" },
    { href: "/admin/team", label: "Police Team" },
    { href: "/admin/member", label: "Members" },
  ],
  police: [
    { href: "/police", label: "Home" },
    { href: "/police/missing", label: "Missing Persons" },
    { href: "/police/wanted", label: "Wanted Persons" },
  ],
};

const Sidebar = ({ variant = "admin" }: { variant?: "admin" | "police" }) => {
  return (
    <div className="w-full h-full flex flex-col mx-2 py-2 px-3 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(120,72,10,0.15)]">
      <a
        href="/"
        className="flex items-center justify-center bg-inherit my-2 text-center rounded-lg w-full font-nunito font-bold text-lg"
      >
        <img className="w-10 h-10 mr-2" src="/newfavicon.png" alt="logo" />
      </a>
      {variant === "police" ? (
        <p className="text-center font-nunito text-xs uppercase tracking-wide text-amber-900/70 mb-1">
          Police portal
        </p>
      ) : null}
      {NAV[variant].map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="bg-white/30 backdrop-blur-md border border-white/50 text-amber-950 hover:bg-white/45 hover:border-white/70 shadow-sm transition-all duration-200 active:scale-[0.98] px-2 my-2 text-center py-2 w-full font-nunito font-bold text-lg rounded-3xl"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;
