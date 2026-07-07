import { Injectable } from "@nestjs/common";
import type { UpdateUserProfile } from "@biox/shared";
import type { Prisma, User } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

/** Profile reads/updates for the signed-in user (PATCH /v1/me, plan §10). */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Applies only the fields present in the patch; null clears nullable fields. */
  async updateProfile(userId: string, patch: UpdateUserProfile): Promise<User> {
    const data: Prisma.UserUpdateInput = {};
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.dateOfBirth !== undefined) {
      data.dateOfBirth = patch.dateOfBirth ? new Date(`${patch.dateOfBirth}T00:00:00.000Z`) : null;
    }
    if (patch.sexAtBirth !== undefined) data.sexAtBirth = patch.sexAtBirth;
    if (patch.flagBorderline !== undefined) data.flagBorderline = patch.flagBorderline;
    if (patch.aiProcessingConsent !== undefined)
      data.aiProcessingConsent = patch.aiProcessingConsent;

    if (Object.keys(data).length === 0) {
      return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    }
    return this.prisma.user.update({ where: { id: userId }, data });
  }
}
