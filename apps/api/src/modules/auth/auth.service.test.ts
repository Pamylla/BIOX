import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../prisma/prisma.service";
import { AuthService } from "./auth.service";

function decodedToken(overrides: Partial<DecodedIdToken> = {}): DecodedIdToken {
  return { uid: "firebase-uid-1", email: "marina@example.com", ...overrides } as DecodedIdToken;
}

function userRow(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    firebaseUid: "firebase-uid-1",
    email: "marina@example.com",
    name: "Marina Alves",
    dateOfBirth: null,
    sexAtBirth: null,
    aiProcessingConsent: true,
    flagBorderline: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    deletedAt: null,
    purgeScheduledAt: null,
    ...overrides,
  };
}

describe("AuthService.provisionUser", () => {
  const upsert = vi.fn();
  const prisma = { user: { upsert } } as unknown as PrismaService;
  const service = new AuthService(prisma);

  beforeEach(() => {
    upsert.mockReset();
    upsert.mockResolvedValue(userRow());
  });

  it("provisions with the Firebase display name on first sign-in", async () => {
    await service.provisionUser(decodedToken({ name: "  Marina Alves  " }));

    expect(upsert).toHaveBeenCalledWith({
      where: { firebaseUid: "firebase-uid-1" },
      create: {
        firebaseUid: "firebase-uid-1",
        email: "marina@example.com",
        name: "Marina Alves",
      },
      update: { email: "marina@example.com" },
    });
  });

  it("falls back to the email local part when the token has no name", async () => {
    await service.provisionUser(decodedToken());

    const createArg = upsert.mock.calls[0]?.[0]?.create;
    expect(createArg?.name).toBe("marina");
  });

  it("returns the upserted user", async () => {
    const user = await service.provisionUser(decodedToken());
    expect(user).toEqual(userRow());
  });

  it("rejects a token without email", async () => {
    await expect(service.provisionUser(decodedToken({ email: undefined }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a soft-deleted account", async () => {
    upsert.mockResolvedValue(userRow({ deletedAt: new Date() }));

    await expect(service.provisionUser(decodedToken())).rejects.toBeInstanceOf(ForbiddenException);
  });
});
