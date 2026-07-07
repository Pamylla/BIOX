/** Missing env credentials — a server misconfiguration, never a client error. */
export class FirebaseAdminConfigError extends Error {
  constructor() {
    super(
      "Firebase Admin is not configured: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY",
    );
    this.name = "FirebaseAdminConfigError";
  }
}
