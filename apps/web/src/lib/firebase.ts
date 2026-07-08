import { getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";

/**
 * Lazy so the app boots without Firebase env (e.g. /playground): the error
 * only surfaces when auth is actually exercised, with a clear message.
 */
export function getFirebaseAuth(): Auth {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!apiKey || !authDomain || !projectId) {
    throw new Error(
      "Firebase is not configured: set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN and VITE_FIREBASE_PROJECT_ID in apps/web/.env",
    );
  }

  const app = getApps()[0] ?? initializeApp({ apiKey, authDomain, projectId });
  return getAuth(app);
}
