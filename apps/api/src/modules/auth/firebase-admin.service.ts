import { Injectable } from "@nestjs/common";
import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type DecodedIdToken, getAuth } from "firebase-admin/auth";
import { FirebaseAdminConfigError } from "./firebase-admin.errors";

/**
 * Thin wrapper around the Firebase Admin SDK. Initialized lazily so the API
 * boots without credentials (public endpoints keep working locally); the
 * first authenticated request fails loudly if the env is incomplete.
 */
@Injectable()
export class FirebaseAdminService {
  private app: App | null = null;

  verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return getAuth(this.getApp()).verifyIdToken(idToken);
  }

  private getApp(): App {
    if (this.app) return this.app;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // .env stores the service-account key single-line with literal "\n".
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) {
      throw new FirebaseAdminConfigError();
    }

    this.app =
      getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return this.app;
  }
}
