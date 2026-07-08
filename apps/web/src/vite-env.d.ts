/// <reference types="vite/client" />

// Merges with vite/client's ImportMetaEnv — keeps import.meta.env strongly typed.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
}
