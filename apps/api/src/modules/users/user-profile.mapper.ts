import type { UserProfile } from "@biox/shared";
import type { User } from "@prisma/client";

/** Prisma User → UserProfile contract (the GET /v1/me shape, plan §10). */
export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
    sexAtBirth: user.sexAtBirth,
    flagBorderline: user.flagBorderline,
    aiProcessingConsent: user.aiProcessingConsent,
  };
}
