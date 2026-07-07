import type { User } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { toUserProfile } from "./user-profile.mapper";

const user: User = {
  id: "user-1",
  firebaseUid: "uid-1",
  email: "marina@example.com",
  name: "Marina Alves",
  dateOfBirth: new Date("1991-05-12T00:00:00Z"),
  sexAtBirth: "female",
  aiProcessingConsent: true,
  flagBorderline: true,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  deletedAt: null,
  purgeScheduledAt: null,
};

describe("toUserProfile", () => {
  it("maps the contract fields and formats dateOfBirth as YYYY-MM-DD", () => {
    expect(toUserProfile(user)).toEqual({
      id: "user-1",
      name: "Marina Alves",
      email: "marina@example.com",
      dateOfBirth: "1991-05-12",
      sexAtBirth: "female",
      flagBorderline: true,
      aiProcessingConsent: true,
    });
  });

  it("keeps dateOfBirth null when not provided", () => {
    expect(toUserProfile({ ...user, dateOfBirth: null }).dateOfBirth).toBeNull();
  });

  it("never leaks internal fields (firebaseUid, deletedAt, purgeScheduledAt)", () => {
    const profile = toUserProfile(user) as Record<string, unknown>;
    expect(profile).not.toHaveProperty("firebaseUid");
    expect(profile).not.toHaveProperty("deletedAt");
    expect(profile).not.toHaveProperty("purgeScheduledAt");
  });
});
