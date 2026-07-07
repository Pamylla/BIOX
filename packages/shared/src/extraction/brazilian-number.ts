/**
 * brazilian-number.ts
 *
 * Parses numeric values from Brazilian lab reports. This is the highest-risk
 * conversion in the BIOX pipeline: a separator mistake can change a value by
 * orders of magnitude and invalidate an entire analysis. Every path is
 * explicit; nothing is silently resolved.
 *
 * This module is intentionally PURE number parsing — separator resolution and
 * censoring only. The magnitude sanity check lives in `magnitude.ts` and is
 * wired to the value by `parse-marker-value.ts`, which first converts the value
 * to the marker's canonical unit (the plausibility band is defined in that
 * unit) before checking it.
 *
 * Rules (see docs/03-architecture/parser-spike.md #8 and extraction-schema.md):
 *  - Comma (",") is ALWAYS the decimal separator. Never thousands.
 *  - Dot (".") is ALWAYS the thousands separator. Never decimal.
 *  - The raw string is always preserved by the caller; this module returns the
 *    parsed value plus enough metadata for a human to review.
 *  - Ambiguous input is flagged, never guessed.
 */

export type Censoring = "none" | "less_than" | "greater_than";

export interface ParsedNumber {
  /** The exact string received, preserved verbatim. */
  raw: string;
  /** Normalized numeric value, or null if it could not be parsed unambiguously. */
  value: number | null;
  /** Whether the value was reported as "< x" or "> x". */
  censoring: Censoring;
  /** True if a human must confirm before this value is trusted. */
  needsReview: boolean;
  /** Machine-readable reasons for review (empty when clean). */
  reasons: NumberReviewReason[];
}

export type NumberReviewReason =
  | "unparseable"        // could not extract a number at all
  | "ambiguous_separator" // dot/comma pattern is not resolvable with confidence
  | "censored_value"     // "< x" / "> x" — value is a bound, not a point
  | "magnitude_out_of_range"; // canonical value failed the plausibility check — emitted by parse-marker-value, not this module

/**
 * Parse a Brazilian-formatted numeric string.
 *
 * Handles: "8.610" -> 8610, "0,03" -> 0.03, "197.000" -> 197000,
 * "1.234,56" -> 1234.56, "< 0,3" -> {value: 0.3, censoring: less_than},
 * "> 1.000" -> {value: 1000, censoring: greater_than}.
 *
 * Does NOT decide clinical meaning and does NOT run the magnitude check — only
 * converts and flags separator/censoring concerns.
 */
export function parseBrazilianNumber(input: string): ParsedNumber {
  const raw = input;
  const reasons: NumberReviewReason[] = [];

  // 1. Detect censoring and strip the operator.
  let censoring: Censoring = "none";
  let s = input.trim();

  // Match a leading comparison operator, with or without spaces.
  const lt = /^[<≤]\s*/;
  const gt = /^[>≥]\s*/;
  if (lt.test(s)) {
    censoring = "less_than";
    s = s.replace(lt, "");
  } else if (gt.test(s)) {
    censoring = "greater_than";
    s = s.replace(gt, "");
  }

  // 2. Isolate the numeric token: drop any trailing unit or words.
  //    Keep digits, dot, comma, and a leading minus.
  const cleaned = s.replace(/\s+/g, " ").trim();
  const token = extractNumericToken(cleaned);

  if (token === null) {
    reasons.push("unparseable");
    return { raw, value: null, censoring, needsReview: true, reasons };
  }

  // 3. Convert using the Brazilian rule, tracking ambiguity.
  const conv = brToNumber(token);
  if (conv.value === null) {
    // A null value with the ambiguity flag set is a separator we could not
    // resolve with confidence (e.g. US notation "1,234.56"), NOT a missing
    // number — keep those distinct so the review modal shows the right reason.
    reasons.push(conv.ambiguous ? "ambiguous_separator" : "unparseable");
    return { raw, value: null, censoring, needsReview: true, reasons };
  }
  if (conv.ambiguous) {
    reasons.push("ambiguous_separator");
  }

  const value = conv.value;

  // 4. Censored values are bounds, not points — always worth a review flag.
  //    The magnitude sanity check is NOT run here: it needs the value in the
  //    marker's canonical unit, so it happens in parse-marker-value.ts.
  if (censoring !== "none") {
    reasons.push("censored_value");
  }

  return {
    raw,
    value,
    censoring,
    needsReview: reasons.length > 0,
    reasons,
  };
}

/**
 * Extract the first numeric-looking token from a string, keeping only
 * digits, dots, commas and a leading sign. Returns null if none found.
 */
function extractNumericToken(s: string): string | null {
  // Grab a run of digits with optional dots/commas, optional leading minus.
  const m = s.match(/-?\d[\d.,]*/);
  return m ? m[0] : null;
}

interface BrConversion {
  value: number | null;
  ambiguous: boolean;
}

/**
 * Core Brazilian-notation conversion.
 *  - comma = decimal, dot = thousands.
 *  - Validates thousands grouping; flags patterns that don't fit the rule
 *    as ambiguous rather than guessing.
 */
function brToNumber(token: string): BrConversion {
  const negative = token.startsWith("-");
  let t = negative ? token.slice(1) : token;

  const hasComma = t.includes(",");
  const hasDot = t.includes(".");

  let ambiguous = false;
  let normalized: string;

  if (hasComma && hasDot) {
    // Standard BR: dots are thousands, comma is decimal. "1.234,56"
    // The comma must come after all dots; otherwise it's US notation or malformed.
    const lastComma = t.lastIndexOf(",");
    const lastDot = t.lastIndexOf(".");
    if (lastDot > lastComma) {
      // e.g. "1,234.56" — US notation, not BR. Do not guess a value; the
      // caller will send this to human review.
      return { value: null, ambiguous: true };
    }
    if (t.indexOf(",") !== lastComma) {
      // more than one comma — malformed
      return { value: null, ambiguous: true };
    }
    normalized = t.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // Only comma → decimal separator. "0,03"
    if (t.indexOf(",") !== t.lastIndexOf(",")) {
      return { value: null, ambiguous: true }; // multiple commas
    }
    normalized = t.replace(",", ".");
  } else if (hasDot) {
    // Only dot(s). Could be thousands ("8.610", "197.000") or, in messy data,
    // a decimal. Apply the BR rule: dot = thousands — BUT verify the grouping.
    const parts = t.split(".");
    const head = parts[0] ?? "";
    const validGrouping =
      parts.length >= 2 &&
      head.length >= 1 &&
      head.length <= 3 &&
      parts.slice(1).every((p) => p.length === 3);
    if (validGrouping) {
      normalized = parts.join("");
    } else if (parts.length === 2 && parts[1]?.length !== 3) {
      // Single dot not forming a thousands group (e.g. "5.2" or "12.34").
      // Under strict BR rules this shouldn't be a decimal, but real reports
      // occasionally emit it. Do NOT guess — flag as ambiguous and take the
      // literal float so a human can confirm.
      ambiguous = true;
      normalized = t; // parseFloat will read the dot as decimal
    } else {
      // Multiple dots but not clean thousands grouping → malformed.
      return { value: null, ambiguous: true };
    }
  } else {
    // Plain integer.
    normalized = t;
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) {
    // Not a resolvable number at all — this is a missing/garbage token, not a
    // separator ambiguity.
    return { value: null, ambiguous: false };
  }
  return { value: negative ? -n : n, ambiguous };
}
