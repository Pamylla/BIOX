import { Module } from "@nestjs/common";
import { JobsModule } from "../jobs/jobs.module";
import { StorageModule } from "../storage/storage.module";
import { ExtractionWorker } from "./extraction.worker";
import { ExtractorModule } from "./extractor/extractor.module";
import { ExtractionsController } from "./extractions.controller";
import { ExtractionsService } from "./extractions.service";

/**
 * Extraction pipeline (plan Fase 4, §11.3): the `extraction.run` worker
 * (download → LLM extract → validate → normalize → persist for review) plus the
 * review API (read, correct, discard). Confirm lands with the score engine.
 */
@Module({
  imports: [StorageModule, JobsModule, ExtractorModule],
  controllers: [ExtractionsController],
  providers: [ExtractionsService, ExtractionWorker],
})
export class ExtractionsModule {}
