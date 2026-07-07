import { z } from "zod";
import {
  flagStatusSchema,
  insightToneSchema,
  panelKeySchema,
  scoreStatusSchema,
  systemKeySchema,
  valueQualifierSchema,
} from "./enums";

const trendDirectionSchema = z.enum(["up", "down", "flat"]);
export type TrendDirection = z.infer<typeof trendDirectionSchema>;

/** Trend cell of a biomarker row: ▲▼— plus a formatted delta. */
export const biomarkerTrendSchema = z.object({
  direction: trendDirectionSchema,
  deltaLabel: z.string(),
  tone: flagStatusSchema,
});
export type BiomarkerTrend = z.infer<typeof biomarkerTrendSchema>;

/** GET /v1/biomarkers?batch=:id — one row of the Biomarkers screen. */
export const biomarkerRowSchema = z.object({
  biomarkerKey: z.string(),
  displayName: z.string(),
  status: flagStatusSchema,
  flagLabel: z.string(),
  value: z.number().nullable(),
  valueQualifier: valueQualifierSchema.nullable(),
  valueLabel: z.string().nullable(),
  unit: z.string(),
  refRaw: z.string().nullable(),
  /** Values across snapshots (chronological) for the row sparkline. */
  series: z.array(z.number()),
  /** Null with fewer than 2 readings. */
  trend: biomarkerTrendSchema.nullable(),
});
export type BiomarkerRow = z.infer<typeof biomarkerRowSchema>;

export const biomarkersResponseSchema = z.object({
  batchId: z.string(),
  panels: z.array(
    z.object({
      key: panelKeySchema,
      label: z.string(),
      rows: z.array(biomarkerRowSchema),
    }),
  ),
});
export type BiomarkersResponse = z.infer<typeof biomarkersResponseSchema>;

/** One historical reading in the Biomarker Detail "Past readings" table. */
export const biomarkerReadingSchema = z.object({
  batchId: z.string(),
  sequence: z.number().int(),
  collectedAt: z.string(),
  value: z.number().nullable(),
  valueQualifier: valueQualifierSchema.nullable(),
  valueLabel: z.string().nullable(),
  status: flagStatusSchema,
  flagLabel: z.string(),
});
export type BiomarkerReading = z.infer<typeof biomarkerReadingSchema>;

/** GET /v1/biomarkers/:key/series — everything the Detail screen renders. */
export const biomarkerSeriesSchema = z.object({
  biomarkerKey: z.string(),
  displayName: z.string(),
  panelKey: panelKeySchema,
  panelLabel: z.string(),
  unit: z.string(),
  current: z.object({
    value: z.number().nullable(),
    valueQualifier: valueQualifierSchema.nullable(),
    valueLabel: z.string().nullable(),
    refLow: z.number().nullable(),
    refHigh: z.number().nullable(),
    refRaw: z.string().nullable(),
    status: flagStatusSchema,
    flagLabel: z.string(),
    /** Dot position on the reference band, 0–100; null hides the band (§5.3). */
    positionPct: z.number().nullable(),
    trend: biomarkerTrendSchema.nullable(),
  }),
  readings: z.array(biomarkerReadingSchema),
  related: z.object({
    biomarkers: z.array(
      z.object({
        biomarkerKey: z.string(),
        displayName: z.string(),
        status: flagStatusSchema,
        valueDisplay: z.string(),
      }),
    ),
    score: z
      .object({
        systemKey: systemKeySchema,
        label: z.string(),
        value: z.number().int(),
        status: scoreStatusSchema,
      })
      .nullable(),
    insight: z.object({ id: z.string(), title: z.string(), tone: insightToneSchema }).nullable(),
  }),
});
export type BiomarkerSeries = z.infer<typeof biomarkerSeriesSchema>;
