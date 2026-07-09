/**
 * flag-engine.ts — the Universal Layer flag (plan §11.1).
 *
 * A pure function that crosses a normalized value with the range printed on the
 * report (ADR-002: ranges are per-measurement, never from a catalog) to produce
 * a `good | watch | alert | none` status and a human label. The status is
 * frozen onto each Measurement at confirm.
 *
 * Direction (high_bad / low_bad) is NOT an input: the report's range already
 * encodes it. HDL prints as `> 40`, so a low HDL falls below refLow and reads
 * "Below range" — the same position logic that flags a high LDL above refHigh.
 * One-sided ranges keep the engine honest without a direction table.
 */
import type { FlagStatus, ValueQualifier } from "../../contracts";

export interface FlagInput {
  /** Normalized numeric value; null for label-only results (serology). */
  value: number | null;
  /** Censoring on the value, e.g. "< 0.01" — bounds which side it can flag. */
  valueQualifier?: ValueQualifier | null;
  /** Label result, e.g. "Non-reactive" — surfaced verbatim when there is no range. */
  valueLabel?: string | null;
  refLow: number | null;
  refHigh: number | null;
  /** Range boundaries count as in-range unless told otherwise (§11.1 default). */
  lowInclusive?: boolean;
  highInclusive?: boolean;
  /** Borderline band as a fraction of the nearest threshold; 0 disables watch. */
  borderlinePct: number;
}

export interface FlagResult {
  status: FlagStatus;
  label: string;
}

const NO_REFERENCE = "No reference provided";

/** `<`/`≤` cap the true value from above, so it can only flag on the low side. */
function isCensoredLow(qualifier: FlagInput["valueQualifier"]): boolean {
  return qualifier === "<" || qualifier === "≤";
}

/** `>`/`≥` floor the true value, so it can only flag on the high side. */
function isCensoredHigh(qualifier: FlagInput["valueQualifier"]): boolean {
  return qualifier === ">" || qualifier === "≥";
}

export function flagMeasurement(input: FlagInput): FlagResult {
  const { value, valueLabel, refLow, refHigh, valueQualifier, borderlinePct } = input;
  const hasRange = refLow !== null || refHigh !== null;

  // Rule 1: a label-only result with no numeric range shows its own label.
  if (valueLabel != null && !hasRange) return { status: "none", label: valueLabel };

  // Rule 2: nothing to compare against.
  if (!hasRange) return { status: "none", label: NO_REFERENCE };

  // A label-only value can't be positioned against a range; stay neutral.
  if (value === null) return { status: "none", label: valueLabel ?? NO_REFERENCE };

  const lowInclusive = input.lowInclusive ?? true;
  const highInclusive = input.highInclusive ?? true;
  const canFlagHigh = !isCensoredLow(valueQualifier);
  const canFlagLow = !isCensoredHigh(valueQualifier);

  // Rule 3: outside the range.
  if (refHigh !== null && canFlagHigh) {
    const aboveHigh = highInclusive ? value > refHigh : value >= refHigh;
    if (aboveHigh) return { status: "alert", label: "Above target" };
  }
  if (refLow !== null && canFlagLow) {
    const belowLow = lowInclusive ? value < refLow : value <= refLow;
    if (belowLow) return { status: "alert", label: "Below range" };
  }

  // Rule 4: inside the range but within the borderline band of a threshold.
  // A one-sided range (only one bound) reads "Borderline"; a two-sided range
  // names the side ("Upper range" / "Lower range").
  if (borderlinePct > 0) {
    if (refHigh !== null && canFlagHigh && value >= refHigh * (1 - borderlinePct)) {
      return { status: "watch", label: refLow === null ? "Borderline" : "Upper range" };
    }
    if (refLow !== null && canFlagLow && value <= refLow * (1 + borderlinePct)) {
      return { status: "watch", label: refHigh === null ? "Borderline" : "Lower range" };
    }
  }

  // Rule 5: comfortably in range.
  return { status: "good", label: "In range" };
}
