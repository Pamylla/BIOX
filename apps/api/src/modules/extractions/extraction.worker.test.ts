import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExtractionStatus } from "@prisma/client";
import type { PrismaService } from "../../prisma/prisma.service";
import type { JobQueuePort } from "../jobs/job-queue.port";
import type { StoragePort } from "../storage/storage.port";
import { ExtractionWorker } from "./extraction.worker";
import { ExtractorError } from "./extractor/extractor.errors";
import type { ExtractorPort, ExtractorResult } from "./extractor/extractor.port";

const validOutput = {
  collectionDate: "2026-03-14",
  labName: "Fleury",
  items: [
    {
      rawLabel: "Ferritina",
      rawValue: "8.610",
      valueLabel: null,
      unit: "ng/mL",
      refLow: "11",
      refHigh: "307",
      refRaw: "11 a 307 ng/mL",
      assayMethod: null,
      confidence: "high",
    },
  ],
};

const extractorResult: ExtractorResult = {
  output: validOutput,
  model: "claude-opus-4-8",
  promptVersion: "extractor-v0-placeholder",
};

function setup(extractionRow: unknown) {
  const findUnique = vi.fn().mockResolvedValue(extractionRow);
  const update = vi.fn().mockResolvedValue({});
  const prisma = { extraction: { findUnique, update } } as unknown as PrismaService;

  const storage = {
    get: vi.fn().mockResolvedValue(Buffer.from("%PDF-")),
  } as unknown as StoragePort;
  const extractor = {
    extract: vi.fn().mockResolvedValue(extractorResult),
  } as unknown as ExtractorPort;
  const jobQueue = { subscribe: vi.fn(), publish: vi.fn() } as unknown as JobQueuePort;

  const worker = new ExtractionWorker(prisma, storage, extractor, jobQueue);
  return { worker, findUnique, update, storage, extractor, jobQueue };
}

const processingRow = {
  id: "ext-1",
  status: ExtractionStatus.processing,
  reportFile: { storageKey: "reports/u1/ext-1.pdf" },
};

describe("ExtractionWorker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("subscribes to extraction.run on module init", () => {
    const { worker, jobQueue } = setup(processingRow);
    worker.onModuleInit();
    expect(jobQueue.subscribe).toHaveBeenCalledWith("extraction.run", expect.any(Function));
  });

  it("downloads the PDF, extracts, and moves the extraction to needs_review with its items", async () => {
    const { worker, storage, extractor, update } = setup(processingRow);

    await worker.run("ext-1");

    expect(storage.get).toHaveBeenCalledWith("reports/u1/ext-1.pdf");
    expect(extractor.extract).toHaveBeenCalledOnce();

    const data = update.mock.calls[0]?.[0].data;
    expect(data.status).toBe(ExtractionStatus.needs_review);
    expect(data.model).toBe("claude-opus-4-8");
    expect(data.promptVersion).toBe("extractor-v0-placeholder");
    expect(data.performingLab).toBe("Fleury");
    expect(data.reportDate).toBeInstanceOf(Date);
    expect(data.items.createMany.data).toHaveLength(1);
    expect(data.items.createMany.data[0].biomarkerKey).toBe("ferritina");
    expect(data.items.createMany.data[0].value).toBe(8610);
  });

  it("stores the raw model output verbatim for auditability", async () => {
    const { worker, update } = setup(processingRow);
    await worker.run("ext-1");
    expect(update.mock.calls[0]?.[0].data.rawOutput).toEqual(validOutput);
  });

  it("skips an unknown extraction without writing", async () => {
    const { worker, storage, update } = setup(null);
    await worker.run("missing");
    expect(storage.get).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("skips an extraction that is no longer processing (redelivered job)", async () => {
    const { worker, storage, update } = setup({
      ...processingRow,
      status: ExtractionStatus.confirmed,
    });
    await worker.run("ext-1");
    expect(storage.get).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("marks the extraction failed when the extractor throws, without rejecting", async () => {
    const { worker, extractor, update } = setup(processingRow);
    (extractor.extract as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ExtractorError("model declined"),
    );

    await expect(worker.run("ext-1")).resolves.toBeUndefined();

    const data = update.mock.calls[0]?.[0].data;
    expect(data.status).toBe(ExtractionStatus.failed);
    expect(data.error).toContain("model declined");
  });

  it("marks failed and keeps the raw output when the model output fails schema validation", async () => {
    const { worker, extractor, update } = setup(processingRow);
    const badOutput = {
      collectionDate: "2026-03-14",
      labName: "Fleury",
      items: [{ rawLabel: "" }],
    };
    (extractor.extract as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...extractorResult,
      output: badOutput,
    });

    await worker.run("ext-1");

    const data = update.mock.calls[0]?.[0].data;
    expect(data.status).toBe(ExtractionStatus.failed);
    expect(data.error).toContain("schema validation");
    expect(data.rawOutput).toEqual(badOutput);
  });

  it("does not throw when the failure-status write itself fails", async () => {
    const { worker, extractor, update } = setup(processingRow);
    (extractor.extract as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("boom"));
    (update as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("db down"));

    await expect(worker.run("ext-1")).resolves.toBeUndefined();
  });
});
