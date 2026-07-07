import { describe, it, expect } from "vitest";
import { parseBrazilianNumber } from "./brazilian-number";

describe("parseBrazilianNumber — Brazilian notation", () => {
  it("reads a dot as the thousands separator (8.610 -> 8610)", () => {
    const result = parseBrazilianNumber("8.610");
    expect(result.value).toBe(8610);
    expect(result.censoring).toBe("none");
    expect(result.needsReview).toBe(false);
    expect(result.reasons).toEqual([]);
  });

  it("reads a comma as the decimal separator (0,03 -> 0.03)", () => {
    const result = parseBrazilianNumber("0,03");
    expect(result.value).toBe(0.03);
    expect(result.needsReview).toBe(false);
    expect(result.reasons).toEqual([]);
  });

  it("combines thousands dots and a decimal comma (1.234,56 -> 1234.56)", () => {
    const result = parseBrazilianNumber("1.234,56");
    expect(result.value).toBe(1234.56);
    expect(result.needsReview).toBe(false);
  });

  it("handles large integers with a thousands dot (197.000 -> 197000)", () => {
    const result = parseBrazilianNumber("197.000");
    expect(result.value).toBe(197000);
    expect(result.needsReview).toBe(false);
  });

  it("handles a plain integer with no separators (42 -> 42)", () => {
    expect(parseBrazilianNumber("42").value).toBe(42);
  });

  it("preserves the raw string verbatim", () => {
    expect(parseBrazilianNumber("  8.610 /µL ").raw).toBe("  8.610 /µL ");
  });

  it("strips a trailing unit and reads only the numeric token", () => {
    expect(parseBrazilianNumber("8.610 /µL").value).toBe(8610);
    expect(parseBrazilianNumber("0,03 mg/dL").value).toBe(0.03);
  });
});

describe("parseBrazilianNumber — censored values", () => {
  it("flags a less-than bound and keeps the numeric bound (< 0,3)", () => {
    const result = parseBrazilianNumber("< 0,3");
    expect(result.value).toBe(0.3);
    expect(result.censoring).toBe("less_than");
    expect(result.needsReview).toBe(true);
    expect(result.reasons).toContain("censored_value");
  });

  it("flags a greater-than bound and keeps the numeric bound (> 1.000)", () => {
    const result = parseBrazilianNumber("> 1.000");
    expect(result.value).toBe(1000);
    expect(result.censoring).toBe("greater_than");
    expect(result.reasons).toContain("censored_value");
  });

  it("accepts the unicode ≤ / ≥ operators", () => {
    expect(parseBrazilianNumber("≤0,3").censoring).toBe("less_than");
    expect(parseBrazilianNumber("≥5").censoring).toBe("greater_than");
  });
});

// The magnitude sanity check no longer lives here — it needs the value in the
// marker's canonical unit and is exercised via parse-marker-value.test.ts and
// magnitude.test.ts. This module is pure parsing and never emits
// "magnitude_out_of_range".
describe("parseBrazilianNumber — no magnitude check in the pure parser", () => {
  it("never flags magnitude, even for a wildly large value", () => {
    const result = parseBrazilianNumber("240.000");
    expect(result.value).toBe(240000);
    expect(result.reasons).not.toContain("magnitude_out_of_range");
    expect(result.needsReview).toBe(false);
  });
});

describe("parseBrazilianNumber — ambiguous separators", () => {
  it("does not guess US notation and flags it ambiguous (1,234.56)", () => {
    const result = parseBrazilianNumber("1,234.56");
    expect(result.value).toBeNull();
    expect(result.reasons).toContain("ambiguous_separator");
    expect(result.needsReview).toBe(true);
  });

  it("flags a single dot that is not a thousands group (5.2) but keeps the literal value", () => {
    const result = parseBrazilianNumber("5.2");
    expect(result.value).toBe(5.2);
    expect(result.reasons).toContain("ambiguous_separator");
    expect(result.needsReview).toBe(true);
  });

  it("flags a two-digit fractional dot group (12.34) as ambiguous", () => {
    const result = parseBrazilianNumber("12.34");
    expect(result.value).toBe(12.34);
    expect(result.reasons).toContain("ambiguous_separator");
  });

  it("rejects multiple commas as ambiguous", () => {
    const result = parseBrazilianNumber("1,2,3");
    expect(result.value).toBeNull();
    expect(result.reasons).toContain("ambiguous_separator");
  });

  it("rejects malformed multi-dot grouping as ambiguous (1.23.456)", () => {
    const result = parseBrazilianNumber("1.23.456");
    expect(result.value).toBeNull();
    expect(result.reasons).toContain("ambiguous_separator");
  });
});

describe("parseBrazilianNumber — unparseable input", () => {
  it("flags a string with no digits as unparseable", () => {
    const result = parseBrazilianNumber("não realizado");
    expect(result.value).toBeNull();
    expect(result.reasons).toContain("unparseable");
    expect(result.needsReview).toBe(true);
  });

  it("flags an empty string as unparseable", () => {
    const result = parseBrazilianNumber("");
    expect(result.value).toBeNull();
    expect(result.reasons).toContain("unparseable");
  });
});
