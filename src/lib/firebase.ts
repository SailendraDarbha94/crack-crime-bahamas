import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  connectAuthEmulator,
  type Auth,
} from 'firebase/auth';
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { analyticsMayStart } from "./analyticsPolicy";

// Firebase configuration. Exported so the Team page can open a second,
// short-lived app instance to create officer accounts without signing the
// admin out (there is no firebase-admin SDK in this project).
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID
};

// Local development only: point Auth at the Firebase emulator. Never set in
// production. The database is redirected by pointing NEXT_PUBLIC_DATABASE_URL
// at the emulator instead, so both are opt-in from the environment alone.
const AUTH_EMULATOR_HOST = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST;

export function connectAuthEmulatorIfConfigured(instance: Auth): void {
  if (!AUTH_EMULATOR_HOST) return;
  // connectAuthEmulator throws if called twice on the same instance (HMR).
  if ((instance as any).__emulatorConnected) return;
  connectAuthEmulator(instance, `http://${AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  (instance as any).__emulatorConnected = true;
}

// Initialize Firebase app (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// In the browser, Auth is set up WITHOUT Firebase's popup/redirect sign-in
// support. getAuth() would include it, and on phones and in Safari that support
// loads a script from apis.google.com and a hidden Firebase iframe on every
// page, for every visitor, signed in or not: including someone opening the tip
// form. Sign-in here is by email and password only, which needs none of it.
// The persistence list is the one getAuth() itself uses, so existing sessions
// carry over. Later getAuth(app) calls anywhere return this same instance.
const createAuth = (): Auth => {
  if (typeof window === 'undefined') return getAuth(app);
  try {
    return initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
    });
  } catch {
    return getAuth(app); // already initialised for this app (Fast Refresh)
  }
};

// Initialize Firebase services
export const auth = createAuth();
connectAuthEmulatorIfConfigured(auth);
export const database = getDatabase(app);
export const storage = getStorage(app);

// The tab's sessionStorage, or null where the browser refuses access to it.
const tabStorage = (): Storage | null => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

// Initialize Analytics only on client side and if supported, and never on the
// tip form or in a tab that has shown it (see analyticsPolicy.ts). Decided
// once per page load. The check runs even under the emulator so the tab is
// marked the same way in development.
export const analytics =
  typeof window !== 'undefined' && analyticsMayStart(window.location.pathname, tabStorage()) && !AUTH_EMULATOR_HOST ?
  isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

// Set auth persistence
if (typeof window !== 'undefined') {
  auth.setPersistence(browserLocalPersistence);
}

export default app;
