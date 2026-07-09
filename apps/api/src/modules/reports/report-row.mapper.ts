import type { ReportRow } from "@biox/shared";
import type { Extraction, ReportFile } from "@prisma/client";

export type ReportFileWithExtraction = ReportFile & {
  extraction: (Extraction & { batch: { sequence: number } | null }) | null;
};

/**
 * Upload always creates the ReportFile and its Extraction in one transaction,
 * so a file without one is unreachable by the UI contract — skip it rather
 * than fail the whole listing.
 */
export function toReportRows(files: ReportFileWithExtraction[]): ReportRow[] {
  return files.flatMap((file) => {
    if (!file.extraction) return [];
    return [
      {
        id: file.id,
        filename: file.filename,
        sizeBytes: file.sizeBytes,
        uploadedAt: file.uploadedAt.toISOString(),
        extractionId: file.extraction.id,
        extractionStatus: file.extraction.status,
        batchSequence: file.extraction.batch?.sequence ?? null,
      },
    ];
  });
}
