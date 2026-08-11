"use client";

const Sidebar = () => {
  return (
    <div className="w-full h-full flex flex-col mx-2 py-2 px-3 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(120,72,10,0.15)]">
      <a
        href="/"
        className="flex items-center justify-center bg-inherit my-2 text-center rounded-lg w-full font-nunito font-bold text-lg"
      >
        <img className="w-10 h-10 mr-2" src="/newfavicon.png" alt="logo" />
      </a>
      
      <a
        href="/admin"
        className="bg-white/30 backdrop-blur-md border border-white/50 text-amber-950 hover:bg-white/45 hover:border-white/70 shadow-sm transition-all duration-200 active:scale-[0.98] my-2 text-center py-2 w-full font-nunito font-bold text-lg mt-2 rounded-3xl"
      >
        Home
      </a>
      <a
        href="/admin/messages"
        className="bg-white/30 backdrop-blur-md border border-white/50 text-amber-950 hover:bg-white/45 hover:border-white/70 shadow-sm transition-all duration-200 active:scale-[0.98] px-2 my-2 text-center py-2 w-full font-nunito font-bold text-lg mt-2 rounded-3xl"
      >
        Manage Messages
      </a>
      <a
        href="/admin/missing"
        className="bg-white/30 backdrop-blur-md border border-white/50 text-amber-950 hover:bg-white/45 hover:border-white/70 shadow-sm transition-all duration-200 active:scale-[0.98] px-2 my-2 mt-2 text-center py-2 rounded-3xl w-full font-nunito font-bold text-lg"
      >
        Manage Missings
      </a>
      <a
        href="/admin/wanted"
        className="bg-white/30 backdrop-blur-md border border-white/50 text-amber-950 hover:bg-white/45 hover:border-white/70 shadow-sm transition-all duration-200 active:scale-[0.98] px-2 my-2 mt-2 text-center py-2 rounded-3xl w-full font-nunito font-bold text-lg"
      >
        Manage Wanteds
      </a>
      <a
        href="/admin/adverts"
        className="bg-white/30 backdrop-blur-md border border-white/50 text-amber-950 hover:bg-white/45 hover:border-white/70 shadow-sm transition-all duration-200 active:scale-[0.98] px-2 my-2 mt-2 text-center py-2 rounded-3xl w-full font-nunito font-bold text-lg"
      >
        Advertisements
      </a>
      <a
        href="/admin/notifications"
        className="bg-white/30 backdrop-blur-md border border-white/50 text-amber-950 hover:bg-white/45 hover:border-white/70 shadow-sm transition-all duration-200 active:scale-[0.98] px-2 my-2 mt-2 text-center py-2 rounded-3xl w-full font-nunito font-bold text-lg"
      >
        Notifications
      </a>
      <a
        href="#"
        className="bg-white/30 backdrop-blur-md border border-white/50 text-amber-950 hover:bg-white/45 hover:border-white/70 shadow-sm transition-all duration-200 active:scale-[0.98] px-2 my-2 mt-2 text-center py-2 rounded-3xl w-full font-nunito font-bold text-lg"
      >
        Annual Contributors
      </a>
    </div>
  );
};

export default Sidebar;
