import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { StorageModule } from "./modules/storage/storage.module";
import { UsersModule } from "./modules/users/users.module";
import { PrismaModule } from "./prisma/prisma.module";

/** Root module — feature modules are registered here as they come online. */
@Module({
  imports: [PrismaModule, AuthModule, UsersModule, HealthModule, StorageModule, ReportsModule],
})
export class AppModule {}
