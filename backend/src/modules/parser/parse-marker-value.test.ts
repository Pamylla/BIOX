import { describe, it, expect } from "vitest";
import { parseMarkerValue } from "./parse-marker-value";
import type {
  BiomarkerCatalogPort,
  CatalogEntry,
} from "./biomarker-catalog.port";

// A synthetic in-memory catalog for the tests. The bands and conversion pairs
// are illustrative and expressed in each entry's canonical unit — NOT real
// clinical reference data.
const ENTRIES: Record<string, CatalogEntry> = {
  pcr_us: { code: "pcr_us", canonicalUnit: "mg/L", conversions: { "mg/dL": 10 }, plausibleMagnitude: { min: 0.1, max: 20 } },
  ferritina: { code: "ferritina", canonicalUnit: "ng/mL", plausibleMagnitude: { min: 11, max: 307 } },
  enzima: { code: "enzima", canonicalUnit: "U/L", conversions: { "kU/L": 1000 }, plausibleMagnitude: { min: 1, max: 10 } },
  peso: { code: "peso", canonicalUnit: "kg" }, // no plausibility band
};

const catalog: BiomarkerCatalogPort = {
  findByCode: (code) => ENTRIES[code] ?? null,
};

describe("parseMarkerValue — convert to canonical, then check magnitude", () => {
  it("converts with the catalog's factor before checking, and passes an in-band value", () => {
    // hs-CRP printed as 0,03 mg/dL; the catalog's ×10 pair -> 0.3 mg/L, in band.
    const result = parseMarkerValue(
      { catalogKey: "pcr_us", rawValue: "0,03", unit: "mg/dL" },
      catalog,
    );
    expect(result.value).toBe(0.03);
    expect(result.valueCanonical).toBeCloseTo(0.3);
    expect(result.canonicalUnit).toBe("mg/L");
    expect(result.conversionFactor).toBe(10);
    expect(result.reasons).not.toContain("magnitude_out_of_range");
    expect(result.needsReview).toBe(false);
  });

  it("checks the CANONICAL value, not the raw one", () => {
    // Raw 5 sits inside the [1, 10] band, but the catalog's ×1000 pair -> 5000
    // U/L is far outside. A check on the raw value would wrongly pass; on the
    // canonical value it flags.
    const result = parseMarkerValue(
      { catalogKey: "enzima", rawValue: "5", unit: "kU/L" },
      catalog,
    );
    expect(result.value).toBe(5);
    expect(result.valueCanonical).toBe(5000);
    expect(result.reasons).toContain("magnitude_out_of_range");
    expect(result.needsReview).toBe(true);
  });

  it("defaults to factor 1 when the report unit already is the canonical unit", () => {
    const ok = parseMarkerValue(
      { catalogKey: "ferritina", rawValue: "120", unit: "ng/mL" },
      catalog,
    );
    expect(ok.conversionFactor).toBe(1);
    expect(ok.valueCanonical).toBe(120);
    expect(ok.reasons).toEqual([]);
    expect(ok.needsReview).toBe(false);

    // A separator slip: 240.000 ng/mL is ~1000x above the band.
    const bad = parseMarkerValue(
      { catalogKey: "ferritina", rawValue: "240.000", unit: "ng/mL" },
      catalog,
    );
    expect(bad.valueCanonical).toBe(240000);
    expect(bad.reasons).toContain("magnitude_out_of_range");
    expect(bad.needsReview).toBe(true);
  });

  it("combines censoring and magnitude flags when both apply", () => {
    const result = parseMarkerValue(
      { catalogKey: "ferritina", rawValue: "> 10.000", unit: "ng/mL" },
      catalog,
    );
    expect(result.censoring).toBe("greater_than");
    expect(result.reasons).toContain("censored_value");
    expect(result.reasons).toContain("magnitude_out_of_range");
    expect(result.needsReview).toBe(true);
  });
});

describe("parseMarkerValue — integration: number -> unit -> magnitude, in order", () => {
  it("runs the three steps in order on a raw BR value and stays clean when plausible", () => {
    // "3,0" (BR decimal) -> 3.0 mg/dL -> ×10 -> 30 mg/L. Band 0.1..20 widened by
    // ~5x tolerance -> ~100, so 30 is plausible. Every step must fire in order.
    const result = parseMarkerValue(
      { catalogKey: "pcr_us", rawValue: "3,0", unit: "mg/dL" },
      catalog,
    );
    expect(result.value).toBe(3); // number step: comma is the decimal
    expect(result.conversionFactor).toBe(10); // unit step: catalog pair
    expect(result.valueCanonical).toBe(30); // 3 mg/dL -> 30 mg/L
    expect(result.reasons).toEqual([]);
    expect(result.needsReview).toBe(false);
  });

  it("catches a ~100x conversion error via the magnitude check on the CANONICAL value", () => {
    // A mis-entered "300" mg/dL is ~100x too high for hs-CRP. The number parses
    // fine and the unit converts fine (×10 -> 3000 mg/L); only the magnitude
    // check on the canonical value (band max 20, ~100 with tolerance) catches it.
    const result = parseMarkerValue(
      { catalogKey: "pcr_us", rawValue: "300", unit: "mg/dL" },
      catalog,
    );
    expect(result.value).toBe(300); // number step: parses cleanly
    expect(result.conversionFactor).toBe(10); // unit step: converts cleanly
    expect(result.valueCanonical).toBe(3000); // 300 mg/dL -> 3000 mg/L
    expect(result.reasons).toContain("magnitude_out_of_range"); // caught on canonical
    expect(result.needsReview).toBe(true);
  });
});

describe("parseMarkerValue — when the check cannot or should not run", () => {
  it("skips the check for a marker with no plausibility band", () => {
    const result = parseMarkerValue(
      { catalogKey: "peso", rawValue: "999.999", unit: "kg" },
      catalog,
    );
    expect(result.valueCanonical).toBe(999999);
    expect(result.reasons).not.toContain("magnitude_out_of_range");
    expect(result.needsReview).toBe(false);
  });

  it("cannot canonicalize an unknown catalog code, so it never checks magnitude", () => {
    const result = parseMarkerValue(
      { catalogKey: "does_not_exist", rawValue: "120", unit: "ng/mL" },
      catalog,
    );
    expect(result.value).toBe(120);
    expect(result.canonicalUnit).toBeNull();
    expect(result.valueCanonical).toBeNull();
    expect(result.conversionFactor).toBeNull();
    expect(result.reasons).not.toContain("magnitude_out_of_range");
  });

  it("does not guess a conversion: an unmapped unit is flagged, never converted", () => {
    const result = parseMarkerValue(
      { catalogKey: "pcr_us", rawValue: "0,03", unit: "nmol/L" }, // no pair for nmol/L
      catalog,
    );
    expect(result.value).toBe(0.03);
    expect(result.conversionFactor).toBeNull();
    expect(result.valueCanonical).toBeNull();
    expect(result.reasons).toContain("unit_unknown");
    expect(result.needsReview).toBe(true);
    expect(result.reasons).not.toContain("magnitude_out_of_range");
  });

  it("passes an unparseable value straight through without a magnitude check", () => {
    const result = parseMarkerValue(
      { catalogKey: "ferritina", rawValue: "não realizado", unit: "ng/mL" },
      catalog,
    );
    expect(result.value).toBeNull();
    expect(result.valueCanonical).toBeNull();
    expect(result.reasons).toContain("unparseable");
    expect(result.reasons).not.toContain("magnitude_out_of_range");
    expect(result.needsReview).toBe(true);
  });
});
