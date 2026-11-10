// Server-only helpers for the Realtime Database REST API.
//
// There is no firebase-admin SDK in this project, so the server has no
// identity of its own: through the client SDK it reads and writes as an
// anonymous visitor. When an action must be attributed to a signed-in admin
// (and allowed by the rules only for admins), the server instead forwards that
// admin's own Firebase ID token to the REST API. Firebase verifies the token
// and evaluates the security rules AS that user.

/**
 * REST URL for a database path, with an ID token if given. Built with URL so
 * a database URL that already carries a query (the emulator's `?ns=`) stays
 * valid.
 */
export function rtdbRestUrl(path: string, idToken?: string): string | null {
  const base = process.env.NEXT_PUBLIC_DATABASE_URL;
  if (!base) return null;
  const url = new URL(base);
  const clean = path.replace(/^\/+|\/+$/g, "");
  url.pathname = `/${clean}.json`;
  if (idToken) url.searchParams.set("auth", idToken);
  return url.toString();
}

/** The database answered a REST write with an error status. */
export class RtdbRestError extends Error {
  constructor(public readonly status: number) {
    super(`Database refused the update (HTTP ${status})`);
    this.name = "RtdbRestError";
  }
  /** True when the rules (or the token) turned the write down, as opposed to the database being unwell. */
  get denied(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

/**
 * Atomic multi-path update performed as the user who owns `idToken`. Throws
 * an RtdbRestError if the database answers with an error, exactly as the
 * client SDK's update() would reject; a request that gets no answer at all
 * throws whatever fetch throws.
 */
export async function rtdbRestUpdate(
  updates: Record<string, unknown>,
  idToken: string
): Promise<void> {
  const url = rtdbRestUrl("", idToken);
  if (!url) throw new Error("NEXT_PUBLIC_DATABASE_URL is not set");
  // REST multi-path keys are relative to the URL's node: no leading slash.
  const body = Object.fromEntries(
    Object.entries(updates).map(([path, value]) => [path.replace(/^\/+/, ""), value])
  );
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new RtdbRestError(res.status);
}
