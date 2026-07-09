import { Module } from "@nestjs/common";
import { JobsModule } from "../jobs/jobs.module";
import { StorageModule } from "../storage/storage.module";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

/** Report upload + recent uploads listing (plan Fase 4, §11.3). */
@Module({
  imports: [StorageModule, JobsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
