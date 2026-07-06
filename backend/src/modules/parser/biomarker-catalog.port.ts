/**
 * biomarker-catalog.port.ts
 *
 * The catalog abstraction the parser depends on. The parser must NOT reach for
 * the concrete `Biomarker` catalog (a curated dataset that lives in the
 * `biomarker` module) — it depends only on this port, and the concrete catalog
 * implements it (Dependency Inversion; see ADR-007's rationale note that "the
 * parser depends on a catalog port, not the concrete catalog").
 *
 * The port exposes only the slice the parser needs to normalize and
 * sanity-check a value: the canonical unit and the parsing plausibility band.
 */

import type { PlausibleMagnitude } from "./magnitude";

/** The parser-facing view of a catalog `Biomarker`. */
export interface CatalogEntry {
  /** Stable catalog code — matches ExtractedMarker.catalogKey. */
  code: string;
  /**
   * The unit every `Measurement` of this marker is normalized to (FR-09).
   * Optional: a marker whose clinical reference data is not yet curated may lack
   * it. Without a canonical unit nothing can be converted, so any reported unit
   * is flagged for review rather than trusted — safe degradation, never a guess.
   */
  canonicalUnit?: string;
  /**
   * Known unit→canonical conversion factors for this marker, keyed by the source
   * unit exactly as it may appear on a report (e.g. `{ "mg/dL": 10 }` for a
   * marker whose `canonicalUnit` is `mg/L`). Multiply a value in the source unit
   * by its factor to reach `canonicalUnit`. The canonical unit itself is NOT
   * listed here — it is an implicit factor of 1. Optional and curated
   * marker-by-marker: a marker with no pairs can only accept values that are
   * already in `canonicalUnit`; any other unit is unmapped and flagged for
   * review, never converted with a guessed factor.
   */
  conversions?: Record<string, number>;
  /**
   * Parsing plausibility band, in `canonicalUnit`. Optional: a marker without
   * one simply skips the magnitude sanity check. This is NOT a clinical
   * reference range — those are never in the catalog and always come
   * per-`Measurement` from the report (ADR-002).
   */
  plausibleMagnitude?: PlausibleMagnitude;
}

/** Read-only lookup the parser uses to resolve a marker's canonical facts. */
export interface BiomarkerCatalogPort {
  /** Resolve a catalog entry by its stable code; `null` if the code is unknown. */
  findByCode(code: string): CatalogEntry | null;
}
