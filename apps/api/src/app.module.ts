import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module";

/** Root module — feature modules are registered here as they come online. */
@Module({
  imports: [HealthModule],
})
export class AppModule {}
