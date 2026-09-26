"use client";
import app, { database } from "@/lib/firebase";
import { getRole, HOME_FOR_ROLE, type Role } from "@/lib/roles";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Client-side role gate. The real security boundary is the database rules
// (allowlists at /admins/{uid} and /police/{uid}); this is the UX layer — it
// redirects logged-out visitors to /login, sends a signed-in user with the
// wrong role to their own section, and shows a clear state to accounts with
// no role yet. Renders children only once the role is confirmed.
//
// It FAILS CLOSED: if the role cannot be read, nothing is shown. (It used to
// fall back to "admin" while the rules were being rolled out; with non-admin
// accounts in the system that fallback would hand them the admin UI.)
//
// Once access is granted it keeps watching the allowlist entry that granted
// it, so revoking someone hides an already-open page within seconds instead of
// at their next reload. The rules deny their reads immediately either way.
export default function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<"checking" | "allowed" | "pending" | "error">("checking");
  const [attempt, setAttempt] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    let stopWatching: (() => void) | null = null;
    let cancelled = false;

    const evaluate = async (uid: string) => {
      stopWatching?.();
      stopWatching = null;
      setStatus("checking");
      try {
        const role = await getRole(uid);
        if (cancelled) return;
        if (allow.includes(role)) {
          setStatus("allowed");
          const list = role === "admin" ? "admins" : "police";
          stopWatching = onValue(
            ref(database, `${list}/${uid}`),
            // Fires once straight away with `true`; anything else means the
            // grant changed, so decide again from scratch.
            (snap) => {
              if (snap.val() !== true) evaluate(uid);
            },
            (err) => {
              console.error("Lost the access check:", err);
              setStatus("error");
            }
          );
        } else if (role === "none") {
          setStatus("pending");
        } else {
          router.replace(HOME_FOR_ROLE[role]);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Could not verify access:", err);
        setStatus("error");
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        stopWatching?.();
        stopWatching = null;
        router.push("/login");
        return;
      }
      evaluate(user.uid);
    });
    return () => {
      cancelled = true;
      unsubscribe();
      stopWatching?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const handleSignOut = async () => {
    await signOut(getAuth(app));
    router.push("/");
  };

  const Panel = ({ title, body, retry }: { title: string; body: string; retry?: boolean }) => (
    <main className="flex w-full min-h-[60vh] items-center justify-center p-4">
      <div className="rounded-3xl border border-white/50 bg-white/25 backdrop-blur-md px-8 py-6 shadow-sm text-center font-nunito max-w-md">
        <h1 className="text-2xl font-bold text-amber-950 mb-2">{title}</h1>
        <p className="text-amber-900/80 mb-4">{body}</p>
        <div className="flex gap-3 justify-center">
          {retry ? (
            <button
              onClick={() => setAttempt((n) => n + 1)}
              className="bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-2 rounded-xl transition-all duration-200 active:scale-95"
            >
              Try again
            </button>
          ) : null}
          <button
            onClick={handleSignOut}
            className="bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-2 rounded-xl transition-all duration-200 active:scale-95"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );

  if (status === "checking") {
    return (
      <main className="flex w-full min-h-[60vh] items-center justify-center">
        <div className="rounded-3xl border border-white/50 bg-white/25 backdrop-blur-md px-8 py-6 shadow-sm text-center font-nunito">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-800 mx-auto mb-3"></div>
          <p className="text-amber-950 font-bold">Checking your access…</p>
        </div>
      </main>
    );
  }

  if (status === "pending") {
    return (
      <Panel
        title="Account awaiting approval"
        body="Your account exists but has not been given access yet. Please contact an administrator."
      />
    );
  }

  if (status === "error") {
    return (
      <Panel
        title="Couldn't verify your access"
        body="We could not confirm your account's access, so nothing has been shown. Check your connection and try again."
        retry
      />
    );
  }

  return <>{children}</>;
}
