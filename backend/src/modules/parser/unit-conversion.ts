/**
 * unit-conversion.ts
 *
 * Normalizes a parsed value from the unit printed on the report to the marker's
 * canonical unit (FR-09). This is spike #1 of the deterministic pipeline and it
 * sits BETWEEN number parsing and the magnitude sanity check:
 *
 *   parseBrazilianNumber  ->  toCanonical (here)  ->  magnitude check
 *
 * The magnitude band is defined in the canonical unit, so the value must be
 * converted first; the check then runs on `valueCanonical`. See
 * `parse-marker-value.ts` for the wiring.
 *
 * Safety principle (mirrors brazilian-number.ts): a wrong conversion factor is
 * as dangerous as a wrong separator — it shifts a value by orders of magnitude.
 * So this module NEVER guesses a factor. A unit that is neither the canonical
 * unit nor a curated conversion pair is flagged for review (`unit_unknown`),
 * never converted. The factor table is not hard-coded here — it comes from the
 * catalog entry (`CatalogEntry.conversions`) via the catalog port.
 */

import type { BiomarkerCatalogPort } from "./biomarker-catalog.port";

/** Machine-readable review reason emitted by unit normalization. */
export type UnitReviewReason = "unit_unknown";

export interface CanonicalConversion {
  /** The value in the marker's canonical unit; null when it cannot be converted. */
  valueCanonical: number | null;
  /** The marker's canonical unit; null only when the marker code is unknown. */
  canonicalUnit: string | null;
  /** The factor applied to reach `valueCanonical`; null when none was applied. */
  factor: number | null;
  /** Review reasons (empty when clean); `unit_unknown` when the unit is unmapped. */
  reasons: UnitReviewReason[];
}

/**
 * Convert a value to its marker's canonical unit using the catalog's curated
 * conversion pairs. Resolution order, each explicit:
 *
 *  1. Unknown marker code  → nothing to target; return nulls, no flag. Resolving
 *     the code is an upstream concern, not this step's to flag.
 *  2. Unit already canonical → factor 1, value unchanged.
 *  3. A curated pair for the unit → apply its factor.
 *  4. Anything else → unmapped unit; flag `unit_unknown`, convert NOTHING.
 */
export function toCanonical(
  value: number,
  fromUnit: string,
  markerKey: string,
  catalog: BiomarkerCatalogPort,
): CanonicalConversion {
  const entry = catalog.findByCode(markerKey);
  if (entry === null) {
    return { valueCanonical: null, canonicalUnit: null, factor: null, reasons: [] };
  }

  const canonicalUnit = entry.canonicalUnit ?? null;
  const from = fromUnit.trim();

  // No canonical unit yet (uncurated marker): nothing to target. The value stays
  // unconverted and is flagged, never guessed — safe degradation.
  if (canonicalUnit === null) {
    return { valueCanonical: null, canonicalUnit: null, factor: null, reasons: ["unit_unknown"] };
  }

  // Already canonical: an implicit factor of 1, no conversion performed.
  if (from === canonicalUnit) {
    return { valueCanonical: value, canonicalUnit, factor: 1, reasons: [] };
  }

  // A curated pair exists for this source unit: apply exactly that factor.
  const factor = entry.conversions?.[from];
  if (factor !== undefined) {
    return { valueCanonical: value * factor, canonicalUnit, factor, reasons: [] };
  }

  // Unmapped unit: never guess a factor. The canonical target is known, but the
  // value stays unconverted and a human confirms the mapping.
  return { valueCanonical: null, canonicalUnit, factor: null, reasons: ["unit_unknown"] };
}
