import { z } from "zod";
import { flagStatusSchema, panelKeySchema, valueQualifierSchema } from "./enums";

/**
 * One frozen measurement inside a Batch. Reference ranges are per-measurement,
 * exactly as printed on that report (ADR-002) — never from a catalog.
 * `displayName`/`panelLabel` are joined server-side so screens never reach
 * into the catalog for presentation.
 */
export const measurementSchema = z.object({
  id: z.string(),
  biomarkerKey: z.string(),
  displayName: z.string(),
  panelKey: panelKeySchema,
  panelLabel: z.string(),
  /** Numeric value; null when the result is label-only (serology, §5.4). */
  value: z.number().nullable(),
  /** Censored values, e.g. "< 0.01" (§5.4). */
  valueQualifier: valueQualifierSchema.nullable(),
  /** Label results, e.g. "Non-reactive" (§5.4). */
  valueLabel: z.string().nullable(),
  unit: z.string(),
  refLow: z.number().nullable(),
  refHigh: z.number().nullable(),
  /** The range exactly as printed on the report, e.g. "70–99" or "< 200". */
  refRaw: z.string().nullable(),
  status: flagStatusSchema,
  /** "In range", "Above target", "No reference provided"… frozen at confirm. */
  flagLabel: z.string(),
});
export type Measurement = z.infer<typeof measurementSchema>;
