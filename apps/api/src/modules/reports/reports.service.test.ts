import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../prisma/prisma.service";
import type { JobQueuePort } from "../jobs/job-queue.port";
import type { StoragePort } from "../storage/storage.port";
import { MAX_REPORT_PDF_BYTES, ReportsService, type UploadedReportFile } from "./reports.service";

function pdfFile(overrides: Partial<UploadedReportFile> = {}): UploadedReportFile {
  return {
    originalname: "hemograma-fleury.pdf",
    mimetype: "application/pdf",
    size: 1234,
    buffer: Buffer.from("%PDF-1.7 fake body"),
    ...overrides,
  };
}

describe("ReportsService", () => {
  const reportFileCreate = vi.fn();
  const extractionCreate = vi.fn();
  const extractionUpdate = vi.fn();
  const findMany = vi.fn();
  const $transaction = vi.fn();
  const prisma = {
    reportFile: { create: reportFileCreate, findMany },
    extraction: { create: extractionCreate, update: extractionUpdate },
    $transaction,
  } as unknown as PrismaService;

  const put = vi.fn();
  const storage = { put } as unknown as StoragePort;

  const publish = vi.fn();
  const jobQueue = { publish } as unknown as JobQueuePort;

  const service = new ReportsService(prisma, storage, jobQueue);

  beforeEach(() => {
    vi.clearAllMocks();
    $transaction.mockResolvedValue([{}, { id: "ext-1", status: "processing" }]);
    put.mockResolvedValue(undefined);
    publish.mockResolvedValue(undefined);
  });

  describe("uploadReport", () => {
    it("stores the PDF, opens a processing extraction and queues the worker", async () => {
      const file = pdfFile();

      const response = await service.uploadReport("user-1", file);

      expect(put).toHaveBeenCalledWith(
        expect.stringMatching(/^reports\/user-1\/[0-9a-f-]{36}\.pdf$/),
        file.buffer,
        "application/pdf",
      );
      expect(reportFileCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          filename: "hemograma-fleury.pdf",
          sizeBytes: 1234,
        }),
      });
      expect(extractionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: "user-1", status: "processing" }),
      });
      expect(publish).toHaveBeenCalledWith("extraction.run", { extractionId: "ext-1" });
      expect(response).toEqual({
        reportId: expect.any(String),
        extractionId: "ext-1",
        status: "processing",
      });
    });

    it("names the stored object after the ReportFile id", async () => {
      await service.uploadReport("user-1", pdfFile());

      const storageKey = put.mock.calls[0]?.[0] as string;
      const reportId = reportFileCreate.mock.calls[0]?.[0].data.id as string;
      expect(storageKey).toBe(`reports/user-1/${reportId}.pdf`);
    });

    it("rejects a request without a file before touching storage", async () => {
      await expect(service.uploadReport("user-1", undefined)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(put).not.toHaveBeenCalled();
    });

    it("rejects a non-pdf mimetype", async () => {
      const docx = pdfFile({ mimetype: "application/msword" });

      await expect(service.uploadReport("user-1", docx)).rejects.toBeInstanceOf(
        UnsupportedMediaTypeException,
      );
      expect(put).not.toHaveBeenCalled();
    });

    it("rejects a renamed non-pdf by its magic bytes", async () => {
      const fake = pdfFile({ buffer: Buffer.from("PK zip disguised as pdf") });

      await expect(service.uploadReport("user-1", fake)).rejects.toBeInstanceOf(
        UnsupportedMediaTypeException,
      );
      expect(put).not.toHaveBeenCalled();
    });

    it("rejects a PDF over 20 MB", async () => {
      const huge = pdfFile({ size: MAX_REPORT_PDF_BYTES + 1 });

      await expect(service.uploadReport("user-1", huge)).rejects.toBeInstanceOf(
        PayloadTooLargeException,
      );
      expect(put).not.toHaveBeenCalled();
    });

    it("marks the extraction failed and rethrows when the queue publish fails", async () => {
      publish.mockRejectedValue(new Error("pg-boss is down"));

      await expect(service.uploadReport("user-1", pdfFile())).rejects.toThrow("pg-boss is down");

      expect(extractionUpdate).toHaveBeenCalledWith({
        where: { id: "ext-1" },
        data: { status: "failed", error: "queue publish failed: pg-boss is down" },
      });
    });
  });

  describe("listReports", () => {
    it("lists the signed-in user's non-deleted uploads, newest first", async () => {
      findMany.mockResolvedValue([]);

      await service.listReports("user-1");

      expect(findMany).toHaveBeenCalledWith({
        where: { userId: "user-1", deletedAt: null },
        orderBy: { uploadedAt: "desc" },
        include: { extraction: { include: { batch: { select: { sequence: true } } } } },
      });
    });
  });
});
