import { z } from "zod";
import { flagStatusSchema, insightToneSchema, scoreStatusSchema, systemKeySchema } from "./enums";

/** One score card (Dashboard grid, Scores screen). */
export const scoreCardSchema = z.object({
  systemKey: systemKeySchema,
  label: z.string(),
  value: z.number().int(),
  status: scoreStatusSchema,
  /** Delta vs. previous snapshot; null on the baseline. */
  delta: z.number().int().nullable(),
  blurb: z.string(),
});
export type ScoreCard = z.infer<typeof scoreCardSchema>;

/** GET /v1/scores?batch=:id */
export const scoresResponseSchema = z.object({
  batchId: z.string(),
  overall: scoreCardSchema,
  systems: z.array(scoreCardSchema),
});
export type ScoresResponse = z.infer<typeof scoresResponseSchema>;

/** GET /v1/scores/:system?batch=:id */
export const scoreDetailSchema = z.object({
  card: scoreCardSchema,
  /** Frozen engine version that produced this score (e.g. "scores-v1"). */
  formulaVersion: z.string(),
  /** Input measurements, clickable through to Biomarker Detail. */
  inputs: z.array(
    z.object({
      biomarkerKey: z.string(),
      displayName: z.string(),
      valueDisplay: z.string(),
      status: flagStatusSchema,
      flagLabel: z.string(),
    }),
  ),
  /** Score over time, chronological. */
  history: z.array(
    z.object({
      batchId: z.string(),
      sequence: z.number().int(),
      collectedAt: z.string(),
      value: z.number().int(),
    }),
  ),
  relatedInsight: z
    .object({ id: z.string(), title: z.string(), tone: insightToneSchema })
    .nullable(),
});
export type ScoreDetail = z.infer<typeof scoreDetailSchema>;
