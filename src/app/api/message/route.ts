import app from "@/lib/firebase";
import { child, get, push, ref, getDatabase, update } from "firebase/database";
import CryptoES from "crypto-es";
import { findTipPinCandidates, generateTipPin } from "@/lib/tipPin";

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

// A collision is vanishingly unlikely across 31^6 PINs, so a handful of
// attempts covers both a genuine clash and a lost race with another tip.
const MAX_PIN_ATTEMPTS = 5;

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
    const created_at = Date.now();
    const tip = {
      message: ciphertext,
      encrypted: true,
      created_at,
    };

    // A tipster continuing an existing tip is told to quote their PIN. Any
    // PIN-shaped token counts, wherever it appears — but being PIN-shaped
    // proves nothing ("PARKED outside the store" looks exactly like one), so
    // a candidate only threads if it resolves to a real tip.
    for (const candidate of findTipPinCandidates(message.trim())) {
      let tipId: string | null = null;
      try {
        const claim = (await get(child(ref(db), `tipPins/${candidate}`))).val();
        if (claim && typeof claim.tipId === "string") tipId = claim.tipId;
      } catch {
        break; // index unreachable — fall through and store this as a new tip
      }
      if (!tipId) continue;

      const followUpKey = push(child(ref(db), `messages/${tipId}/followUps`)).key;
      if (!followUpKey) break;

      try {
        const updates: Record<string, unknown> = {};
        updates[`/messages/${tipId}/followUps/${followUpKey}`] = {
          message: ciphertext,
          encrypted: true,
          created_at,
        };
        await update(ref(db), updates);
        // The same PIN comes back, not a new one: the tipster has one PIN for
        // the whole conversation. Older app builds show it unchanged, which
        // stays correct without needing a release.
        return Response.json({ data: candidate, threaded: true });
      } catch (err) {
        console.error("Could not append the follow-up; storing it as a new tip:", err);
        break;
      }
    }

    const newKey = push(child(ref(db), 'messages')).key;
    if (!newKey) {
      console.error("Tip intake failed: could not allocate a key");
      return Response.json({ data: "request failure" }, { status: 500 });
    }

    // Preferred path: the tip and its PIN index in one multi-path update, so a
    // tip can never exist without its PIN or vice versa. The create-only rule
    // on /tipPins/$pin is what keeps PINs unique — a duplicate is rejected by
    // the database and we simply draw another PIN.
    let indexUnavailable = false;

    for (let attempt = 0; attempt < MAX_PIN_ATTEMPTS && !indexUnavailable; attempt += 1) {
      const pin = generateTipPin();

      // Whether we can see the index at all decides how to read a failed write
      // below: a lost race is worth retrying, missing rules are not.
      let indexReachable = true;
      try {
        if ((await get(child(ref(db), `tipPins/${pin}`))).exists()) continue;
      } catch {
        indexReachable = false;
      }

      try {
        const updates: Record<string, unknown> = {};
        updates['/messages/' + newKey] = { ...tip, pin };
        updates['/tipPins/' + pin] = { tipId: newKey, created_at };
        await update(ref(db), updates);
        return Response.json({ data: pin });
      } catch (err) {
        if (indexReachable) continue; // someone took that PIN first — draw another
        console.error("Tip PIN index unavailable; storing the tip without it:", err);
        indexUnavailable = true;
      }
    }

    // Fallback for a database whose `tipPins` rules have not been deployed yet
    // (see FIREBASE_ROLLOUT.md). Losing the index must never cost us a tip —
    // taking tips is the entire point of this endpoint. The tipster still gets
    // a PIN, it is still stored on the tip and still shown in the admin inbox;
    // only the PIN→tip lookup is missing, and nothing reads it yet. Once the
    // rules are deployed the branch above starts succeeding on its own.
    if (indexUnavailable) {
      const pin = generateTipPin();
      try {
        const updates: Record<string, unknown> = {};
        updates['/messages/' + newKey] = { ...tip, pin };
        await update(ref(db), updates);
        return Response.json({ data: pin });
      } catch (err) {
        console.error("Tip intake failed:", err);
      }
    }

    return Response.json({ data: "request failure" }, { status: 500 });
}
