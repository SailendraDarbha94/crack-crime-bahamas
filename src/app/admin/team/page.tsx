"use client";
import CardBoundary from "@/components/CardBoundary";
import app, { connectAuthEmulatorIfConfigured, database, firebaseConfig } from "@/lib/firebase";
import { ownEntry } from "@/lib/ownData";
import { textOf, timeOf } from "@/lib/safeRecord";
import { readAsStaff } from "@/lib/staffRead";
import { dateReader } from "@/lib/utils";
import { useToast } from "@/lib/toastContext";
import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { getDatabase, ref, remove, set } from "firebase/database";
import React, { useEffect, useMemo, useState } from "react";

type Officer = {
  /** The account's uid: always its key under /police, never anything a profile says. */
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  /** When the profile was saved, in milliseconds; 0 when it does not say. */
  created_at: number;
  /**
   * What is known of the account's profile under /users. "read": it is shown.
   * "none": the account has none. "unreadable": something is stored but it is
   * not a profile. "notLoaded": the profiles could not be read at all.
   */
  profile: "read" | "none" | "unreadable" | "notLoaded";
};

// A profile is written by the account itself, so nothing in it is trusted:
// each field is text of a sensible length or the profile is not shown. The
// limits are looser than the database rules', for profiles saved before them.
const MAX_NAME = 200;
const MAX_EMAIL = 320;
/** The longest first or last name the database rules accept in a new profile. */
const NAME_LIMIT = 100;
/** The furthest date a browser can show. */
const LATEST_DATE = 8.64e15;

/** The fields of a stored profile, or null when what is stored is not a profile. */
function readProfile(stored: unknown): Pick<Officer, "firstName" | "lastName" | "email" | "created_at"> | null {
  if (stored === null || typeof stored !== "object" || Array.isArray(stored)) return null;
  const fields = stored as Record<string, unknown>;
  const limits = [["firstName", MAX_NAME], ["lastName", MAX_NAME], ["email", MAX_EMAIL]] as const;
  for (const [name, limit] of limits) {
    const value = fields[name];
    if (value !== undefined && (typeof value !== "string" || value.length > limit)) return null;
  }
  const savedAt = timeOf(fields.created_at);
  return {
    firstName: textOf(fields.firstName),
    lastName: textOf(fields.lastName),
    email: textOf(fields.email),
    created_at: Math.abs(savedAt) <= LATEST_DATE ? savedAt : 0,
  };
}

/**
 * One row per account with police access. `profiles` is /users as last read,
 * or null when it never has been. A profile that cannot be read costs that
 * officer's name, never the row: access must stay removable whatever an
 * account has written about itself.
 */
function buildOfficers(uids: string[], profiles: Record<string, unknown> | null): Officer[] {
  const list: Officer[] = uids.map((uid) => {
    const unnamed = { uid, firstName: "", lastName: "", email: "", created_at: 0 };
    if (profiles === null) return { ...unnamed, profile: "notLoaded" };
    try {
      // By key, and only a key /users really has: a uid such as "constructor"
      // must not find what every object inherits.
      const stored = ownEntry(profiles, uid);
      if (stored === undefined || stored === null) return { ...unnamed, profile: "none" };
      const fields = readProfile(stored);
      // The uid is set last and from the key, so a profile cannot supply its own.
      return fields ? { ...fields, uid, profile: "read" } : { ...unnamed, profile: "unreadable" };
    } catch (err) {
      console.error("An officer's profile could not be read:", err);
      return { ...unnamed, profile: "unreadable" };
    }
  });
  list.sort((a, b) => (a.lastName || a.email || a.uid).localeCompare(b.lastName || b.email || b.uid));
  return list;
}

// Unambiguous characters only, so a password read aloud or copied from a
// screen survives the trip.
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const MIN_PASSWORD = 8;

function generatePassword(length = 14): string {
  const out: string[] = [];
  const limit = 256 - (256 % PASSWORD_ALPHABET.length); // reject to avoid modulo bias
  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const b of bytes) {
      if (b < limit && out.length < length) out.push(PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length]);
    }
  }
  return out.join("");
}

const inputClass =
  "w-full rounded-xl bg-white/40 backdrop-blur-md border border-white/60 px-4 py-2.5 text-amber-950 placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60";
const buttonClass =
  "bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-4 py-2 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

const rowClass =
  "flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/35 border border-white/60 rounded-2xl px-4 py-3";
const removeButtonClass =
  "bg-red-700 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50";

/**
 * One officer. A component of its own so that anything thrown while drawing
 * it is caught by the CardBoundary around it, and costs this row only.
 */
const OfficerRow = ({ officer: o, namesLoading, busy, onReset, onRemove }: {
  officer: Officer;
  /** The profiles are being read: an officer without one may be about to get a name. */
  namesLoading: boolean;
  busy: boolean;
  onReset: () => void;
  onRemove: () => void;
}) => {
  const name =
    o.profile === "unreadable" ? "Profile could not be read"
    : o.profile === "notLoaded" ? (namesLoading ? "Loading name…" : "(name not loaded)")
    : `${o.firstName} ${o.lastName}`.trim() || "(no name saved)";
  return (
    <li className={rowClass}>
      <div className="min-w-0">
        <p className="font-bold text-amber-950">{name}</p>
        <p className="text-sm text-amber-900/80 break-all">{o.email || o.uid}</p>
        {o.profile === "read" ? (
          <p className="text-xs text-amber-900/60">
            {o.created_at ? `Added ${dateReader(o.created_at)}` : "Added: date unknown"}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={onReset} disabled={busy || !o.email} className={buttonClass}>
          Reset password
        </button>
        <button onClick={onRemove} disabled={busy} className={removeButtonClass}>
          Remove access
        </button>
      </div>
    </li>
  );
};

/**
 * Creates a Firebase Auth account for someone else without disturbing the
 * admin's own session. There is no firebase-admin SDK here, and the client
 * SDK's createUser signs you in as the new user — so it runs on a second,
 * throwaway app instance with in-memory persistence, which is torn down after.
 * The new user's own session writes their profile, as the /users rules require.
 */
async function createOfficerAccount(input: {
  firstName: string; lastName: string; email: string; password: string; createdBy: string;
}): Promise<{ uid: string; profileSaved: boolean }> {
  // The name only has to differ from any other app alive in the page; it is
  // not a secret. crypto.randomUUID() would do, but browsers from before 2022
  // do not all have it, and without it no officer could be created there.
  const secondary = initializeApp(firebaseConfig, `officer-create-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  try {
    const secondaryAuth = initializeAuth(secondary, { persistence: inMemoryPersistence });
    connectAuthEmulatorIfConfigured(secondaryAuth);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, input.email, input.password);
    let profileSaved = true;
    try {
      await set(ref(getDatabase(secondary), `users/${cred.user.uid}`), {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        created_at: Date.now(),
        createdBy: input.createdBy,
      });
    } catch (err) {
      // Display-only; the account and its access work without it.
      console.error("Officer profile not saved:", err);
      profileSaved = false;
    }
    await signOut(secondaryAuth);
    return { uid: cred.user.uid, profileSaved };
  } finally {
    await deleteApp(secondary);
  }
}

const TeamPage = () => {
  // The uids under /police, or null until that has been read once.
  const [uids, setUids] = useState<string[] | null>(null);
  const [policeLoading, setPoliceLoading] = useState(true);
  const [policeError, setPoliceError] = useState(false);
  // /users as last read, or null when it never has been. Kept when a later
  // read fails, so names already on screen stay there.
  const [profiles, setProfiles] = useState<Record<string, unknown> | null>(null);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: generatePassword() });
  const [creating, setCreating] = useState(false);
  const [handover, setHandover] = useState<{ email: string; password: string } | null>(null);
  // An account this page just created whose police grant failed. Kept by uid
  // so the retry grants exactly that account — never one found by email.
  const [ungranted, setUngranted] = useState<{ uid: string; email: string; password: string } | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const { toast } = useToast();

  const officers = useMemo(() => (uids === null ? [] : buildOfficers(uids, profiles)), [uids, profiles]);

  // The two reads are separate on purpose. Who has access comes from /police,
  // which only admins write. The names come from /users, which each account
  // writes for itself and which holds every account, not just officers. If
  // the second cannot be read, or is slow, the list of who has access still
  // shows, and access can still be removed. Both go through readAsStaff: the
  // SDK's get() rejects the whole of /users if one profile holds a key named
  // "hasOwnProperty", which used to hide every officer.
  const loadPolice = async () => {
    setPoliceLoading(true);
    try {
      const police = await readAsStaff<unknown>("police", { records: true });
      if (police !== null && typeof police !== "object") throw new Error("/police is not a list of accounts");
      setUids(
        Object.entries(police ?? {})
          .filter(([, granted]) => granted === true)
          .map(([uid]) => uid)
      );
      setPoliceError(false);
    } catch (err) {
      // The list already on screen, if any, is left as it is.
      console.error("Could not load the police team:", err);
      setPoliceError(true);
    } finally {
      setPoliceLoading(false);
    }
  };

  const loadProfiles = async () => {
    setProfilesLoading(true);
    try {
      const users = await readAsStaff<unknown>("users", { records: true });
      if (users !== null && typeof users !== "object") throw new Error("/users is not a set of profiles");
      setProfiles((users ?? {}) as Record<string, unknown>);
      setProfilesError(false);
    } catch (err) {
      console.error("Could not load the officers' profiles:", err);
      setProfilesError(true);
    } finally {
      setProfilesLoading(false);
    }
  };

  // Neither rejects, so one failing never stops the other.
  const load = async () => {
    await Promise.all([loadPolice(), loadProfiles()]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grantAccess = async (uid: string) => {
    await set(ref(database, `police/${uid}`), true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();
    if (!firstName || !lastName || !email) {
      toast({ message: "Please enter the officer's name and email", type: "warning" });
      return;
    }
    if (form.password.length < MIN_PASSWORD) {
      toast({ message: `The temporary password must be at least ${MIN_PASSWORD} characters`, type: "warning" });
      return;
    }
    const admin = getAuth(app).currentUser;
    if (!admin) return;

    setCreating(true);
    try {
      const { uid, profileSaved } = await createOfficerAccount({
        firstName, lastName, email, password: form.password, createdBy: admin.uid,
      });
      try {
        await grantAccess(uid);
      } catch (err) {
        console.error("Account created but access not granted:", err);
        setUngranted({ uid, email, password: form.password });
        setForm({ firstName: "", lastName: "", email: "", password: generatePassword() });
        toast({
          message: "The account was created, but police access could not be granted yet. Use Retry below.",
          type: "error",
        });
        return;
      }
      setHandover({ email, password: form.password });
      setForm({ firstName: "", lastName: "", email: "", password: generatePassword() });
      toast({
        message: profileSaved ? "Officer added" : "Officer added (their name could not be saved)",
        type: profileSaved ? "success" : "warning",
      });
      await load();
    } catch (err: any) {
      const code = String(err?.code ?? "");
      if (code.includes("email-already-in-use")) {
        // Deliberately not linked by looking the email up in /users: that
        // field is written by the account holder, so anyone could plant a
        // profile claiming an officer's address and be granted access.
        toast({
          message: "That email address already has an account. Use a different address, or ask that person to contact you.",
          type: "error",
        });
      } else if (code.includes("invalid-email")) {
        toast({ message: "That email address is not valid", type: "error" });
      } else if (code.includes("weak-password")) {
        toast({ message: "That password is too weak", type: "error" });
      } else {
        console.error("Could not create the officer:", err);
        toast({ message: "Could not create the account. Please try again.", type: "error" });
      }
    } finally {
      setCreating(false);
    }
  };

  const retryGrant = async () => {
    if (!ungranted) return;
    setCreating(true);
    try {
      await grantAccess(ungranted.uid);
      setHandover({ email: ungranted.email, password: ungranted.password });
      setUngranted(null);
      toast({ message: "Officer added", type: "success" });
      await load();
    } catch (err) {
      console.error("Retry failed:", err);
      toast({ message: "Still could not grant access. Check your connection and try again.", type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (officer: Officer) => {
    const who = officer.email || officer.uid;
    if (!confirm(`Remove police access for ${who}? An open portal switches to "awaiting approval" within seconds, and everything they try to open is refused.`)) return;
    setBusyUid(officer.uid);
    try {
      await remove(ref(database, `police/${officer.uid}`));
      toast({ message: `Police access removed for ${who}`, type: "success" });
      // Taken off the screen now, in case the fresh read below fails.
      setUids((current) => (current ? current.filter((uid) => uid !== officer.uid) : current));
      await load();
    } catch (err) {
      console.error("Could not remove access:", err);
      toast({ message: "Could not remove access. Please try again.", type: "error" });
    } finally {
      setBusyUid(null);
    }
  };

  const handleReset = async (officer: Officer) => {
    if (!officer.email) return;
    setBusyUid(officer.uid);
    try {
      await sendPasswordResetEmail(getAuth(app), officer.email);
      toast({ message: `Password reset email sent to ${officer.email}`, type: "success" });
    } catch (err) {
      console.error(err);
      toast({ message: "Could not send the reset email. Please try again.", type: "error" });
    } finally {
      setBusyUid(null);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ message: "Copied", type: "success" });
    } catch {
      toast({ message: "Could not copy", type: "error" });
    }
  };

  return (
    <div className="w-full min-h-screen font-nunito p-4 md:p-10">
      <h1 className="font-bold text-4xl md:text-5xl text-center text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)] mb-2">
        Police Team
      </h1>
      <p className="text-center text-amber-900/80 max-w-2xl mx-auto mb-8">
        Officers can see the missing and wanted persons lists. They cannot change anything.
      </p>

      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {handover ? (
          <div className="bg-white/35 backdrop-blur-xl border border-amber-400/60 rounded-3xl p-6 shadow-[0_8px_32px_rgba(120,72,10,0.12)]">
            <h2 className="text-xl font-bold text-amber-950 mb-1">Give these to the officer</h2>
            <p className="text-sm text-amber-900/80 mb-4">
              This password is shown once. Ask them to sign in and change it from their profile straight away.
            </p>
            <div className="flex flex-col gap-2">
              {[["Email", handover.email], ["Temporary password", handover.password]].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 bg-white/40 border border-white/60 rounded-xl px-4 py-2">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-amber-900/70">{label}</p>
                    <p className="font-mono font-bold text-amber-950 break-all">{value}</p>
                  </div>
                  <button onClick={() => copy(value)} className={buttonClass}>Copy</button>
                </div>
              ))}
              <p className="text-sm text-amber-900/80 mt-1">
                Sign-in page: <span className="font-mono">{typeof window !== "undefined" ? `${window.location.origin}/login` : "/login"}</span>
              </p>
            </div>
            <button onClick={() => setHandover(null)} className={`${buttonClass} mt-4`}>Done</button>
          </div>
        ) : null}

        {ungranted ? (
          <div className="bg-white/35 backdrop-blur-xl border border-red-400/60 rounded-3xl p-6 shadow-[0_8px_32px_rgba(120,72,10,0.12)]">
            <h2 className="text-xl font-bold text-amber-950 mb-1">Access not granted yet</h2>
            <p className="text-sm text-amber-900/80 mb-3">
              The account for <span className="font-bold">{ungranted.email}</span> was created, but giving it police
              access failed. Retry now. If you close this page first, it can be granted in the Firebase Console by
              adding <span className="font-mono">police/{ungranted.uid}: true</span>.
            </p>
            <button onClick={retryGrant} disabled={creating} className={buttonClass}>
              {creating ? "Retrying…" : "Retry granting access"}
            </button>
          </div>
        ) : null}

        <form
          onSubmit={handleCreate}
          className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_32px_rgba(120,72,10,0.12)] flex flex-col gap-3"
        >
          <h2 className="text-xl font-bold text-amber-950">Add an officer</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* No longer than the rules allow for a name: a profile they refuse
                would leave the new officer listed with no name. */}
            <input className={inputClass} placeholder="First name" value={form.firstName} maxLength={NAME_LIMIT}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <input className={inputClass} placeholder="Last name" value={form.lastName} maxLength={NAME_LIMIT}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <input className={inputClass} type="email" placeholder="Officer's email address" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <div className="flex gap-3 items-center">
            <input className={`${inputClass} font-mono`} placeholder="Temporary password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button type="button" onClick={() => setForm({ ...form, password: generatePassword() })} className={`${buttonClass} whitespace-nowrap`}>
              New password
            </button>
          </div>
          <p className="text-xs text-amber-900/70">
            Use a real email address — it is how the officer resets a forgotten password.
          </p>
          <button type="submit" disabled={creating} className={buttonClass}>
            {creating ? "Creating account…" : "Create officer account"}
          </button>
        </form>

        <div className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_32px_rgba(120,72,10,0.12)]">
          <h2 className="text-xl font-bold text-amber-950 mb-3">
            Officers with access{uids === null ? "" : ` (${officers.length})`}
          </h2>
          {policeError ? (
            <div role="alert" className="bg-white/40 border border-white/60 rounded-2xl px-4 py-3 mb-3">
              <p className="font-bold text-amber-950">Could not load the team</p>
              <p className="text-sm text-amber-900/80 mb-3">
                {uids === null
                  ? "The list of officers could not be read, so none are shown. That does not mean there are none. Check your connection and try again."
                  : "The list could not be read again. What is below is as it was when it last loaded."}
              </p>
              <button type="button" onClick={loadPolice} disabled={policeLoading} className={buttonClass}>
                {policeLoading ? "Trying again…" : "Try again"}
              </button>
            </div>
          ) : null}
          {profilesError ? (
            <div role="alert" className="bg-white/40 border border-white/60 rounded-2xl px-4 py-3 mb-3">
              <p className="font-bold text-amber-950">Could not load the officers&rsquo; names</p>
              <p className="text-sm text-amber-900/80 mb-3">
                {profiles === null
                  ? "Each officer is shown by account ID until the names can be read. Access can still be removed."
                  : "The names could not be read again. Those below are as they were when they last loaded."}
              </p>
              <button type="button" onClick={loadProfiles} disabled={profilesLoading} className={buttonClass}>
                {profilesLoading ? "Trying again…" : "Try again"}
              </button>
            </div>
          ) : null}
          {uids === null ? (
            policeError ? null : (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800"></div>
              </div>
            )
          ) : officers.length === 0 ? (
            // Not said after a failed read: an empty list that could not be
            // refreshed is not known to be empty.
            policeError ? null : <p className="text-amber-900/80">No officers yet. Add one above.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {officers.map((o) => (
                <CardBoundary
                  key={o.uid}
                  resetKey={officers}
                  fallback={
                    <li className={rowClass}>
                      <div className="min-w-0">
                        <p className="font-bold text-amber-950">This record could not be displayed</p>
                        <p className="text-sm text-amber-900/80 break-all">{textOf(o.uid)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleRemove(o)} disabled={busyUid === o.uid} className={removeButtonClass}>
                          Remove access
                        </button>
                      </div>
                    </li>
                  }
                >
                  <OfficerRow
                    officer={o}
                    namesLoading={profilesLoading}
                    busy={busyUid === o.uid}
                    onReset={() => handleReset(o)}
                    onRemove={() => handleRemove(o)}
                  />
                </CardBoundary>
              ))}
            </ul>
          )}
          <p className="text-xs text-amber-900/60 mt-4">
            Removing access takes effect within seconds, even on a portal that is already open. The
            login itself remains, but only reaches an &ldquo;awaiting approval&rdquo; screen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
