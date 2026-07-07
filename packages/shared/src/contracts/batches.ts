import { z } from "zod";
import { flagStatusSchema, panelKeySchema, scoreStatusSchema } from "./enums";
import { measurementSchema } from "./measurements";

/** GET /v1/batches — one row per snapshot in the Timeline. */
export const batchSummarySchema = z.object({
  id: z.string(),
  /** User-facing snapshot number (01, 02…). */
  sequence: z.number().int(),
  /** ISO date of sample collection, from the report. */
  collectedAt: z.string(),
  performingLab: z.string().nullable(),
  markerCount: z.number().int(),
  overallScore: z.number().int().nullable(),
  overallStatus: scoreStatusSchema.nullable(),
  /** Derived: highest collectedAt (not persisted — plan §9 note). */
  isLatest: z.boolean(),
  /** Derived: sequence 1. */
  isBaseline: z.boolean(),
});
export type BatchSummary = z.infer<typeof batchSummarySchema>;

/** GET /v1/batches/:id — measurements grouped by panel. */
export const batchDetailSchema = z.object({
  batch: batchSummarySchema,
  panels: z.array(
    z.object({
      key: panelKeySchema,
      label: z.string(),
      measurements: z.array(measurementSchema),
    }),
  ),
});
export type BatchDetail = z.infer<typeof batchDetailSchema>;

/** GET /v1/batches/compare?a=&b= */
export const compareRowSchema = z.object({
  biomarkerKey: z.string(),
  displayName: z.string(),
  unit: z.string(),
  valueA: z.number().nullable(),
  valueB: z.number().nullable(),
  delta: z.number().nullable(),
  /** Coloring: green = improvement, amber/red = toward or past a threshold. */
  deltaTone: flagStatusSchema,
  statusB: flagStatusSchema,
});
export type CompareRow = z.infer<typeof compareRowSchema>;

export const compareResponseSchema = z.object({
  a: batchSummarySchema,
  b: batchSummarySchema,
  rows: z.array(compareRowSchema),
});
export type CompareResponse = z.infer<typeof compareResponseSchema>;
