import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { ALLOW_UNPROVISIONED_KEY, IS_PUBLIC_KEY } from "./auth.decorators";
import type { AuthenticatedRequest } from "./authenticated-request";
import { FirebaseAdminConfigError } from "./firebase-admin.errors";
import { FirebaseAdminService } from "./firebase-admin.service";

/**
 * Global guard (plan §10): every route requires
 * `Authorization: Bearer <Firebase ID token>` unless marked @Public.
 * The local User must already be provisioned (POST /v1/auth/session),
 * except on @AllowUnprovisioned routes.
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.hasFlag(context, IS_PUBLIC_KEY)) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const idToken = this.extractBearerToken(request);
    if (!idToken) {
      throw new UnauthorizedException({
        code: "missing_token",
        message: "Authorization: Bearer <Firebase ID token> is required",
      });
    }

    try {
      request.firebaseToken = await this.firebaseAdmin.verifyIdToken(idToken);
    } catch (error) {
      // A missing service account is our fault, not the caller's — surface a 500.
      if (error instanceof FirebaseAdminConfigError) throw error;
      throw new UnauthorizedException({
        code: "invalid_token",
        message: "Firebase ID token is invalid or expired",
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { firebaseUid: request.firebaseToken.uid },
    });
    if (user && !user.deletedAt) request.user = user;

    if (!this.hasFlag(context, ALLOW_UNPROVISIONED_KEY)) {
      if (user?.deletedAt) {
        throw new ForbiddenException({
          code: "account_deleted",
          message: "This account has been deleted",
        });
      }
      if (!user) {
        throw new UnauthorizedException({
          code: "user_not_provisioned",
          message: "Call POST /v1/auth/session to provision this account",
        });
      }
    }

    return true;
  }

  private hasFlag(context: ExecutionContext, metadataKey: string): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(metadataKey, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    );
  }

  private extractBearerToken(request: AuthenticatedRequest): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) return undefined;
    const token = header.slice("Bearer ".length).trim();
    return token || undefined;
  }
}
