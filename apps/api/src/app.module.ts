import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./prisma/prisma.module";

/** Root module — feature modules are registered here as they come online. */
@Module({
  imports: [PrismaModule, HealthModule],
})
export class AppModule {}
