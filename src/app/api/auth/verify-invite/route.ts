import { timingSafeEqual } from "crypto";

// Verifies a sign-up invite code against the server-only INVITE_CODE env var.
// This gates the sign-up UI. It is a doorbell, not the lock: real admin
// authority comes from the /admins allowlist in the database rules, so an
// account created by bypassing this check still has zero privileges.

const safeCompare = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
};

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    const expected = process.env.INVITE_CODE;

    if (!expected) {
      console.error("verify-invite: INVITE_CODE env var is not configured");
      return Response.json({ ok: false }, { status: 503 });
    }

    if (typeof code !== "string" || !safeCompare(code, expected)) {
      // Blunt brute-force attempts a little
      await new Promise((resolve) => setTimeout(resolve, 250));
      return Response.json({ ok: false }, { status: 401 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
