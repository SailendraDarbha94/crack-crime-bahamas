"use client";
import app from "@/lib/firebase";
import {
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signOut,
  updatePassword,
  type User,
} from "firebase/auth";
import { useToast } from "@/lib/toastContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const MIN_PASSWORD = 8;

const inputClass =
  "w-full rounded-xl bg-white/40 backdrop-blur-md border border-white/60 px-4 py-2.5 text-amber-950 placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60";
const buttonClass =
  "bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

// Account page shared by admins and officers: who you are signed in as,
// changing your password, a reset email, and signing out. Officers arrive
// with a temporary password from an admin, so changing it here matters.
const AccountProfile = ({ title }: { title: string }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(app), (u) => {
      if (u) setUser(u);
      else router.push("/login");
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await signOut(getAuth(app));
    router.push("/");
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(getAuth(app), user.email);
      toast({ message: `Password reset email sent to ${user.email}`, type: "success" });
    } catch (err) {
      console.error(err);
      toast({ message: "Could not send reset email. Please try again.", type: "error" });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (next.length < MIN_PASSWORD) {
      toast({ message: `New password must be at least ${MIN_PASSWORD} characters`, type: "warning" });
      return;
    }
    if (next !== confirm) {
      toast({ message: "The new passwords do not match", type: "warning" });
      return;
    }
    setSaving(true);
    try {
      // Firebase requires a recent sign-in to change a password, so confirm
      // the current one first — it also stops someone at an unlocked screen.
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
      await updatePassword(user, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast({ message: "Password changed", type: "success" });
    } catch (err: any) {
      const code = String(err?.code ?? "");
      const message =
        code.includes("wrong-password") || code.includes("invalid-credential")
          ? "Your current password is incorrect"
          : code.includes("weak-password")
          ? "That password is too weak"
          : code.includes("too-many-requests")
          ? "Too many attempts. Please wait a few minutes and try again."
          : "Could not change your password. Please try again.";
      toast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen font-nunito p-4 md:p-14">
      <h1 className="font-bold text-4xl md:text-5xl text-center text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)] mb-8">
        {title}
      </h1>
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <div className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_32px_rgba(120,72,10,0.12)]">
          <p className="text-amber-900/80 mb-1">Signed in as</p>
          <p className="text-xl font-bold text-amber-950 break-words">
            {user ? user.email : "Loading…"}
          </p>
        </div>

        <form
          onSubmit={handleChangePassword}
          className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_32px_rgba(120,72,10,0.12)] flex flex-col gap-3"
        >
          <h2 className="text-xl font-bold text-amber-950">Change password</h2>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputClass}
            required
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder={`New password (at least ${MIN_PASSWORD} characters)`}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputClass}
            required
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
            required
          />
          <button type="submit" disabled={saving || !user} className={buttonClass}>
            {saving ? "Saving…" : "Change password"}
          </button>
        </form>

        <div className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_32px_rgba(120,72,10,0.12)] flex flex-col gap-3">
          <button onClick={handlePasswordReset} className={buttonClass}>
            Send Password Reset Email
          </button>
          <button
            onClick={handleSignOut}
            className="bg-red-500/85 backdrop-blur-md border border-red-300/50 text-white hover:bg-red-600/90 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountProfile;
