import { createParamDecorator, type ExecutionContext, SetMetadata } from "@nestjs/common";
import type { AuthenticatedRequest } from "./authenticated-request";

export const IS_PUBLIC_KEY = "biox:isPublic";
/** Skips authentication entirely (e.g. GET /v1/health). */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

export const ALLOW_UNPROVISIONED_KEY = "biox:allowUnprovisioned";
/**
 * Requires a valid Firebase ID token but not a local User row. Only
 * POST /v1/auth/session should use this — it is where provisioning happens.
 */
export const AllowUnprovisioned = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ALLOW_UNPROVISIONED_KEY, true);

/** The provisioned local User attached by FirebaseAuthGuard. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
});

/** The decoded Firebase ID token attached by FirebaseAuthGuard. */
export const FirebaseToken = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.firebaseToken;
});
