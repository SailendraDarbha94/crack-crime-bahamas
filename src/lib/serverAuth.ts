// Server-only helper: verifies that the caller of an API route is an
// allowlisted admin, without needing the firebase-admin SDK.
//
// How it works: the client sends its Firebase ID token as a Bearer header.
// We read /admins/{uid}.json through the RTDB REST endpoint with ?auth= set
// to that token. Firebase itself verifies the token's signature and expiry,
// and evaluates the security rules AS that user — the rules make
// /admins/{uid} readable only by that same uid. A forged or expired token
// gets a 401; a real-but-not-allowlisted user reads null.

export async function verifyAdmin(req: Request): Promise<boolean> {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const idToken = authHeader.replace(/^Bearer\s+/i, "");
    if (!idToken || idToken.split(".").length !== 3) {
      return false;
    }

    // Decode the uid locally — unverified is fine here, because the REST
    // call below only succeeds if Firebase accepts the whole token.
    const payloadJson = Buffer.from(idToken.split(".")[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson);
    const uid: string | undefined = payload.user_id ?? payload.sub;
    if (!uid) {
      return false;
    }

    const dbUrl = process.env.NEXT_PUBLIC_DATABASE_URL;
    if (!dbUrl) {
      console.error("verifyAdmin: NEXT_PUBLIC_DATABASE_URL is not set");
      return false;
    }

    const res = await fetch(
      `${dbUrl.replace(/\/$/, "")}/admins/${encodeURIComponent(uid)}.json?auth=${encodeURIComponent(idToken)}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return false;
    }
    const value = await res.json();
    return value === true;
  } catch (err) {
    console.error("verifyAdmin failed:", err);
    return false;
  }
}
