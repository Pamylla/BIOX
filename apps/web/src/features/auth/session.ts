import type { UserProfile } from "@biox/shared/contracts";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/v1";

/**
 * Exchanges a verified Firebase ID token for the provisioned local User
 * (POST /v1/auth/session — idempotent, creates the row on first sign-in).
 */
export async function createSession(idToken: string): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/auth/session`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) {
    throw new Error(`Could not establish a BIOX session (API returned ${response.status})`);
  }
  return (await response.json()) as UserProfile;
}
