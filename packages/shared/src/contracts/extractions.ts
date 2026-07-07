import { z } from "zod";
import {
  confidenceSchema,
  extractionStatusSchema,
  panelKeySchema,
  valueQualifierSchema,
} from "./enums";

/** One extracted value under human review. */
export const extractionItemSchema = z.object({
  id: z.string(),
  /** The label exactly as it appeared on the report. */
  rawLabel: z.string(),
  /** Resolved catalog key; null = unrecognized, user can assign in review. */
  biomarkerKey: z.string().nullable(),
  displayName: z.string().nullable(),
  panelKey: panelKeySchema.nullable(),
  value: z.number().nullable(),
  valueQualifier: valueQualifierSchema.nullable(),
  valueLabel: z.string().nullable(),
  unit: z.string().nullable(),
  refLow: z.number().nullable(),
  refHigh: z.number().nullable(),
  refRaw: z.string().nullable(),
  confidence: confidenceSchema,
  editedByUser: z.boolean(),
});
export type ExtractionItem = z.infer<typeof extractionItemSchema>;

/** GET /v1/extractions/:id — Review screen payload. */
export const extractionReviewSchema = z.object({
  id: z.string(),
  status: extractionStatusSchema,
  reportFilename: z.string(),
  /** Collection date detected on the report (ISO), or null. */
  reportDate: z.string().nullable(),
  performingLab: z.string().nullable(),
  error: z.string().nullable(),
  items: z.array(extractionItemSchema),
  /** Header counts, computed server-side: "N values across M panels · K to check". */
  counts: z.object({
    values: z.number().int(),
    panels: z.number().int(),
    toCheck: z.number().int(),
  }),
});
export type ExtractionReview = z.infer<typeof extractionReviewSchema>;
