import app from "@/lib/firebase";
import { child, get, push, ref, getDatabase, update } from "firebase/database";
import CryptoES from "crypto-es";
import { findTipPinCandidates, generateTipPin } from "@/lib/tipPin";
import { normaliseCategory, wellFormedText, type TipSource } from "@/lib/tipCategories";
import { bearerToken, verifyAdmin } from "@/lib/serverAuth";
import { RtdbRestError, rtdbRestUpdate } from "@/lib/rtdbRest";

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

// A collision is vanishingly unlikely across some 739 million PINs, so a
// handful of attempts covers both a genuine clash and a lost race with another
// tip.
const MAX_PIN_ATTEMPTS = 5;

// A write that is refused although its PIN was just seen to be free is almost
// never a lost race (that needs two tips to draw the same PIN in the same
// instant): the database is turning the tip down for some other reason, and a
// third identical try will not change its mind. Stop early and let the caller
// try a different shape of write instead.
const MAX_REFUSALS = 2;

// What a tip's database key looks like (a push id). /tipPins can be written
// by anyone, so the tip id it names is untrusted input: one holding a slash or
// a character the SDK refuses would otherwise aim a write somewhere else, or
// throw before the tip is stored. Kept in step with the `tipPins` rules.
const TIP_ID_PATTERN = /^[-_A-Za-z0-9]{1,128}$/;

// "__proto__" has the shape of a key but must never be used as one. The admin
// pages read /messages into a plain object, where a child of that name
// becomes the object's prototype instead of an entry and drops out of every
// listing: a tip filed under it, and every message added to it, would be
// invisible to staff. The rules refuse it too.
const isTipKey = (id: unknown): id is string =>
  typeof id === "string" && TIP_ID_PATTERN.test(id) && id !== "__proto__";

// True when the database itself turned a write down (its rules said no), as
// opposed to the write failing some other way, such as getting no answer.
const isRefusal = (err: unknown): boolean => {
  if (err instanceof RtdbRestError) return err.denied;
  return String((err as { code?: unknown } | null)?.code ?? "").toUpperCase() === "PERMISSION_DENIED";
};

type Updates = Record<string, unknown>;

export async function POST(req: Request) {
    const db = getDatabase(app);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ data: "request failure" }, { status: 400 });
    }

    // The tip itself must be plain text; everything else is set server-side
    // or checked below.
    const message = body?.message;
    if (typeof message !== "string" || !message.trim() || message.length > MAX_TIP_LENGTH) {
      return Response.json({ data: "request failure" }, { status: 400 });
    }

    // How the tip reached us. The app's "Text a Tip" sends "text" and the web
    // form sends "web"; app versions from before the flag existed send
    // nothing and are the app, so they count as text. "call" is a tip phoned
    // in and typed up by staff: it is accepted only from a signed-in admin,
    // and is then written with that admin's own token so the database rules
    // can hold the same line (they refuse "call" from anyone else).
    let source: TipSource = body?.source === "web" ? "web" : "text";
    let adminToken: string | null = null;
    if (body?.source === "call") {
      adminToken = bearerToken(req);
      if (!adminToken || !(await verifyAdmin(req))) {
        return Response.json({ data: "request failure" }, { status: 403 });
      }
      source = "call";
    }
    // Only a NEW tip is ever written with the admin's token (it is what lets
    // the rules accept "call"). Follow-ups are always written as an anonymous
    // visitor, whoever typed them: the rules then confine that write to
    // creating one follow-up, wherever the PIN index points.
    const writeNewTip = (updates: Updates): Promise<void> =>
      adminToken ? rtdbRestUpdate(updates, adminToken) : update(ref(db), updates);

    const encrypt = (text: string): string =>
      CryptoES.AES.encrypt(text, TIP_ENCRYPTION_KEY).toString();

    // The cipher throws on half an emoji; a stray character must not cost a tip.
    const text = wellFormedText(message.trim());
    const ciphertext = encrypt(text);
    const created_at = Date.now();
    // The tip as it has always been stored: enough on its own to be a tip.
    const bareTip = {
      message: ciphertext,
      encrypted: true,
      created_at,
    };
    // The type of crime is kept in the clear so tips can be counted without
    // being read. A description typed for "Other" is the tipster's own words,
    // so it is encrypted like the tip.
    const { category, categoryOther } = normaliseCategory(body?.category, body?.category_other);
    let categoryOtherCipher: string | null = null;
    if (categoryOther) {
      try {
        categoryOtherCipher = encrypt(categoryOther);
      } catch (err) {
        // The label is never worth the tip: keep "other" without its description.
        console.error("Could not encrypt the Other description; storing the tip without it:", err);
      }
    }
    const tip: Updates = {
      ...bareTip,
      source,
      ...(category ? { category } : {}),
      ...(categoryOtherCipher ? { category_other: categoryOtherCipher } : {}),
    };

    // A tipster continuing an existing tip is told to quote their PIN. Any
    // PIN-shaped token counts, wherever it appears — but being PIN-shaped
    // proves nothing ("PARKED outside the store" looks exactly like one), so
    // a candidate only threads if it resolves to a real tip. A follow-up
    // joins the tip it quotes and keeps that tip's category and source.
    for (const candidate of findTipPinCandidates(text)) {
      let tipId: string | null = null;
      try {
        const claim = (await get(child(ref(db), `tipPins/${candidate}`))).val();
        if (claim && isTipKey(claim.tipId)) tipId = claim.tipId;
      } catch {
        break; // index unreachable — fall through and store this as a new tip
      }
      if (!tipId) continue;

      try {
        const followUpKey = push(child(ref(db), `messages/${tipId}/followUps`)).key;
        if (!followUpKey) break;

        const updates: Updates = {};
        updates[`/messages/${tipId}/followUps/${followUpKey}`] = {
          message: ciphertext,
          encrypted: true,
          created_at,
        };
        // Anonymous on purpose, even for a call: see writeNewTip above.
        await update(ref(db), updates);
        // The same PIN comes back, not a new one: the tipster has one PIN for
        // the whole conversation. Older app builds show it unchanged, which
        // stays correct without needing a release.
        return Response.json({ data: candidate, threaded: true });
      } catch (err) {
        // Nothing was stored, so the next PIN-shaped word may still be the
        // real PIN: a word that merely resolves (a stale or planted entry)
        // must not stop the tipster's own PIN, later in the message, from
        // being found. If none works, the message becomes a new tip below.
        console.error("Could not append the follow-up to this candidate; trying the next:", err);
        continue;
      }
    }

    const newKey = push(child(ref(db), 'messages')).key;
    if (!newKey) {
      console.error("Tip intake failed: could not allocate a key");
      return Response.json({ data: "request failure" }, { status: 500 });
    }

    type Stored = { pin: string | null; refused: boolean };

    // Last resort: the tip alone, with a PIN but without its entry in the PIN
    // index. Losing the index must never cost us a tip — taking tips is the
    // entire point of this endpoint. The tipster still gets a PIN, it is still
    // stored on the tip and still shown in the admin inbox; only the PIN→tip
    // lookup is missing, so a later message quoting the PIN arrives as a new
    // tip instead of joining this one.
    const storeWithoutIndex = async (fields: Updates): Promise<Stored> => {
      const pin = generateTipPin();
      try {
        const updates: Updates = {};
        updates['/messages/' + newKey] = { ...fields, pin };
        await writeNewTip(updates);
        return { pin, refused: false };
      } catch (err) {
        console.error("Could not store the tip even without its PIN index:", err);
        return { pin: null, refused: true };
      }
    };

    // Whether the write that paired `pin` with this tip is in the database.
    // The index is public to read, and `newKey` is known to this request
    // alone, so an entry naming it under this PIN can only be our own write.
    const landed = async (pin: string): Promise<boolean> => {
      try {
        const entry = (await get(child(ref(db), `tipPins/${pin}`))).val();
        return Boolean(entry) && entry.tipId === newKey;
      } catch {
        return false;
      }
    };

    // Stores `fields` as a new tip and returns its PIN. `refused` means the
    // tip could not be stored in this shape, so a different shape is worth
    // trying.
    const storeNewTip = async (fields: Updates): Promise<Stored> => {
      // Preferred path: the tip and its PIN index in one multi-path update, so a
      // tip can never exist without its PIN or vice versa. The create-only rule
      // on /tipPins/$pin is what keeps PINs unique — a duplicate is rejected by
      // the database and we simply draw another PIN. That the two are written
      // together is also what the rules require of an index entry: it must
      // name a tip created in the same write and carrying the same PIN.
      let refusals = 0;

      for (let attempt = 0; attempt < MAX_PIN_ATTEMPTS && refusals < MAX_REFUSALS; attempt += 1) {
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
          const updates: Updates = {};
          updates['/messages/' + newKey] = { ...fields, pin };
          updates['/tipPins/' + pin] = { tipId: newKey, created_at };
          await writeNewTip(updates);
          return { pin, refused: false };
        } catch (err) {
          // Told the write failed — but a reply can be lost after the write
          // has gone through. Check before trying anything else: storing the
          // tip a second way on top of one that landed would leave it under a
          // PIN the index does not know.
          if (await landed(pin)) return { pin, refused: false };
          if (!indexReachable) {
            // The index cannot even be read: a database whose `tipPins` rules
            // are missing (see FIREBASE_ROLLOUT.md). Store the tip without it.
            console.error("Tip PIN index unavailable; storing the tip without it:", err);
            return storeWithoutIndex(fields);
          }
          // That PIN was free a moment ago, so a refusal is the database's
          // verdict on this shape of tip (see MAX_REFUSALS). Anything else
          // (no answer, a database error) is worth simply trying again.
          if (isRefusal(err)) refusals += 1;
          else console.error("Tip write failed without being refused; trying again:", err);
          continue;
        }
      }

      return { pin: null, refused: true };
    };

    // Each step gives up something less important than the tip itself, and is
    // only reached when the database has refused every step before it:
    //   1. the tip, its labels and its PIN index entry;
    //   2. the same without the index entry (the rules will not take the entry);
    //   3. the tip without its category and source, with the index entry (the
    //      rules will not take the labels: rules out of step with this code);
    //   4. the tip alone.
    // A tip with no label, or one whose PIN cannot be looked up, is worth
    // infinitely more than no tip.
    const attempts: [string, () => Promise<Stored>][] = [
      ["with its labels and PIN index", () => storeNewTip(tip)],
      ["with its labels, without the PIN index", () => storeWithoutIndex(tip)],
      ["without its labels, with the PIN index", () => storeNewTip(bareTip)],
      ["without its labels or the PIN index", () => storeWithoutIndex(bareTip)],
    ];
    let stored: Stored = { pin: null, refused: true };
    for (const [shape, attempt] of attempts) {
      stored = await attempt();
      if (stored.pin) break;
      console.error(`Tip refused ${shape}; trying the next way of storing it`);
    }

    if (stored.pin) {
      return Response.json({ data: stored.pin });
    }
    return Response.json({ data: "request failure" }, { status: 500 });
}
