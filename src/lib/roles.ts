import { database } from "@/lib/firebase";
import { get, ref } from "firebase/database";

// Who a signed-in user is, as far as the site is concerned. The database
// rules are the real boundary — this only decides which pages to show.
export type Role = "admin" | "police" | "none";

// Where each role lands after signing in.
export const HOME_FOR_ROLE: Record<Role, string> = {
  admin: "/admin",
  police: "/police",
  none: "/admin", // the guard there shows "awaiting approval"
};

const isPermissionDenied = (err: unknown) =>
  String((err as any)?.code ?? (err as any)?.message ?? "").toLowerCase().includes("permission");

// Reads one self-readable allowlist entry. A permission-denied answer can
// only mean "not on this list" (for example, rules that predate the list),
// so it is treated as false; anything else — offline, timeouts — is thrown so
// the caller fails closed instead of guessing.
async function onList(list: "admins" | "police", uid: string): Promise<boolean> {
  try {
    return (await get(ref(database, `${list}/${uid}`))).val() === true;
  } catch (err) {
    if (isPermissionDenied(err)) return false;
    throw err;
  }
}

/**
 * Resolves a user's role. Admins are checked first and returned without
 * touching /police, so admin access never depends on the police rules having
 * been deployed. Throws on a genuine read failure — never resolves to a role
 * it could not confirm.
 */
export async function getRole(uid: string): Promise<Role> {
  if (await onList("admins", uid)) return "admin";
  if (await onList("police", uid)) return "police";
  return "none";
}
