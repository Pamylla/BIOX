import { z } from "zod";
import { flagStatusSchema, insightToneSchema, scoreStatusSchema, systemKeySchema } from "./enums";

/**
 * Insight — AI-generated, leaf read-only, always labeled as AI in the UI.
 * It never writes back into scores or measurements.
 */
export const insightSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  tone: insightToneSchema,
  summary: z.string(),
  markers: z.array(z.object({ biomarkerKey: z.string(), displayName: z.string() })),
  relatedScoreKey: systemKeySchema.nullable(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
});
export type InsightSummary = z.infer<typeof insightSummarySchema>;

/** GET /v1/insights — list + the sidebar badge count (§5.11). */
export const insightsResponseSchema = z.object({
  insights: z.array(insightSummarySchema),
  unreadCount: z.number().int(),
});
export type InsightsResponse = z.infer<typeof insightsResponseSchema>;

/** GET /v1/insights/:id */
export const insightDetailSchema = insightSummarySchema.extend({
  body: z.string(),
  /** Feeds the "Grounded in" card — what actually entered the prompt. */
  grounding: z.object({
    readings: z.string(),
    knowledge: z.string(),
  }),
  /** Sidebar rows: the cited markers with their current state. */
  relatedBiomarkers: z.array(
    z.object({
      biomarkerKey: z.string(),
      displayName: z.string(),
      status: flagStatusSchema,
      valueDisplay: z.string(),
    }),
  ),
  relatedScore: z
    .object({
      systemKey: systemKeySchema,
      label: z.string(),
      value: z.number().int(),
      status: scoreStatusSchema,
    })
    .nullable(),
});
export type InsightDetail = z.infer<typeof insightDetailSchema>;
