# Crack Crime Bahamas

A community crime-fighting platform for the Bahamas. Citizens can view wanted
and missing persons and submit **anonymous, encrypted tips**; administrators
manage those listings and push notifications to the companion mobile app.

This repo is the **Next.js web app** (public site + admin dashboard + API
routes). There is a separate React Native / Expo mobile app published on Google
Play (`com.anonymous.CrackCrimeBahamas`).

## Tech stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript**
- **Tailwind CSS** + **NextUI** — bright amber "liquid glass" theme
- **Firebase** — Realtime Database, Auth, Storage
- **Expo Server SDK** — push notifications to the mobile app
- **crypto-es** — AES encryption of anonymous tips

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env` and fill in the values before running:

```bash
cp .env.example .env
```

- `NEXT_PUBLIC_*` — Firebase web config (safe to expose; protected by security rules)
- `EXPO_ACCESS_TOKEN`, `GOOGLE_MAPS_API_KEY` — **server-only** secrets (no `NEXT_PUBLIC_` prefix)
- `INVITE_CODE` — required to register a new admin at `/sign-up`
- `TIP_ENCRYPTION_KEY` — AES key for tips; must match the mobile app

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Routes

**Public**

- `/` — landing page
- `/wanted`, `/missing` — searchable galleries of listed persons
- `/submit-tip` — anonymous, server-encrypted tip form
- `/contact` — hotline (**328-TIPS**), email, office
- `/member` — sponsorship registration
- `/more-about-us`, `/legal/privacy`, `/legal/terms`

**Admin** (`/admin/*`, behind Firebase Auth + an `/admins` allowlist)

- Dashboard, wanted, missing, tip messages, notifications, advertisements, profile

**API** (`/api/*`) — tip intake (encrypts server-side), membership, device
registration, geocoding, and admin-gated push notifications.

## Architecture notes

- **Anonymous tips** are AES-encrypted (server-side on web intake) and stored
  in Realtime DB; the admin inbox decrypts them.
- **Admin authority** comes from an allowlist at `/admins/{uid}` in the
  database, not merely from having an account. The `/admin` layout guard is UX;
  the deployed database/storage rules are the real boundary.
- **Security rules** live in [`database.rules.json`](database.rules.json) and
  [`storage.rules`](storage.rules). Deploying them is a manual, ordered
  step — see [`FIREBASE_ROLLOUT.md`](FIREBASE_ROLLOUT.md).

## Deployment

Deployed on **Vercel**. Set the same environment variables in the Vercel
project settings, and deploy the Firebase rules separately following
[`FIREBASE_ROLLOUT.md`](FIREBASE_ROLLOUT.md).
