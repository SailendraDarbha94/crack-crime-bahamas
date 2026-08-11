import app from "@/lib/firebase";
import { child, push, ref, getDatabase, update } from "firebase/database";

// Public membership-form intake. Reads of /members are admin-only via the
// database rules — the GET handler that returned every member's PII to any
// caller was removed; the admin page reads the database as an authed admin.

export async function POST(req: Request) {
    const db = getDatabase(app);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ data: "request failure" }, { status: 400 });
    }

    // Whitelist the exact fields the form collects; server-side timestamp.
    const asTrimmedString = (v: unknown, max: number) =>
      typeof v === "string" ? v.trim().slice(0, max) : "";

    const member = {
      name: asTrimmedString(body?.name, 200),
      email: asTrimmedString(body?.email, 320),
      address: asTrimmedString(body?.address, 500),
      mobile: asTrimmedString(body?.mobile, 50),
      support: asTrimmedString(body?.support, 40),
      created_at: Date.now(),
    };

    if (!member.name || !member.email) {
      return Response.json({ data: "request failure" }, { status: 400 });
    }

    const newKey = push(child(ref(db), 'members')).key;
    try {
      const updates: Record<string, unknown> = {};
      updates['/members/' + newKey] = member;
      await update(ref(db), updates);
      return Response.json({ data: newKey });
    } catch (err) {
      console.error("Membership submission failed:", err);
      return Response.json({ data: "request failure" }, { status: 500 });
    }
}
