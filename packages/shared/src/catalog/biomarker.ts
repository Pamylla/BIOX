/**
 * biomarker.ts
 *
 * The `Biomarker` catalog entry — the global definition of a marker (ferritin,
 * hs-CRP, TSH, weight). One entry exists per marker, shared across all patients;
 * every `Measurement` points to one. See docs/02-domain/biomarker.md and
 * docs/02-domain/biomarker-catalog.md.
 *
 * This file defines the SHAPE of a catalog entry. The ~22 real entries are
 * curated clinical reference data and are filled in from the source, never
 * generated.
 */

// `plausibleMagnitude` is a parsing-safety concept (see magnitude.ts), not
// clinical data, so its type is owned by the parser module. This cross-module
// type import moves to the planned shared-types package once it exists (ADR-007).
import type { PlausibleMagnitude } from "../extraction/magnitude";

/** Where a marker comes from. */
export type BiomarkerType = "laboratory" | "anthropometric";

/** The five scoring domains. */
export type Domain =
  | "Inflammation"
  | "Iron"
  | "Metabolic"
  | "Thyroid"
  | "Cardiovascular";

/** How to read the value clinically (the sense of the reading, not the numbers). */
export type Direction = "high_bad" | "low_bad" | "range" | "context";

export interface Biomarker {
  /** Stable internal identifier — never shown to users, never reused. */
  code: string;
  /** Display name, e.g. "Ferritin". */
  canonicalName: string;
  /** The unit all `Measurements` of this marker are normalized to (FR-09). */
  canonicalUnit: string;
  /** `laboratory` (parsed from a report) or `anthropometric` (manual entry). */
  type: BiomarkerType;
  /**
   * The single domain where the marker scores. `null` for markers that score in
   * no domain (e.g. an anthropometric or a context-only marker).
   */
  primaryDomain: Domain | null;
  /** Domains where the marker is interpretive context only — it does not score there. */
  secondaryDomains: Domain[];
  /** How to read the value: `high_bad` · `low_bad` · `range` · `context`. */
  direction: Direction;
  /** Parser aliases — the names/abbreviations this marker appears under in reports. */
  synonyms: string[];
  /**
   * Parsing plausibility band, expressed in `canonicalUnit` — the expected
   * order of magnitude for a real value, used ONLY to catch separator/parse
   * errors (spike #8).
   *
   * This is deliberately SEPARATE from the clinical reference range and does
   * not violate ADR-002: the reference range is never in the catalog and always
   * comes per-`Measurement` from the report. This band is a parsing safety net,
   * not a clinical judgement. Optional — a marker without one skips the check.
   */
  plausibleMagnitude?: PlausibleMagnitude;
}
