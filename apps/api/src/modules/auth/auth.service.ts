import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { DecodedIdToken } from "firebase-admin/auth";
import { PrismaService } from "../../prisma/prisma.service";

/** Provisions the local User for a verified Firebase identity (plan §10). */
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent: creates the User on first sign-in; afterwards only re-syncs
   * the email (Firebase owns identity — profile fields belong to PATCH /v1/me).
   */
  async provisionUser(token: DecodedIdToken): Promise<User> {
    const email = token.email;
    if (!email) {
      throw new UnauthorizedException({
        code: "email_required",
        message: "The Firebase account has no email address",
      });
    }

    const user = await this.prisma.user.upsert({
      where: { firebaseUid: token.uid },
      create: { firebaseUid: token.uid, email, name: this.initialName(token.name, email) },
      update: { email },
    });

    if (user.deletedAt) {
      throw new ForbiddenException({
        code: "account_deleted",
        message: "This account has been deleted",
      });
    }

    return user;
  }

  /** Google sign-ins carry a display name; email/password sign-ups fall back to the email local part. */
  private initialName(tokenName: unknown, email: string): string {
    if (typeof tokenName === "string" && tokenName.trim()) return tokenName.trim();
    return email.split("@")[0] ?? email;
  }
}
