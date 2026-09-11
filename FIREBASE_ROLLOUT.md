# Firebase Security Rollout Runbook

The code on this branch works under **both** the current open rules and the
new locked rules — so deploy the site first, flip the rules last, and there
is never a window where the admin UI and the database disagree.

**Production migration — follow the order exactly.**

## 0. One-time CLI setup

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pick the project, alias it "default"
```

Commit the generated `.firebaserc`.

## 1. Ship the code first

Deploy this branch to hosting (Vercel). In the hosting env settings, mirror
the local `.env` changes:

- rename `NEXT_PUBLIC_EXPO_ACCESS_TOKEN` → `EXPO_ACCESS_TOKEN`
- rename `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → `GOOGLE_MAPS_API_KEY`
- delete `NEXT_PUBLIC_GEMINI_KEY`, `NEXT_PUBLIC_NINJA_KEY`,
  `NEXT_PUBLIC_TEST_EXPONENT_TOKEN`, `NEXT_PUBLIC_MONGODB_URI`,
  `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- add `INVITE_CODE` (see local `.env` for the generated one, or set your own)
- add `TIP_ENCRYPTION_KEY=ebiz242` (must match the mobile app until a
  coordinated key rotation)

Smoke test on the live site (rules still open — nothing can break):
admin login → dashboard counts → tips list → add/delete a test wanted
record (verify only ONE record is created) → member form → sign-up with the
invite code.

## 2. Back up before touching rules

- Firebase Console → Realtime Database → ⋮ → **Export JSON** — save it.
- Console → Realtime Database → Rules — copy the **currently deployed** rules
  into a local file (`rules-backup.json`). The repo's old rules may not match
  what's actually deployed; this file is your instant rollback.
- Same for Storage → Rules.

## 3. Seed the admin allowlist

1. Console → Authentication → Users — copy the **UID** of each real admin.
2. Console → Realtime Database → Data → create:
   ```
   admins
     └─ <ADMIN_UID>: true
   ```
   (one child per admin, value exactly boolean `true`)

## 4. Deploy the DATABASE rules (immediately after seeding)

```bash
firebase deploy --only database
```

> **⚠️ Deploy `database` only — NOT `storage` (yet).** Two reasons:
> 1. `storage.rules` still contains the literal `REPLACE_WITH_ADMIN_UID`
>    placeholder; deploying as-is denies *all* storage writes (nobody could
>    upload banners or person photos).
> 2. The mobile team's banner-upload laptop script currently relies on the
>    **open** storage rules. Locking storage before that pipeline is migrated
>    stops banner updates entirely.
>
> **When you're ready to lock storage** (after the web banner-management page
> is live and the mobile script either signs in as an allowlisted admin or is
> retired): edit `storage.rules`, replace `REPLACE_WITH_ADMIN_UID` with the
> same admin UID(s) from step 3 (e.g. `in ['abc123', 'def456']`), commit, then
> `firebase deploy --only storage`. Coordinate with the mobile session first.
>
> Note: banner uploads stay **client-side** (admin signed in on the website),
> so the storage rule is the uid-pinned `allow write: if isAdmin()` already in
> the repo — **not** the `write: if false` + Admin-SDK model from the mobile
> handoff doc.

## 5. Smoke test on locked rules

As an **allowlisted admin** (logged in): dashboard counts load, tips list
loads and decrypts, add + delete a wanted record, advert upload works,
device list on the notifications page loads, a general notification sends.

As **anonymous** (incognito):

```bash
# tips must be DENIED:
curl "https://<db-url>/messages.json"           # → permission denied
# device register must be DENIED:
curl "https://<db-url>/notifications_register.json"   # → permission denied
# PINs must not be enumerable:
curl "https://<db-url>/tipPins.json"            # → permission denied
# wanted list must still be PUBLIC:
curl "https://<db-url>/wanteds.json"            # → data
# web tip intake must still WORK, and now returns a 6-character PIN:
curl -X POST https://<site>/api/message -H 'content-type: application/json' \
  -d '{"message":"rules smoke test"}'           # → {"data":"K7M2QX"}
# that PIN resolves on its own, and reveals nothing but the tip's key:
curl "https://<db-url>/tipPins/K7M2QX.json"     # → {"tipId":"-N...","created_at":...}
```

Also: member form submits; `/admin` redirects to login; a signed-in but
non-allowlisted account sees the "awaiting approval" screen.

## 6. Mobile canary (same day)

On a real device with the production app:
- submit a tip → appears (decrypted) in the admin inbox
- fresh install / re-register → device appears in the notifications page
- app feeds load: wanteds, missings, adverts images

Watch Console → Realtime Database → Usage/Profiler for unexpected
`permission_denied` spikes — that's the tripwire for any app path we
classified wrong (e.g. the `notifications` node, or an app-side unregister).

## 7. Rollback (if the app breaks)

```bash
# restore the saved pre-change rules — seconds, no site redeploy needed:
firebase deploy --only database    # with rules-backup.json as database.rules.json
```

## Deferred (needs a coordinated mobile-app release)

- Rotate the tip AES key (versioned envelope so old tips still decrypt)
- Confirm the app's transport (direct RTDB vs /api) → tighten `.validate`
- Firebase App Check for real anti-abuse on the public create paths
- Custom claims via firebase-admin (replaces uid-pinned storage rules)

## Tip PINs

`/tipPins/$pin → { tipId, created_at }` maps a tipster's 6-character PIN to
their tip. Deliberately shaped so the PIN is a **capability token, not a key
to the tip**:

- `.read` sits on `$pin`, never on `tipPins` itself — you can resolve a PIN
  you already hold, but you cannot list them. Guessing is the only way in,
  across 31^6 ≈ 887 million PINs.
- Resolving one yields a tip *key*, which is useless on its own: `/messages`
  stays admin-read-only.
- Writes are create-only, so a PIN can never be reassigned. That rule is also
  what keeps PINs unique: `/api/message` writes the tip and its PIN in one
  multi-path update, so a collision rejects **both** and the route retries
  with a fresh PIN rather than leaving a tip no PIN points at.
- Deleting a tip in the admin inbox drops its PIN in the same update.

Rules and atomicity are covered by emulator tests — see the PR that added
them. When follow-up messages and reward status land, they hang off the same
PIN (`/tipFollowUps/$pin`, `/tipStatus/$pin`) and must keep this shape: a
guessed PIN may add to a tip or read a status word, never read tip content.
