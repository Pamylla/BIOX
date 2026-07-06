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
  /** The unit every `Measurement` of this marker is normalized to (FR-09). */
  canonicalUnit: string;
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
