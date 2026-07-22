/**
 * Extraction — framework-agnostic parsing of a lab report's raw values into
 * normalized, review-flagged measurements. No I/O, no framework: pure functions
 * importable by the API worker and testable in isolation.
 */
export * from "./brazilian-number";
export * from "./magnitude";
export * from "./unit-conversion";
export * from "./biomarker-catalog.port";
export * from "./parse-marker-value";
export * from "./extractor-output";
