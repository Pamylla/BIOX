import { biomarkerCatalog, extractorOutputSchema } from "@biox/shared";
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { ExtractionStatus, type Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { JobQueuePort } from "../jobs/job-queue.port";
import { StoragePort } from "../storage/storage.port";
import { toExtractionItemData } from "./extraction-item.factory";
import { ExtractorError } from "./extractor/extractor.errors";
import { type ExtractorResult, ExtractorPort } from "./extractor/extractor.port";

/**
 * The extraction worker — the in-process consumer of `extraction.run` and the
 * heart of the ingestion pipeline (plan §11.3, steps 1–8). For one queued
 * extraction it: downloads the PDF, runs the LLM extractor, validates the
 * output against the shared zod schema, normalizes each marker in code
 * (Brazilian numbers, catalog aliases, plausibility), and persists an
 * Extraction ready for human review — atomically.
 *
 * Failure policy: any error is caught, recorded on the Extraction as `failed`
 * (with the raw model output kept for debugging when we got that far), and
 * swallowed. The handler never rejects, so pg-boss never auto-requeues — the
 * review UI offers a manual retry instead (§11.3 step 8).
 */
@Injectable()
export class ExtractionWorker implements OnModuleInit {
  private readonly logger = new Logger(ExtractionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StoragePort,
    private readonly extractor: ExtractorPort,
    private readonly jobQueue: JobQueuePort,
  ) {}

  onModuleInit(): void {
    this.jobQueue.subscribe("extraction.run", (payload) => this.run(payload.extractionId));
  }

  /** Process one queued extraction end to end. Resolves even on failure (see class doc). */
  async run(extractionId: string): Promise<void> {
    const extraction = await this.prisma.extraction.findUnique({
      where: { id: extractionId },
      include: { reportFile: { select: { storageKey: true } } },
    });
    if (!extraction) {
      this.logger.warn(`extraction.run for unknown extraction ${extractionId} — skipping`);
      return;
    }
    // Only a freshly-queued extraction is ours to process. A redelivered job for
    // one already reviewed, confirmed, discarded, or failed must not re-run and
    // clobber that state — the pipeline retries are manual.
    if (extraction.status !== ExtractionStatus.processing) {
      this.logger.warn(
        `extraction.run for ${extractionId} in status "${extraction.status}" — skipping`,
      );
      return;
    }

    let rawOutput: Prisma.InputJsonValue | undefined;
    try {
      const pdf = await this.storage.get(extraction.reportFile.storageKey);
      const result = await this.extractor.extract(pdf);
      rawOutput = result.output as Prisma.InputJsonValue;

      const validation = extractorOutputSchema.safeParse(result.output);
      if (!validation.success) {
        const issue = validation.error.issues[0];
        const at = issue?.path.join(".") || "output";
        throw new ExtractorError(
          `Extractor output failed schema validation at "${at}": ${issue?.message ?? "unknown error"}`,
        );
      }

      const items = validation.data.items.map((item) =>
        toExtractionItemData(item, biomarkerCatalog),
      );
      await this.persistForReview(extractionId, result, validation.data, items);
      this.logger.log(`Extraction ${extractionId} ready for review (${items.length} items)`);
    } catch (error) {
      await this.markFailed(extractionId, error, rawOutput);
    }
  }

  /** Atomically move the extraction to needs_review with its items and audit trail. */
  private async persistForReview(
    extractionId: string,
    result: ExtractorResult,
    output: ReturnType<typeof extractorOutputSchema.parse>,
    items: Prisma.ExtractionItemCreateManyExtractionInput[],
  ): Promise<void> {
    await this.prisma.extraction.update({
      where: { id: extractionId },
      data: {
        status: ExtractionStatus.needs_review,
        model: result.model,
        promptVersion: result.promptVersion,
        rawOutput: result.output as Prisma.InputJsonValue,
        reportDate: output.collectionDate ? new Date(output.collectionDate) : null,
        performingLab: output.labName,
        items: { createMany: { data: items } },
      },
    });
  }

  /** Record the failure so the review UI can show it and offer a manual retry. */
  private async markFailed(
    extractionId: string,
    error: unknown,
    rawOutput: Prisma.InputJsonValue | undefined,
  ): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`Extraction ${extractionId} failed: ${message}`);
    try {
      await this.prisma.extraction.update({
        where: { id: extractionId },
        data: {
          status: ExtractionStatus.failed,
          error: message,
          // Keep what the model returned (when we got that far) for debugging.
          ...(rawOutput !== undefined ? { rawOutput } : {}),
        },
      });
    } catch (writeError) {
      // The status write itself failed (e.g. DB down). Nothing left to do but
      // log — the job still resolves so it isn't retried in a tight loop.
      this.logger.error(
        `Could not mark extraction ${extractionId} as failed: ${
          writeError instanceof Error ? writeError.message : String(writeError)
        }`,
      );
    }
  }
}
