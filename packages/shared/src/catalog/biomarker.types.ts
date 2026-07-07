/**
 * biomarker.types.ts
 *
 * The full curated shape of a catalog `Biomarker` (see docs/02-domain/biomarker.md
 * and biomarker-catalog.md). This is the RICH internal model of the `biomarker`
 * module — a superset of the parser-facing `CatalogEntry` port. The concrete
 * catalog stores these; the parser only ever sees the port's narrow slice.
 */

import type { PlausibleMagnitude } from "../extraction/magnitude";

/** The five scoring domains of the MVP. */
export type HealthDomain =
  | "Inflammation"
  | "Iron"
  | "Metabolic"
  | "Thyroid"
  | "Cardiovascular";

/** How the value is read clinically (see biomarker.md). */
export type Direction = "high_bad" | "low_bad" | "range" | "context";

/** Origin of the measurement: parsed from a report vs. entered by hand. */
export type MarkerType = "laboratory" | "anthropometric";

export interface BiomarkerDefinition {
  /** Stable internal code; matches ExtractedMarker.catalogKey. Never reused. */
  code: string;
  /** Display name (e.g. "Ferritin"). */
  canonicalName: string;
  /** Parser aliases: the spellings this marker appears under in BR reports. */
  synonyms: string[];
  /** The single domain where the marker scores; null for context-only/anthropometric. */
  primaryDomain: HealthDomain | null;
  /** Domains where the marker is interpretive context only — it does not score. */
  secondaryDomains: HealthDomain[];
  /** The sense of the reading. */
  direction: Direction;
  /** Laboratory (from a report) or anthropometric (manual entry). */
  type: MarkerType;
  /**
   * The unit values are normalized to (FR-09). Optional: left unset while the
   * marker's clinical reference data is not yet curated (`pending`). Without it
   * the parser cannot canonicalize and flags the value for review.
   */
  canonicalUnit?: string;
  /**
   * Curated source-unit → canonical factors. The canonical unit is an implicit
   * factor of 1 and is never listed. An unlisted unit is flagged, never guessed.
   */
  conversions?: Record<string, number>;
  /**
   * Parsing plausibility band, in `canonicalUnit`. Optional: a marker without
   * one simply skips the magnitude sanity check (safe degradation).
   */
  plausibleMagnitude?: PlausibleMagnitude;
  /**
   * True while clinical reference data (canonicalUnit / conversions /
   * plausibleMagnitude) is NOT yet curated for this marker. The known fields
   * (code, name, domains, direction, synonyms) are present; the numeric
   * reference data is deliberately absent rather than guessed.
   */
  pending?: boolean;
}
