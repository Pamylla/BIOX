/**
 * extractor-output.ts
 *
 * The zod contract the LLM extractor's structured output must satisfy — worker
 * step 3 of the ingestion pipeline (plan §11.3). This is the v0 placeholder
 * shape: it carries exactly what the review screen and ExtractionItem persist
 * today (simple low/high ranges; no tiered/contextual ranges yet).
 *
 * TODO(plan §16): the official extractor prompt v1 + extraction-schema.md
 * alignment arrive from the claude.ai instance; this schema is swapped/extended
 * then (tiered ranges, reviewContext, censoring taxonomy) — never improvised.
 *
 * Design principles (docs/03-architecture/extraction-schema.md):
 *  - Preserve the raw, always: every numeric field here is the STRING exactly
 *    as printed on the report. Parsing Brazilian numbers is deterministic code
 *    (brazilian-number.ts), never the LLM's job.
 *  - Never invent: anything the report doesn't state is null, not guessed.
 *  - No PII: there is no field for patient name, ID, physician, or protocol.
 */

import { z } from "zod";
import { confidenceSchema } from "../contracts/enums";

/** One marker as the extractor read it off the report — raw strings only. */
export const extractorItemSchema = z.object({
  /** The marker's name exactly as printed, e.g. "Proteína C Reativa Ultra Sensível". */
  rawLabel: z.string().min(1),
  /** The value exactly as printed, e.g. "8.610", "0,03", "< 0,3"; null when qualitative-only. */
  rawValue: z.string().nullable(),
  /** Qualitative result as printed, e.g. "Non-reactive"; null for numeric results. */
  valueLabel: z.string().nullable(),
  /** The unit exactly as printed, e.g. "mg/dL"; null when the report shows none. */
  unit: z.string().nullable(),
  /** Lower reference bound exactly as printed, e.g. "70", "4,5"; null when absent. */
  refLow: z.string().nullable(),
  /** Upper reference bound exactly as printed; null when absent. */
  refHigh: z.string().nullable(),
  /** The full reference text verbatim, whatever its shape; null when the report has none. */
  refRaw: z.string().nullable(),
  /** Lab assay method as printed (e.g. "Quimioluminescência"); null when absent. */
  assayMethod: z.string().nullable(),
  /** The extractor's own read confidence; deterministic checks may downgrade it. */
  confidence: confidenceSchema,
});
export type ExtractorItem = z.infer<typeof extractorItemSchema>;

/** The extractor's whole read of one report (LLM structured output, v0). */
export const extractorOutputSchema = z.object({
  /** The specimen COLLECTION date (not the issue date), ISO "YYYY-MM-DD"; null if absent. */
  collectionDate: z.iso.date().nullable(),
  /** Performing lab's name only — never patient/physician identifiers. */
  labName: z.string().nullable(),
  items: z.array(extractorItemSchema),
});
export type ExtractorOutput = z.infer<typeof extractorOutputSchema>;
