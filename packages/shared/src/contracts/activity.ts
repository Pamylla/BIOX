import { z } from "zod";

export const activityTypeSchema = z.enum([
  "batch.created",
  "insights.generated",
  "flag.crossed",
  "score.changed",
]);
export type ActivityType = z.infer<typeof activityTypeSchema>;

/** GET /v1/activity — pipeline events for the Dashboard feed. */
export const activityEventSchema = z.object({
  id: z.string(),
  type: activityTypeSchema,
  title: z.string(),
  /** Secondary caption ("labs-jun-2026.pdf", "132 → 141 mg/dL"). */
  detail: z.string().nullable(),
  createdAt: z.string(),
});
export type ActivityEvent = z.infer<typeof activityEventSchema>;
