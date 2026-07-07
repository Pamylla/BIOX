import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { FirebaseAdminService } from "./firebase-admin.service";
import { FirebaseAuthGuard } from "./firebase-auth.guard";

/**
 * Firebase auth (plan Fase 3): registers FirebaseAuthGuard globally, so every
 * route is authenticated by default — opt out per route with @Public.
 */
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    FirebaseAdminService,
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
  ],
  exports: [FirebaseAdminService],
})
export class AuthModule {}
