import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import type { ReportRow, UploadReportResponse } from "@biox/shared";
import { ExtractionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { JobQueuePort } from "../jobs/job-queue.port";
import { StoragePort } from "../storage/storage.port";
import { toReportRows } from "./report-row.mapper";

export const MAX_REPORT_PDF_BYTES = 20 * 1024 * 1024; // plan §12 Fase 4: PDF ≤ 20 MB

const PDF_MIMETYPE = "application/pdf";
const PDF_MAGIC = "%PDF-";

/** The slice of Express.Multer.File the upload needs — keeps tests multer-free. */
export interface UploadedReportFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Multer already enforces the size limit at the transport layer; re-checking
 * here keeps every acceptance rule (presence, type, size) in one visible,
 * testable place. Magic bytes beat mimetype alone — the browser derives the
 * mimetype from the filename, so a renamed .docx would sail through.
 */
function assertUploadableReport(file: UploadedReportFile | undefined): asserts file {
  if (!file) {
    throw new BadRequestException({
      code: "missing_file",
      message: 'Send the report PDF as the multipart field "file"',
    });
  }
  const startsWithPdfMagic =
    file.buffer.subarray(0, PDF_MAGIC.length).toString("latin1") === PDF_MAGIC;
  if (file.mimetype !== PDF_MIMETYPE || !startsWithPdfMagic) {
    throw new UnsupportedMediaTypeException({
      code: "invalid_file_type",
      message: "Only PDF reports are accepted",
    });
  }
  if (file.size > MAX_REPORT_PDF_BYTES) {
    throw new PayloadTooLargeException({
      code: "file_too_large",
      message: "Report PDF must be 20 MB or smaller",
    });
  }
}

/** Upload leg of the ingestion pipeline (plan §11.3): store the PDF, open an Extraction, queue the worker. */
@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StoragePort,
    private readonly jobQueue: JobQueuePort,
  ) {}

  async uploadReport(
    userId: string,
    file: UploadedReportFile | undefined,
  ): Promise<UploadReportResponse> {
    assertUploadableReport(file);

    const reportId = randomUUID();
    const storageKey = `reports/${userId}/${reportId}.pdf`;
    await this.storage.put(storageKey, file.buffer, PDF_MIMETYPE);

    const [, extraction] = await this.prisma.$transaction([
      this.prisma.reportFile.create({
        data: {
          id: reportId,
          userId,
          storageKey,
          filename: file.originalname,
          sizeBytes: file.size,
        },
      }),
      this.prisma.extraction.create({
        data: { reportFileId: reportId, userId, status: ExtractionStatus.processing },
      }),
    ]);

    try {
      await this.jobQueue.publish("extraction.run", { extractionId: extraction.id });
    } catch (error) {
      // The upload is safe on disk; surface the stuck extraction as failed so
      // the review UI offers the manual retry (plan §11.3 step 8).
      await this.prisma.extraction.update({
        where: { id: extraction.id },
        data: {
          status: ExtractionStatus.failed,
          error: `queue publish failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      });
      throw error;
    }

    return { reportId, extractionId: extraction.id, status: extraction.status };
  }

  /** Rows for the Upload screen's "Recent uploads" table, newest first. */
  async listReports(userId: string): Promise<ReportRow[]> {
    const files = await this.prisma.reportFile.findMany({
      where: { userId, deletedAt: null },
      orderBy: { uploadedAt: "desc" },
      include: { extraction: { include: { batch: { select: { sequence: true } } } } },
    });
    return toReportRows(files);
  }
}
