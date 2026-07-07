/**
 * magnitude.ts
 *
 * The parsing plausibility band and the sanity check that runs against it.
 *
 * This is a PARSING safety net, not clinical data. Its only job is to catch
 * separator/parse errors (spike #8) that shift a value by ~10x, 100x, 1000x —
 * it must never flag a genuinely high or low clinical result. It is deliberately
 * kept separate from the clinical reference range, which is never stored in the
 * catalog and always comes per-`Measurement` from the report (ADR-002).
 *
 * The band is expressed in the marker's canonical unit, so the value MUST be
 * converted to that unit before the check (see `parse-marker-value.ts`).
 */

/** Expected order-of-magnitude band for a marker, in its canonical unit. */
export interface PlausibleMagnitude {
  /** Lowest plausible value (canonical unit); used for magnitude, not clinical flagging. */
  min?: number;
  /** Highest plausible value (canonical unit). */
  max?: number;
  /**
   * How many orders of magnitude of slack to allow around [min, max] before
   * flagging. Default 0.7 (≈5x) — calibrated so that separator errors (10x,
   * 100x, 1000x) are caught while genuinely high/low clinical results within
   * ~5x of the band pass without a needless review flag. Raise it to be more
   * permissive, lower it to be stricter. This is a tunable safety knob.
   */
  toleranceOrders?: number;
}

/**
 * Sanity check: is the canonical value plausibly within the marker's expected
 * band, allowing a tolerance factor for genuinely high/low clinical results?
 *
 * The goal is to catch SEPARATOR ERRORS (which shift a value by ~10x, 100x,
 * 1000x) without flagging a normal out-of-range clinical result. We compare
 * against the band [min, max] widened by a multiplicative factor derived from
 * `toleranceOrders` (1 order = 10x). A ferritin of 2400 against a band of
 * 11–307 is well above max×5 -> out of band.
 *
 * `valueCanonical` MUST already be in the same unit as the band.
 */
export function isWithinPlausibleMagnitude(
  valueCanonical: number,
  band: PlausibleMagnitude,
): boolean {
  if (valueCanonical === 0) return true; // zero is not a magnitude error
  const tol = band.toleranceOrders ?? 0.7;
  const factor = Math.pow(10, tol); // 1 order -> 10x slack on each side
  const absVal = Math.abs(valueCanonical);

  // Lower bound: value must not be far below the expected minimum.
  if (band.min !== undefined && band.min > 0) {
    const lowerLimit = band.min / factor;
    if (absVal < lowerLimit) return false;
  }
  // Upper bound: value must not be far above the expected maximum.
  if (band.max !== undefined && band.max > 0) {
    const upperLimit = band.max * factor;
    if (absVal > upperLimit) return false;
  }
  return true;
}
