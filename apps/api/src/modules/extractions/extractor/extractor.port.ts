/**
 * The LLM boundary of the extraction worker (plan §11.3 step 2). The worker
 * depends on this port, never on the Anthropic SDK — the whole deterministic
 * pipeline (zod validation, Brazilian numbers, aliases, plausibility) stays
 * testable with a fake extractor, and the prompt/model can be swapped without
 * touching pipeline code.
 */

/** What one extractor call produces — raw output plus the audit trail fields. */
export interface ExtractorResult {
  /** Parsed JSON exactly as the model returned it. Persisted verbatim to Extraction.rawOutput; the worker validates it against the shared zod schema (step 3). */
  output: unknown;
  /** Model that ran the extraction, e.g. "claude-opus-4-8" — persisted to Extraction.model. */
  model: string;
  /** Versioned prompt id, e.g. "extractor-v0-placeholder" — persisted to Extraction.promptVersion. */
  promptVersion: string;
}

/** Abstract class (not interface) so it doubles as the Nest injection token. */
export abstract class ExtractorPort {
  /** Rejects with ExtractorError when the model refuses, truncates, or returns non-JSON. */
  abstract extract(reportPdf: Buffer): Promise<ExtractorResult>;
}
