import { ForbiddenException, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../prisma/prisma.service";
import { IS_PUBLIC_KEY } from "./auth.decorators";
import type { AuthenticatedRequest } from "./authenticated-request";
import { FirebaseAdminConfigError } from "./firebase-admin.errors";
import type { FirebaseAdminService } from "./firebase-admin.service";
import { FirebaseAuthGuard } from "./firebase-auth.guard";

interface RouteFlags {
  isPublic?: boolean;
  allowUnprovisioned?: boolean;
}

function contextFor(request: Partial<AuthenticatedRequest>, flags: RouteFlags = {}) {
  const reflector = {
    getAllAndOverride: vi.fn((key: string) =>
      key === IS_PUBLIC_KEY ? (flags.isPublic ?? false) : (flags.allowUnprovisioned ?? false),
    ),
  } as unknown as Reflector;

  const context = {
    getHandler: () => vi.fn(),
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { reflector, context };
}

async function errorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    const payload = (error as { getResponse(): { code?: string } }).getResponse();
    return payload.code;
  }
}

describe("FirebaseAuthGuard", () => {
  const verifyIdToken = vi.fn();
  const firebaseAdmin = { verifyIdToken } as unknown as FirebaseAdminService;
  const findUnique = vi.fn();
  const prisma = { user: { findUnique } } as unknown as PrismaService;
  const activeUser = { id: "user-1", firebaseUid: "uid-1", deletedAt: null } as User;

  beforeEach(() => {
    verifyIdToken.mockReset();
    verifyIdToken.mockResolvedValue({ uid: "uid-1" });
    findUnique.mockReset();
    findUnique.mockResolvedValue(activeUser);
  });

  function guardFor(request: Partial<AuthenticatedRequest>, flags: RouteFlags = {}) {
    const { reflector, context } = contextFor(request, flags);
    return { guard: new FirebaseAuthGuard(reflector, firebaseAdmin, prisma), context };
  }

  it("lets @Public routes through without touching Firebase", async () => {
    const { guard, context } = guardFor({ headers: {} } as AuthenticatedRequest, {
      isPublic: true,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it("rejects a request without a Bearer token", async () => {
    const { guard, context } = guardFor({ headers: {} } as AuthenticatedRequest);

    await expect(errorCode(guard.canActivate(context))).resolves.toBe("missing_token");
  });

  it("rejects an invalid or expired token", async () => {
    verifyIdToken.mockRejectedValue(new Error("expired"));
    const request = { headers: { authorization: "Bearer bad" } } as AuthenticatedRequest;
    const { guard, context } = guardFor(request);

    await expect(errorCode(guard.canActivate(context))).resolves.toBe("invalid_token");
  });

  it("surfaces a missing Firebase config as a server error, not a 401", async () => {
    verifyIdToken.mockRejectedValue(new FirebaseAdminConfigError());
    const request = { headers: { authorization: "Bearer good" } } as AuthenticatedRequest;
    const { guard, context } = guardFor(request);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(FirebaseAdminConfigError);
  });

  it("attaches the token and the provisioned user to the request", async () => {
    const request = { headers: { authorization: "Bearer good" } } as AuthenticatedRequest;
    const { guard, context } = guardFor(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.firebaseToken).toEqual({ uid: "uid-1" });
    expect(request.user).toBe(activeUser);
  });

  it("rejects a valid token whose user was never provisioned", async () => {
    findUnique.mockResolvedValue(null);
    const request = { headers: { authorization: "Bearer good" } } as AuthenticatedRequest;
    const { guard, context } = guardFor(request);

    const rejection = guard.canActivate(context);
    await expect(rejection).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a soft-deleted user", async () => {
    findUnique.mockResolvedValue({ ...activeUser, deletedAt: new Date() });
    const request = { headers: { authorization: "Bearer good" } } as AuthenticatedRequest;
    const { guard, context } = guardFor(request);

    const rejection = guard.canActivate(context);
    await expect(rejection).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("lets @AllowUnprovisioned routes through without a local user", async () => {
    findUnique.mockResolvedValue(null);
    const request = { headers: { authorization: "Bearer good" } } as AuthenticatedRequest;
    const { guard, context } = guardFor(request, { allowUnprovisioned: true });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.firebaseToken).toEqual({ uid: "uid-1" });
    expect(request.user).toBeUndefined();
  });
});
