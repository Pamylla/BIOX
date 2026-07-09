/**
 * @biox/shared — the deterministic, framework-agnostic core of BIOX.
 *
 * Everything computed "in code, not AI" lives here (extraction normalization,
 * the biomarker catalog, and — later — the flag & score engines). Zero
 * dependency on Nest or React, so both apps import the same source of truth.
 */
export * from "./extraction";
export * from "./catalog";
export * from "./contracts";
export * from "./engines";
