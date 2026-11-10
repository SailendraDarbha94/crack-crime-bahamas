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
record (verify only ONE record is created) → sign-up with the
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

Also: `/admin` redirects to login; a signed-in but
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
  across some 739 million PINs.
- Resolving one yields a tip *key*, which is useless on its own: `/messages`
  stays admin-read-only.
- Writes are create-only, so a PIN can never be reassigned. That rule is also
  what keeps PINs unique: `/api/message` writes the tip and its PIN in one
  multi-path update, so a collision rejects **both** and the route retries
  with a fresh PIN rather than leaving a tip no PIN points at.
- Deleting a tip in the admin inbox drops its PIN too.

**Who may add to the index.** The intake has no identity of its own (there is
no firebase-admin SDK), so whatever it may write, anyone may write. And a
message that merely *contains* a registered PIN is filed under that PIN's tip
as a follow-up. Left open, that lets someone register "NASSAU" or "STREET" and
collect every tip that uses the word. Two rules on `/tipPins/$pin` close it:

- **A new PIN must mix letters and digits.** No ordinary word and no ordinary
  number can be registered. `generateTipPin()` only draws mixed PINs, so the
  intake never asks for one the rules would refuse. PINs issued before this
  (about one in six was letters only) are already in the index and keep
  working; the rules judge new entries only, and the intake still looks up
  letters-only tokens for their sake.
- **A new entry must come with its own tip.** It is accepted only in a write
  that also creates the tip it names, with that tip carrying the same PIN: the
  one multi-path update the intake makes. An entry on its own, a second PIN for
  a tip, or an entry naming a tip that already exists or does not exist is
  refused, for admins as much as for anyone. So every PIN added to the index
  belongs to a tip stored under `/messages` and carrying that PIN, which the
  inbox lists and an admin can read and delete (which removes the PIN). The
  index itself can no longer hold anything a tip does not account for.

"Which the inbox lists" depends on the staff pages showing what a record
really holds, and the key `__proto__` breaks that. The SDK builds `snapshot.val()` by plain
assignment, so a child of that name is not an entry: it becomes the object's
prototype. A tip stored *under* that key drops out of every listing; a tip
stored *with* a child of that name is read with fields the rules never saw (a
forged archive mark hides it from the inbox, a forged follow-up can stop the
page loading). Both are shut twice over:

- The rules refuse the key as a tip's id, as a child of a tip, as a follow-up's
  id, and as the tip an index entry names; the intake will not follow an entry
  that names it.
- Every staff page reads tips through `ownData()` (`src/lib/ownData.ts`), which
  keeps only what each record itself holds, and looks records up by id with
  `ownEntry()` so an id such as `constructor` does not find what every object
  inherits.

For the same reason `readTipText()` will not hand the cipher an object-form
message whose sizes do not add up. The rules accept any object as a tip's
message, because the 2024 app stored cipher objects (ten of them are still in
the database), and one claiming an impossible size made the decryption loop
for ever, freezing the inbox for whoever opened it.

What is left: someone can still file real, visible tips under mixed codes they
chose (licence plates, say), any number of them, and a later tip quoting such a
code joins that tip as a follow-up. An admin sees both. Read a junk tip's later
messages before deleting it, because they go with it. Closing this for good
needs the intake to hold a secret or an identity of its own, which this project
does not have yet.

Deleting a tip removes only the index entry that names that tip. A tip's `pin`
field alone proves nothing: anyone can file a tip carrying a PIN that belongs
to another tip, and deleting that decoy must leave the real tip's PIN alone.

These rules judge new entries only. Whatever was in the index before they went
live stays: audit it once afterwards (every entry should name an existing tip
that carries the same PIN).

**Known gaps: hostile records.** Anyone can write a new tip straight to the
database, and `/messages/$id` accepts loosely shaped records (any object as the
message, any extra fields, any number of follow-ups). The staff pages were
written for the records the intake makes. Reviews of this change found ways,
all older than it and none seen in the live data, for one crafted record to
stop the inbox loading for every admin until it is removed in the Firebase
console. They are not fixed yet:

- a key named `hasOwnProperty` anywhere in a tip makes the SDK's `get()` of
  `/messages` reject, so no page can read any tip;
- a tip with more than about 100,000 follow-ups, or with `followUps` stored as
  a long string, overflows a `Math.max(...)` in the inbox and blanks the list;
- a `created_at` that is not a number scrambles the inbox order;
- deleting a tip from a page opened earlier also deletes follow-ups that
  arrived since, unseen (archiving re-reads first; deleting does not);
- a follow-up whose write landed but whose reply was lost is stored a second
  time as a new tip.

The cure is structural rather than one key at a time: strict shapes for what
an anonymous writer may store (scalar extra fields, a fixed shape for
object-form messages, `followUps` an object), each tip rendered inside its own
try/catch so one bad record is one bad card, and the staff pages reading over
REST with the admin's token instead of through `snapshot.val()`. Before
tightening the message shape, confirm how the oldest app versions send tips
(see Deferred).

If the index ever refuses an entry the intake believes is valid (rules and code
out of step), the intake stores the tip anyway, without the entry: the tipster
gets a PIN, the admin sees the tip, and only threading by that PIN is lost.
Deploy the code before these rules: the generator that only draws mixed PINs
has to be live first, or about one tip in six would need a retry.

Rules and atomicity are covered by emulator tests
(`test/rules/tip-pins.test.mjs`). Follow-ups hang off the tip itself
(`/messages/$tipId/followUps`), reached through the PIN. When reward status
lands it must keep this shape: a guessed PIN may add to a tip or read a status
word, never read tip content.

## Police tips

`/policeTips/$tipId` is an admin-curated **copy** of a forwarded tip: its
ciphertext verbatim, the PIN, an optional encrypted note to officers, and only
the follow-ups an admin has shared. Officers read this node and nothing else —
never `/messages`. A Realtime Database read covers everything beneath a node,
so granting police a read on the original tip would also hand them every
follow-up the tipster sends afterwards, reviewed or not. Forwarding copies
what exists at that moment; later follow-ups stay admin-only until shared one
by one. Withdrawing deletes the copy, and deleting a tip removes its copy too.
`forwarded_by` must equal the writer's uid, so a forward is always attributable.
A copy is create-or-delete only — it cannot be overwritten, and a follow-up can
be shared once — so one admin can never silently replace another's forward; to
change a copy, withdraw it and forward again. The inbox lists any copy whose
original tip is gone as a leftover to withdraw.

## Archive

Two different mechanics, on purpose.

**Tips are archived in place.** `/messages/$tipId/archive → { at, by, remarks }`
marks a tip archived (remarks encrypted like a police note; `by` must be the
writer's uid), and `/messages/$tipId/archiveLog/$id` keeps every archive and
restore as append-only history. The tip is never moved because the public
intake must still be able to append a follow-up to it by PIN. The intake
cannot touch the archive mark (the validators require an admin), so
**"reopened" is derived, not stored**: a follow-up newer than `archive.at`
puts the tip back in the inbox, flagged, until an admin archives it again.
Archiving also withdraws the police copy; the Archive page flags any copy that
is somehow still there. Restore clears the mark and logs it.

**Wanted and missing persons are moved.** Archiving is one multi-path update
that writes `/archive/wanteds|missings/$id → { …record, archived: { at, by,
remarks } }` and removes the public record — whole or not at all. `/archive`
is admin-only, which is what takes the person off the public site, the police
portal and every installed app at once (the app lists people through
`/api/wanted` and `/api/missing`, which read the public nodes). The picture
stays in Storage; restore writes the stripped record back under the same id.
The public nodes refuse `archived` and `archiveLog` outright, so remarks can
never leak onto them even from a buggy client.

Rules for both are covered by `test/rules/archive.test.mjs`; the derived
status by `test/unit/archive.test.mts`. Deploy the rules before the code that
uses them. Against the old rules a *person* archive fails cleanly (no
`/archive` node, and the move is atomic); a *tip* archive would still write
(the tip node never had `$other: false`) but without the new validators —
and until they land, an anonymous submitter could hide a new tip from the
inbox by including an `archive` node in it. Timestamps in the archive mark
are the database server's (`serverTimestamp()`), never the browser's, since
"reopened" is decided by comparing them with intake times — and for the same
reason a follow-up's `created_at` must sit within five minutes of the
database clock (`now` in the rules), so a PIN holder writing to the database
directly cannot forge a stamp that holds a tip open or buries a message.
Archiving re-reads the tip and refuses if a follow-up arrived after the
admin's page loaded, so nothing is archived unread. The history under
`archiveLog` is append-only against the app's own writes; an admin acting on
the raw database can still rewrite it, as with everything else under a tip.

## Tip type and source

Every tip can carry three more fields beside its ciphertext:

- `category`: the type of crime, an id from `src/lib/tipCategories.ts`
  (`auto_theft`, `homicide`, `other`, ...). Stored **in the clear** on purpose,
  so tips can be counted by type without decrypting any of them.
- `category_other`: what the tipster typed when the type is `other`. Their own
  words, so it is **encrypted** like the tip.
- `source`: how the tip reached us. `text` is the app's "Text a Tip", `web` is
  the public form at `/submit-tip`, `call` is a tip phoned in and typed up by
  an admin on the Tip Messages page.

`created_at` (milliseconds, the server's clock) is the date and time of every
tip and every follow-up; it is set by the intake route, never by the client.

All three go through the one intake route, `/api/message`. The route is
deliberately forgiving about the label: a missing or unrecognised category is
dropped rather than refused, because app versions released before the list
existed send none, and a tip must never be lost over its label. The forms are
what make the choice compulsory. A post with no `source` comes from such an app
version and is stored as `text`. Tips stored before this change have no
`source` at all and are shown as "not recorded" rather than guessed at (the
website has had a tip form before). If the database turns a tip down with its
labels, the route stores it again without them. Follow-ups keep their bare
shape and join the tip they quote; they do not change its type or source.

`call` is the one value that means something about who wrote the tip, so it is
held at both layers. The route accepts it only with an admin's ID token, and
then writes the **new tip** through the database's REST API **as that admin**
(`src/lib/rtdbRest.ts`), because the server has no identity of its own. The
rules accept `source: 'call'` only from an admin, so nobody can mark a tip as a
call by writing to the database directly. Because that write is an admin's, the
create-only rule on `/tipPins/$pin` does not protect it; the route's own check
that a PIN is unused does, and a clash is one in some 739 million.

The admin's token is used for nothing else. **Follow-ups are always written
anonymously**, whoever typed them, because the path of a follow-up comes from
`/tipPins`, which anyone can add to: an admin-privileged write aimed by public
data could land anywhere under `/messages`. Written anonymously, the rules
confine it to creating one follow-up. For the same reason the route only
follows a `/tipPins` entry whose `tipId` is shaped like a database key, and the
rules now refuse any other shape (an id with a dot once made the route throw
before storing the tip; one with a slash could aim a write elsewhere). Ordinary
words can no longer be registered as PINs at all: see "Who may add to the
index" under Tip PINs.

**Length.** The route accepts 10,000 characters of tip; what is stored is the
ciphertext, which is up to four times longer for non-Latin text (40,044
characters at worst). The four message limits in the rules (tip, follow-up, and
both on the police copy) are 41,000 and must stay equal, or a tip could be
stored that cannot be forwarded. They were 10,000, which silently refused any
tip over about 7,470 characters.

The police copy (`/policeTips/$tipId`) may carry the same three fields, copied
verbatim when an admin forwards a tip, so officers see the type and the source.
That node refuses unknown fields, so **deploy the rules before the code**:
against the old rules a forward of a labelled tip would be refused. The reverse
order is safe for tips themselves (the tip node never refused extra fields).

The app loads the list from `/api/tip-categories` and falls back to a copy
bundled in the app, so the list can change with a website deploy alone. Never
change or reuse an id: counts are kept by id. Rename by changing the label;
retire by removing the entry (tips already filed under it still show).

The tip form never runs Google Analytics (`src/lib/analyticsPolicy.ts`).
Analytics is started once per document and then follows client-side
navigation, so three things keep the form out of any document where it runs:
every link to the form is a full page load (a unit test fails if a client-side
one is added), every same-site link on the form leaves by a full page load, and
a tab that has shown the form is marked in sessionStorage so nothing loaded in
it later starts Analytics (reload, then Back, would otherwise defeat the first
two). Auth is initialised without Firebase's popup/redirect support
(`src/lib/firebase.ts`): with it, phones and Safari load a script from
apis.google.com and a hidden iframe on every page, for every visitor. Sign-in
is by email and password only; if a Google or other popup sign-in is ever
added, it must not bring that back onto the tip form. Rules are covered by
`test/rules/tip-categories.test.mjs`, the helpers by
`test/unit/tip-categories.test.mts`.
