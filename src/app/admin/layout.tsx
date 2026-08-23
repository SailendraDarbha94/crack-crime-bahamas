"use client";
import Sidebar from "@/components/Sidebar";
import app, { database } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Client-side guard for the /admin tree. The real security boundary is the
// database/storage rules (admin allowlist at /admins/{uid}); this guard is
// the UX layer: it redirects logged-out visitors and shows a clear state to
// signed-in users who are not (yet) allowlisted.
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [status, setStatus] = useState<"checking" | "admin" | "pending">("checking");
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        // /admins/{uid} is self-readable under the database rules
        const snap = await get(ref(database, `admins/${user.uid}`));
        setStatus(snap.val() === true ? "admin" : "pending");
      } catch {
        // Rules not deployed yet (or offline): fall back to auth-only.
        // Once the allowlist rules are live this branch stops mattering.
        setStatus("admin");
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await signOut(getAuth(app));
    router.push("/");
  };

  if (status === "checking") {
    return (
      <main className="flex w-full min-h-[60vh] items-center justify-center">
        <div className="rounded-3xl border border-white/50 bg-white/25 backdrop-blur-md px-8 py-6 shadow-sm text-center font-nunito">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-800 mx-auto mb-3"></div>
          <p className="text-amber-950 font-bold">Checking admin access…</p>
        </div>
      </main>
    );
  }

  if (status === "pending") {
    return (
      <main className="flex w-full min-h-[60vh] items-center justify-center p-4">
        <div className="rounded-3xl border border-white/50 bg-white/25 backdrop-blur-md px-8 py-6 shadow-sm text-center font-nunito max-w-md">
          <h1 className="text-2xl font-bold text-amber-950 mb-2">Account awaiting approval</h1>
          <p className="text-amber-900/80 mb-4">
            Your account was created but has not been approved as an admin yet.
            Please contact an existing administrator.
          </p>
          <button
            onClick={handleSignOut}
            className="bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-2 rounded-xl transition-all duration-200 active:scale-95"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex w-full flex-wrap">
      <div className="hidden md:block p-2 md:w-3/12 lg:w-3/12 xl:w-2/12">
        <Sidebar />
      </div>
      <div className="w-full md:w-9/12 lg:w-9/12 xl:w-10/12">
        <div>
          {children}
        </div>
      </div>
    </main>
  );
}
