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
