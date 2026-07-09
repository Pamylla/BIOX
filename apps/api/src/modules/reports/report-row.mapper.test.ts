import { describe, expect, it } from "vitest";
import { toReportRows, type ReportFileWithExtraction } from "./report-row.mapper";

function reportFile(overrides: Partial<ReportFileWithExtraction> = {}): ReportFileWithExtraction {
  return {
    id: "report-1",
    userId: "user-1",
    storageKey: "reports/user-1/report-1.pdf",
    filename: "hemograma.pdf",
    sizeBytes: 2048,
    pageCount: null,
    uploadedAt: new Date("2026-07-09T12:00:00.000Z"),
    deletedAt: null,
    extraction: {
      id: "ext-1",
      reportFileId: "report-1",
      userId: "user-1",
      status: "needs_review",
      model: null,
      promptVersion: null,
      rawOutput: null,
      reportDate: null,
      performingLab: null,
      error: null,
      createdAt: new Date("2026-07-09T12:00:01.000Z"),
      confirmedAt: null,
      batch: null,
    },
    ...overrides,
  };
}

describe("toReportRows", () => {
  it("maps a pending upload with no snapshot yet", () => {
    expect(toReportRows([reportFile()])).toEqual([
      {
        id: "report-1",
        filename: "hemograma.pdf",
        sizeBytes: 2048,
        uploadedAt: "2026-07-09T12:00:00.000Z",
        extractionId: "ext-1",
        extractionStatus: "needs_review",
        batchSequence: null,
      },
    ]);
  });

  it("carries the snapshot sequence once confirmed", () => {
    const confirmed = reportFile();
    confirmed.extraction!.status = "confirmed";
    confirmed.extraction!.batch = { sequence: 3 };

    const [row] = toReportRows([confirmed]);

    expect(row).toMatchObject({ extractionStatus: "confirmed", batchSequence: 3 });
  });

  it("skips a file without an extraction instead of failing the listing", () => {
    expect(toReportRows([reportFile({ extraction: null })])).toEqual([]);
  });
});
