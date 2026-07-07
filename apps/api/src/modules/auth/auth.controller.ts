import { Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import type { UserProfile } from "@biox/shared";
import type { DecodedIdToken } from "firebase-admin/auth";
import { toUserProfile } from "../users/user-profile.mapper";
import { AllowUnprovisioned, FirebaseToken } from "./auth.decorators";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /v1/auth/session — exchanges a Firebase ID token for the provisioned local User. */
  @Post("session")
  @HttpCode(HttpStatus.OK)
  @AllowUnprovisioned()
  async createSession(@FirebaseToken() token: DecodedIdToken): Promise<UserProfile> {
    const user = await this.authService.provisionUser(token);
    return toUserProfile(user);
  }
}
