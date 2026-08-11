import app from "@/lib/firebase";
import { child, push, ref, getDatabase, update } from "firebase/database";
import CryptoES from "crypto-es";

// Public tip intake. Reads of /messages are admin-only (database rules);
// this endpoint only CREATES tips, and the create-only rule on
// /messages/$id permits unauthenticated pushes.
//
// The GET handler was removed deliberately: it returned every tip to any
// caller. The admin inbox reads the database directly as an authed admin.

// Falls back to the historical key so tips stay compatible with the mobile
// app until a coordinated key rotation. Overridable via server env.
const TIP_ENCRYPTION_KEY = process.env.TIP_ENCRYPTION_KEY ?? "ebiz242";
const MAX_TIP_LENGTH = 10000;

export async function POST(req: Request) {
    const db = getDatabase(app);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ data: "request failure" }, { status: 400 });
    }

    // Accept only a plain-text tip; everything else is set server-side.
    const message = body?.message;
    if (typeof message !== "string" || !message.trim() || message.length > MAX_TIP_LENGTH) {
      return Response.json({ data: "request failure" }, { status: 400 });
    }

    const ciphertext = CryptoES.AES.encrypt(message.trim(), TIP_ENCRYPTION_KEY).toString();
    const tip = {
      message: ciphertext,
      encrypted: true,
      created_at: Date.now(),
    };

    const newKey = push(child(ref(db), 'messages')).key;

    try {
      const updates: Record<string, unknown> = {};
      updates['/messages/' + newKey] = tip;
      await update(ref(db), updates);
      return Response.json({ data: newKey });
    } catch (err) {
      console.error("Tip intake failed:", err);
      return Response.json({ data: "request failure" }, { status: 500 });
    }
}
