import { Module } from "@nestjs/common";
import { ExtractionsController } from "./extractions.controller";
import { ExtractionsService } from "./extractions.service";

/** Extraction review: read, correct, discard (plan Fase 4, §11.3). Confirm lands with the score engine. */
@Module({
  controllers: [ExtractionsController],
  providers: [ExtractionsService],
})
export class ExtractionsModule {}
