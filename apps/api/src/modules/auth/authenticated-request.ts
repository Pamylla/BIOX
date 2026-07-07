import type { User } from "@prisma/client";
import type { Request } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";

/** Express request augmented by FirebaseAuthGuard. */
export interface AuthenticatedRequest extends Request {
  /** Verified Firebase ID token — present on every authenticated route. */
  firebaseToken?: DecodedIdToken;
  /** Provisioned local user — present unless the route is @AllowUnprovisioned. */
  user?: User;
}
