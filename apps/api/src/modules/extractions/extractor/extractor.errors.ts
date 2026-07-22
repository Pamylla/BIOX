/** Missing/invalid extractor env — a server misconfiguration, fail fast at boot. */
export class ExtractorConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractorConfigError";
  }
}

/** An extractor call that produced no usable output (refusal, truncation, non-JSON). */
export class ExtractorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractorError";
  }
}
