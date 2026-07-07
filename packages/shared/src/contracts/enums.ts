import { z } from "zod";

/**
 * Shared enums of the API contracts. Domain vocabulary follows the
 * Ubiquitous Language (Extraction / Batch / Measurement — never Exam/Result);
 * the UI translates to UX terms at the presentation layer (plan §3).
 */

/** Measurement flag — `none` = no reference range on the report (§5.3). */
export const flagStatusSchema = z.enum(["good", "watch", "alert", "none"]);
export type FlagStatus = z.infer<typeof flagStatusSchema>;

/** Insight tone is a flag status without `none`. */
export const insightToneSchema = z.enum(["good", "watch", "alert"]);
export type InsightTone = z.infer<typeof insightToneSchema>;

export const scoreStatusSchema = z.enum(["excellent", "good", "watch", "alert"]);
export type ScoreStatus = z.infer<typeof scoreStatusSchema>;

export const confidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof confidenceSchema>;

export const extractionStatusSchema = z.enum([
  "processing",
  "needs_review",
  "confirmed",
  "discarded",
  "failed",
]);
export type ExtractionStatus = z.infer<typeof extractionStatusSchema>;

export const valueQualifierSchema = z.enum(["<", ">", "≤", "≥"]);
export type ValueQualifier = z.infer<typeof valueQualifierSchema>;

export const sexAtBirthSchema = z.enum(["female", "male"]);
export type SexAtBirth = z.infer<typeof sexAtBirthSchema>;

/** The six body systems plus the weighted composite (§5.6). */
export const systemKeySchema = z.enum([
  "metabolic",
  "cardiovascular",
  "inflammation",
  "hematologic",
  "hepatorenal",
  "thyroid",
  "overall",
]);
export type SystemKey = z.infer<typeof systemKeySchema>;

/** Catalog panels as shown in the UI, each mapping to one score system (§3). */
export const panelKeySchema = z.enum([
  "cbc",
  "glucose",
  "lipid",
  "renal_hepatic",
  "inflammation",
  "thyroid",
]);
export type PanelKey = z.infer<typeof panelKeySchema>;

export const PANEL_LABELS: Record<PanelKey, string> = {
  cbc: "CBC",
  glucose: "Glucose Metabolism",
  lipid: "Lipid Profile",
  renal_hepatic: "Renal & Hepatic",
  inflammation: "Inflammation",
  thyroid: "Thyroid",
};

export const PANEL_TO_SYSTEM: Record<PanelKey, Exclude<SystemKey, "overall">> = {
  cbc: "hematologic",
  glucose: "metabolic",
  lipid: "cardiovascular",
  renal_hepatic: "hepatorenal",
  inflammation: "inflammation",
  thyroid: "thyroid",
};

export const SYSTEM_LABELS: Record<SystemKey, string> = {
  metabolic: "Metabolic",
  cardiovascular: "Cardiovascular",
  inflammation: "Inflammation",
  hematologic: "Hematologic",
  hepatorenal: "Hepatic & Renal",
  thyroid: "Thyroid",
  overall: "Overall Health",
};
