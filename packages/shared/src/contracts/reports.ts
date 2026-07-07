import { z } from "zod";
import { extractionStatusSchema } from "./enums";

/** GET /v1/reports — one row of the "Recent uploads" table. */
export const reportRowSchema = z.object({
  id: z.string(),
  filename: z.string(),
  sizeBytes: z.number().int(),
  uploadedAt: z.string(),
  extractionId: z.string(),
  extractionStatus: extractionStatusSchema,
  /** Snapshot number once confirmed; null while pending/discarded. */
  batchSequence: z.number().int().nullable(),
});
export type ReportRow = z.infer<typeof reportRowSchema>;
