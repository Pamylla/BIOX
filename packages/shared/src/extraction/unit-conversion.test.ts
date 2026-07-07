import { describe, it, expect } from "vitest";
import { toCanonical } from "./unit-conversion";
import type { BiomarkerCatalogPort, CatalogEntry } from "./biomarker-catalog.port";

// Synthetic in-memory catalog. Canonical units and conversion pairs are
// illustrative of the SHAPE the port carries — not curated clinical data.
const ENTRIES: Record<string, CatalogEntry> = {
  // hs-CRP: canonical mg/L, reports sometimes print mg/dL (×10).
  pcr_us: { code: "pcr_us", canonicalUnit: "mg/L", conversions: { "mg/dL": 10 } },
  // Ferritin: canonical ng/mL, no conversion pairs curated yet.
  ferritina: { code: "ferritina", canonicalUnit: "ng/mL" },
};

const catalog: BiomarkerCatalogPort = {
  findByCode: (code) => ENTRIES[code] ?? null,
};

describe("toCanonical", () => {
  it("converts with the catalog's factor (mg/dL -> mg/L, ×10)", () => {
    const r = toCanonical(0.03, "mg/dL", "pcr_us", catalog);
    expect(r.factor).toBe(10);
    expect(r.valueCanonical).toBeCloseTo(0.3);
    expect(r.canonicalUnit).toBe("mg/L");
    expect(r.reasons).toEqual([]);
  });

  it("leaves an already-canonical unit unchanged (factor 1)", () => {
    const r = toCanonical(120, "ng/mL", "ferritina", catalog);
    expect(r.factor).toBe(1);
    expect(r.valueCanonical).toBe(120);
    expect(r.canonicalUnit).toBe("ng/mL");
    expect(r.reasons).toEqual([]);
  });

  it("never converts an unmapped unit — flags it for review instead", () => {
    const r = toCanonical(5, "nmol/L", "pcr_us", catalog);
    expect(r.factor).toBeNull();
    expect(r.valueCanonical).toBeNull(); // no guessed factor
    expect(r.canonicalUnit).toBe("mg/L"); // target is still known
    expect(r.reasons).toContain("unit_unknown");
  });

  it("returns nulls without a unit flag when the marker code is unknown", () => {
    const r = toCanonical(5, "mg/L", "does_not_exist", catalog);
    expect(r.canonicalUnit).toBeNull();
    expect(r.valueCanonical).toBeNull();
    expect(r.factor).toBeNull();
    expect(r.reasons).toEqual([]);
  });
});
