import { z } from "zod";
import { sexAtBirthSchema } from "./enums";

/** GET /v1/me */
export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  /** ISO date (YYYY-MM-DD) or null when not provided. */
  dateOfBirth: z.string().nullable(),
  sexAtBirth: sexAtBirthSchema.nullable(),
  /** Toggle for the ±5% borderline watch flag (§11.1). */
  flagBorderline: z.boolean(),
  aiProcessingConsent: z.boolean(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

/**
 * PATCH /v1/me — every field optional; null clears a nullable field.
 * Email is owned by Firebase and never patched here (re-synced on session).
 */
export const updateUserProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    dateOfBirth: z.iso.date().nullable(),
    sexAtBirth: sexAtBirthSchema.nullable(),
    flagBorderline: z.boolean(),
    aiProcessingConsent: z.boolean(),
  })
  .partial();
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
