/**
 * parse-marker-value.ts
 *
 * Orchestrates a single marker value from the raw report string to a
 * review-ready result. It is where the magnitude sanity check is finally wired
 * in — and, critically, it runs that check on the CANONICAL value:
 *
 *   1. parse the Brazilian-formatted string  (brazilian-number.ts)
 *   2. convert the value to the marker's canonical unit  (conversionFactor)
 *   3. check the magnitude against the catalog's plausibility band, which is
 *      itself defined in the canonical unit  (magnitude.ts)
 *
 * Checking before conversion would compare a value in the report's unit against
 * a band in a different unit — e.g. hs-CRP printed as 0,03 mg/dL against a band
 * in mg/L — and flag (or miss) the wrong thing. So the order matters.
 *
 * The parser depends on `BiomarkerCatalogPort`, never on the concrete catalog.
 */

import {
  parseBrazilianNumber,
  type Censoring,
  type NumberReviewReason,
} from "./brazilian-number";
import { isWithinPlausibleMagnitude } from "./magnitude";
import type { BiomarkerCatalogPort } from "./biomarker-catalog.port";

export interface MarkerValueInput {
  /** Resolved catalog code (ExtractedMarker.catalogKey). */
  catalogKey: string;
  /** The value exactly as printed on the report, e.g. "0,03", "8.610", "< 0,3". */
  rawValue: string;
  /** The unit as printed on the report, e.g. "mg/dL". */
  unit: string;
  /**
   * Factor that converts `value` (report unit) into the marker's canonical unit,
   * supplied by the unit-normalization step (spike #1). Omit or pass `null` when
   * the report unit already IS the canonical unit (treated as factor 1) or when
   * no conversion is known (then the value cannot be checked and is left
   * uncanonicalized).
   */
  conversionFactor?: number | null;
}

export interface ParsedMarkerValue {
  /** The exact string received, preserved verbatim. */
  rawValue: string;
  /** Parsed numeric value in the report's unit; null if unparseable/ambiguous. */
  value: number | null;
  /** `value` converted to `canonicalUnit`; null if not parsed or not convertible. */
  valueCanonical: number | null;
  /** The marker's canonical unit from the catalog; null if the code is unknown. */
  canonicalUnit: string | null;
  /** The factor actually applied to reach `valueCanonical`; null if none applied. */
  conversionFactor: number | null;
  /** Whether the value was reported as "< x" or "> x". */
  censoring: Censoring;
  /** True if a human must confirm before this value is trusted. */
  needsReview: boolean;
  /** Machine-readable reasons for review (empty when clean). */
  reasons: NumberReviewReason[];
}

/**
 * Parse, canonicalize, and sanity-check one marker value.
 *
 * Does NOT decide clinical meaning — it converts, checks the parsing
 * plausibility band, and flags. Nothing is silently resolved.
 */
export function parseMarkerValue(
  input: MarkerValueInput,
  catalog: BiomarkerCatalogPort,
): ParsedMarkerValue {
  const parsed = parseBrazilianNumber(input.rawValue);
  const entry = catalog.findByCode(input.catalogKey);
  const reasons: NumberReviewReason[] = [...parsed.reasons];

  const canonicalUnit = entry?.canonicalUnit ?? null;

  // Resolve the factor: explicit > same-unit (1) > unknown (cannot convert).
  let conversionFactor: number | null;
  if (input.conversionFactor != null) {
    conversionFactor = input.conversionFactor;
  } else if (canonicalUnit !== null && input.unit === canonicalUnit) {
    conversionFactor = 1;
  } else {
    conversionFactor = null;
  }

  // Convert FIRST — the plausibility band is defined in the canonical unit.
  const valueCanonical =
    parsed.value === null || conversionFactor === null
      ? null
      : parsed.value * conversionFactor;

  // THEN check magnitude, in the canonical unit. Skip silently when there is
  // nothing to check against (no canonical value, or no band for this marker).
  if (
    valueCanonical !== null &&
    entry?.plausibleMagnitude !== undefined &&
    !isWithinPlausibleMagnitude(valueCanonical, entry.plausibleMagnitude)
  ) {
    reasons.push("magnitude_out_of_range");
  }

  return {
    rawValue: parsed.raw,
    value: parsed.value,
    valueCanonical,
    canonicalUnit,
    conversionFactor,
    censoring: parsed.censoring,
    needsReview: reasons.length > 0,
    reasons,
  };
}
