import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

/** Signed-in user profile: GET/PATCH /v1/me (plan Fase 3). */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
