import { describe, it, expect } from "vitest";
import {
  biomarkerCatalog,
  createBiomarkerCatalog,
} from "./biomarker-catalog";
import { parseMarkerValue } from "../parser/parse-marker-value";
import type { BiomarkerDefinition } from "./biomarker.types";

describe("biomarkerCatalog — synonym lookup with varied spellings", () => {
  it("resolves the confirmed markers under accent/case/punctuation variants", () => {
    for (const alias of ["ferritina", "Ferritin", "  FERRITINA  "]) {
      expect(biomarkerCatalog.findBySynonym(alias)?.code).toBe("ferritina");
    }
    for (const alias of ["triglicerídeos", "Triglicerides", "TG", "triglicerideos"]) {
      expect(biomarkerCatalog.findBySynonym(alias)?.code).toBe("triglicerideos");
    }
    for (const alias of ["PCR-us", "PCR ultrassensível", "PCRus", "hs-CRP"]) {
      expect(biomarkerCatalog.findBySynonym(alias)?.code).toBe("pcr_us");
    }
  });

  it("returns null for an unrecognized name", () => {
    expect(biomarkerCatalog.findBySynonym("marcador inexistente")).toBeNull();
  });
});

describe("biomarkerCatalog — confirmed canonical units and conversions", () => {
  it("triglycerides: mg/dL, mmol/L ×88.57", () => {
    const e = biomarkerCatalog.findByCode("triglicerideos");
    expect(e?.canonicalUnit).toBe("mg/dL");
    expect(e?.conversions?.["mmol/L"]).toBe(88.57);
  });

  it("ferritin: ng/mL, µg/L ×1 (unit identity)", () => {
    const e = biomarkerCatalog.findByCode("ferritina");
    expect(e?.canonicalUnit).toBe("ng/mL");
    expect(e?.conversions?.["µg/L"]).toBe(1);
  });

  it("hs-CRP: mg/L, mg/dL ×10", () => {
    const e = biomarkerCatalog.findByCode("pcr_us");
    expect(e?.canonicalUnit).toBe("mg/L");
    expect(e?.conversions?.["mg/dL"]).toBe(10);
  });
});

describe("biomarkerCatalog — parser port plugged into the concrete catalog", () => {
  it("converts hs-CRP mg/dL -> mg/L using the catalog's ×10 pair", () => {
    const r = parseMarkerValue(
      { catalogKey: "pcr_us", rawValue: "0,03", unit: "mg/dL" },
      biomarkerCatalog,
    );
    expect(r.canonicalUnit).toBe("mg/L");
    expect(r.conversionFactor).toBe(10);
    expect(r.valueCanonical).toBeCloseTo(0.3);
  });

  it("treats an already-canonical value as factor 1", () => {
    const r = parseMarkerValue(
      { catalogKey: "triglicerideos", rawValue: "150", unit: "mg/dL" },
      biomarkerCatalog,
    );
    expect(r.conversionFactor).toBe(1);
    expect(r.valueCanonical).toBe(150);
    expect(r.needsReview).toBe(false);
  });

  it("applies a unit-identity pair (ferritin µg/L -> ng/mL, factor 1)", () => {
    const r = parseMarkerValue(
      { catalogKey: "ferritina", rawValue: "120", unit: "µg/L" },
      biomarkerCatalog,
    );
    expect(r.conversionFactor).toBe(1);
    expect(r.valueCanonical).toBe(120);
  });

  it("flags an unmapped unit instead of guessing a factor", () => {
    const r = parseMarkerValue(
      { catalogKey: "ferritina", rawValue: "120", unit: "pmol/L" },
      biomarkerCatalog,
    );
    expect(r.valueCanonical).toBeNull();
    expect(r.reasons).toContain("unit_unknown");
    expect(r.needsReview).toBe(true);
  });
});

describe("biomarkerCatalog — pending clinical data degrades safely", () => {
  it("a marker with no plausibleMagnitude never flags magnitude and never throws", () => {
    // Peso has a canonical unit but no band; an absurd value must NOT flag magnitude.
    const r = parseMarkerValue(
      { catalogKey: "peso", rawValue: "999.999", unit: "kg" },
      biomarkerCatalog,
    );
    expect(r.valueCanonical).toBe(999999);
    expect(r.reasons).not.toContain("magnitude_out_of_range");
    expect(r.needsReview).toBe(false);
  });

  it("a pending marker with no canonicalUnit flags for review rather than crashing", () => {
    // A future ~19th marker seeded with only its known fields: no unit/conversion yet.
    const pending: BiomarkerDefinition[] = [
      {
        code: "pendente",
        canonicalName: "Pending marker",
        synonyms: ["pendente"],
        primaryDomain: "Thyroid",
        secondaryDomains: [],
        direction: "range",
        type: "laboratory",
        pending: true,
      },
    ];
    const catalog = createBiomarkerCatalog(pending);
    const r = parseMarkerValue(
      { catalogKey: "pendente", rawValue: "3,5", unit: "µUI/mL" },
      catalog,
    );
    expect(r.value).toBe(3.5); // number still parses
    expect(r.canonicalUnit).toBeNull(); // nothing to canonicalize to
    expect(r.valueCanonical).toBeNull();
    expect(r.reasons).toContain("unit_unknown");
    expect(r.reasons).not.toContain("magnitude_out_of_range");
  });
});

describe("biomarkerCatalog — Lote 2 (single-unit markers)", () => {
  it("resolves Portuguese report spellings to the right code", () => {
    const cases: Array<[string, string]> = [
      ["hemoglobina glicada", "hba1c"],
      ["A1C", "hba1c"],
      ["glicemia média estimada", "glicemia_media"],
      ["hormônio tireoestimulante", "tsh"],
      ["TSH", "tsh"],
      ["hemoglobina", "hemoglobina"],
      ["hematócrito", "hematocrito"],
      ["hematocrito", "hematocrito"], // accent-insensitive: no separate synonym needed
      ["glóbulos brancos", "leucocitos"],
      ["hemossedimentação", "vhs"],
      ["saturação de transferrina", "sat_transferrina"],
      ["IST", "sat_transferrina"],
    ];
    for (const [alias, code] of cases) {
      expect(biomarkerCatalog.findBySynonym(alias)?.code).toBe(code);
    }
  });

  it("carries curator-confirmed unit, domain, and direction", () => {
    const tsh = biomarkerCatalog.findByCode("tsh");
    expect(tsh?.canonicalUnit).toBe("µUI/mL");
    expect(tsh?.primaryDomain).toBe("Thyroid");
    expect(tsh?.direction).toBe("range");

    const sat = biomarkerCatalog.findByCode("sat_transferrina");
    expect(sat?.primaryDomain).toBe("Iron");
    expect(sat?.direction).toBe("low_bad");

    // Context markers do not score: no primary domain, direction "context".
    const hb = biomarkerCatalog.findByCode("hemoglobina");
    expect(hb?.primaryDomain).toBeNull();
    expect(hb?.direction).toBe("context");
    expect(hb?.secondaryDomains).toContain("Iron");
  });

  it("has no conversion pairs and normalizes a canonical-unit value at factor 1", () => {
    const tsh = biomarkerCatalog.findByCode("tsh");
    expect(tsh?.conversions).toBeUndefined();

    const r = parseMarkerValue(
      { catalogKey: "tsh", rawValue: "3,5", unit: "µUI/mL" },
      biomarkerCatalog,
    );
    expect(r.conversionFactor).toBe(1);
    expect(r.valueCanonical).toBe(3.5);
    expect(r.needsReview).toBe(false);
  });

  it("flags a foreign unit for a single-unit marker rather than guessing", () => {
    // TSH's alternate unit (mUI/L) is not registered; without a pair it is flagged.
    const r = parseMarkerValue(
      { catalogKey: "tsh", rawValue: "3,5", unit: "mUI/L" },
      biomarkerCatalog,
    );
    expect(r.valueCanonical).toBeNull();
    expect(r.reasons).toContain("unit_unknown");
  });
});

describe("biomarkerCatalog — plausibleMagnitude fuses (confirmed + Lote 2 only)", () => {
  it("cadastra a band, in the canonical unit, for markers with a confirmed unit", () => {
    expect(biomarkerCatalog.findByCode("triglicerideos")?.plausibleMagnitude).toEqual({ min: 5, max: 10000 });
    expect(biomarkerCatalog.findByCode("hemoglobina")?.plausibleMagnitude).toEqual({ min: 2, max: 25 });
    expect(biomarkerCatalog.findByCode("leucocitos")?.plausibleMagnitude).toEqual({ min: 100, max: 500000 });
  });

  it("catches a gross number-conversion error (Hb 14 mis-parsed as 140 g/dL)", () => {
    const r = parseMarkerValue(
      { catalogKey: "hemoglobina", rawValue: "140", unit: "g/dL" },
      biomarkerCatalog,
    );
    expect(r.valueCanonical).toBe(140);
    expect(r.reasons).toContain("magnitude_out_of_range");
    expect(r.needsReview).toBe(true);
  });

  it("never flags a genuine clinical extreme within the wide band (Hb 22 g/dL)", () => {
    const r = parseMarkerValue(
      { catalogKey: "hemoglobina", rawValue: "22", unit: "g/dL" },
      biomarkerCatalog,
    );
    expect(r.valueCanonical).toBe(22);
    expect(r.reasons).not.toContain("magnitude_out_of_range");
    expect(r.needsReview).toBe(false);
  });

  it("does not seed Lote 1/Lote 3 markers (no band could be in the wrong unit)", () => {
    for (const code of ["colesterol_total", "ldl", "hdl", "glicose", "creatinina", "ferro", "vitamina_d"]) {
      expect(biomarkerCatalog.findByCode(code)).toBeNull();
    }
  });
});

describe("createBiomarkerCatalog — curation guards", () => {
  it("throws on a duplicate code", () => {
    const dup: BiomarkerDefinition[] = [
      { code: "x", canonicalName: "X", synonyms: [], primaryDomain: null, secondaryDomains: [], direction: "context", type: "laboratory" },
      { code: "x", canonicalName: "X2", synonyms: [], primaryDomain: null, secondaryDomains: [], direction: "context", type: "laboratory" },
    ];
    expect(() => createBiomarkerCatalog(dup)).toThrow(/Duplicate/);
  });

  it("throws when two markers claim the same synonym", () => {
    const clash: BiomarkerDefinition[] = [
      { code: "a", canonicalName: "A", synonyms: ["shared"], primaryDomain: null, secondaryDomains: [], direction: "context", type: "laboratory" },
      { code: "b", canonicalName: "B", synonyms: ["Shared"], primaryDomain: null, secondaryDomains: [], direction: "context", type: "laboratory" },
    ];
    expect(() => createBiomarkerCatalog(clash)).toThrow(/Ambiguous/);
  });
});
