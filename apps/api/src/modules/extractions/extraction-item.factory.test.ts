import { biomarkerCatalog, type ExtractorItem } from "@biox/shared";
import { describe, expect, it } from "vitest";
import { toExtractionItemData } from "./extraction-item.factory";

/** A well-formed transcribed marker; override per test. */
function item(overrides: Partial<ExtractorItem> = {}): ExtractorItem {
  return {
    rawLabel: "Ferritina",
    rawValue: "8.610",
    valueLabel: null,
    unit: "ng/mL",
    refLow: "11",
    refHigh: "307",
    refRaw: "11 a 307 ng/mL",
    assayMethod: null,
    confidence: "high",
    ...overrides,
  };
}

describe("toExtractionItemData", () => {
  it("resolves the catalog synonym, parses the Brazilian number, and keeps high confidence", () => {
    const data = toExtractionItemData(item(), biomarkerCatalog);

    expect(data.biomarkerKey).toBe("ferritina");
    expect(data.value).toBe(8610);
    expect(data.unit).toBe("ng/mL");
    expect(data.confidence).toBe("high");
    expect(data.plausibility).toBe("ok");
  });

  it("parses reference bounds into report-unit numbers", () => {
    const data = toExtractionItemData(item(), biomarkerCatalog);

    expect(data.refLow).toBe(11);
    expect(data.refHigh).toBe(307);
    expect(data.refRaw).toBe("11 a 307 ng/mL");
  });

  it("downgrades to low + out_of_magnitude when the canonical value fails the plausibility band", () => {
    // hs-CRP band is 0.01–500 mg/L; 500 mg/dL converts to 5000 mg/L — far past the fuse.
    const data = toExtractionItemData(
      item({ rawLabel: "PCR-us", rawValue: "500", unit: "mg/dL", refLow: null, refHigh: null }),
      biomarkerCatalog,
    );

    expect(data.biomarkerKey).toBe("pcr_us");
    expect(data.value).toBe(500); // stored in the printed unit, not the canonical
    expect(data.plausibility).toBe("out_of_magnitude");
    expect(data.confidence).toBe("low");
  });

  it("leaves an unresolved marker keyless but still parses its number", () => {
    const data = toExtractionItemData(
      item({ rawLabel: "Colesterol Total", rawValue: "180", unit: "mg/dL" }),
      biomarkerCatalog,
    );

    expect(data.biomarkerKey).toBeNull();
    expect(data.value).toBe(180);
    expect(data.plausibility).toBe("ok"); // no catalog entry ⇒ no magnitude check
    expect(data.confidence).toBe("high");
  });

  it("captures a censored value's qualifier and its bound", () => {
    const data = toExtractionItemData(
      item({ rawLabel: "PCR-us", rawValue: "< 0,3", unit: "mg/dL" }),
      biomarkerCatalog,
    );

    expect(data.valueQualifier).toBe("<");
    expect(data.value).toBe(0.3);
  });

  it("passes through a qualitative-only result with no numeric value", () => {
    const data = toExtractionItemData(
      item({ rawLabel: "HIV", rawValue: null, valueLabel: "Não reagente", unit: null }),
      biomarkerCatalog,
    );

    expect(data.value).toBeNull();
    expect(data.valueQualifier).toBeNull();
    expect(data.valueLabel).toBe("Não reagente");
  });

  it("caps confidence at medium when the separator is ambiguous, keeping the literal value", () => {
    // "5.2" is a single dot not forming a thousands group — the parser takes the
    // literal float but flags it ambiguous, so a human confirms it in review.
    const data = toExtractionItemData(
      item({ rawValue: "5.2", confidence: "high" }),
      biomarkerCatalog,
    );

    expect(data.value).toBe(5.2);
    expect(data.confidence).toBe("medium");
    expect(data.plausibility).toBe("ok");
  });

  it("caps confidence at medium when the number cannot be parsed", () => {
    const data = toExtractionItemData(
      item({ rawValue: "vide observação", confidence: "high" }),
      biomarkerCatalog,
    );

    expect(data.value).toBeNull();
    expect(data.confidence).toBe("medium");
  });

  it("never raises the model's confidence — a clean parse leaves low as low", () => {
    const data = toExtractionItemData(item({ confidence: "low" }), biomarkerCatalog);

    expect(data.confidence).toBe("low");
  });
});
