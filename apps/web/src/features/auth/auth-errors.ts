import { FirebaseError } from "firebase/app";

/**
 * Firebase error codes → calm, human copy. Returns null for user-cancelled
 * flows (closing the Google popup is not an error worth showing).
 */
export function describeSignInError(error: unknown): string | null {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts — try again in a few minutes.";
      case "auth/network-request-failed":
        return "Network error — check your connection and try again.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return null;
    }
  }
  return error instanceof Error ? error.message : "Sign-in failed. Try again.";
}
