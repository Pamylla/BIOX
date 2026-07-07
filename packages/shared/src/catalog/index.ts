/**
 * Biomarker catalog — the curated, versioned-in-repo definition of every marker
 * BIOX understands (keys, synonyms, domains, plausibleMagnitude). A TypeScript
 * module, not a DB table (see docs/02-domain/biomarker-catalog.md).
 *
 * `biomarker.ts` (the `Biomarker` shape) is intentionally NOT re-exported here:
 * it is a parallel, doc-aligned definition that the running catalog does not use
 * — the catalog is built on `BiomarkerDefinition` (biomarker.types.ts). Exporting
 * both would collide on `Direction`. Reconciling the two shapes is a domain
 * decision, tracked as a follow-up, not part of the monorepo restructure.
 */
export * from "./biomarker.types";
export * from "./biomarker-catalog";
export * from "./biomarker-catalog.data";
