import { Body, Controller, Get, Patch } from "@nestjs/common";
import { updateUserProfileSchema, type UpdateUserProfile, type UserProfile } from "@biox/shared";
import type { User } from "@prisma/client";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser } from "../auth/auth.decorators";
import { UsersService } from "./users.service";
import { toUserProfile } from "./user-profile.mapper";

@Controller("me")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /v1/me — profile + settings of the signed-in user. */
  @Get()
  getMe(@CurrentUser() user: User): UserProfile {
    return toUserProfile(user);
  }

  /** PATCH /v1/me — name, dob, sexAtBirth, flagBorderline, aiProcessingConsent. */
  @Patch()
  async updateMe(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(updateUserProfileSchema)) patch: UpdateUserProfile,
  ): Promise<UserProfile> {
    return toUserProfile(await this.usersService.updateProfile(user.id, patch));
  }
}
