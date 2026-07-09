import { describe, expect, it } from "vitest";
import { Prisma, type ExtractionItem } from "@prisma/client";
import { toExtractionReview, type ExtractionWithItems } from "./extraction-review.mapper";

function item(overrides: Partial<ExtractionItem> = {}): ExtractionItem {
  return {
    id: "item-1",
    extractionId: "ext-1",
    rawLabel: "Hemoglobina",
    biomarkerKey: "hemoglobina",
    value: new Prisma.Decimal("14.6"),
    valueQualifier: null,
    valueLabel: null,
    unit: "g/dL",
    refLow: new Prisma.Decimal("13.5"),
    refHigh: new Prisma.Decimal("17.5"),
    lowInclusive: null,
    highInclusive: null,
    refTiers: null,
    refRaw: "13.5–17.5",
    assayMethod: null,
    confidence: "high",
    plausibility: "ok",
    editedByUser: false,
    ...overrides,
  };
}

function extraction(items: ExtractionItem[]): ExtractionWithItems {
  return {
    id: "ext-1",
    reportFileId: "report-1",
    userId: "user-1",
    status: "needs_review",
    model: "claude-sonnet-4-6",
    promptVersion: "extractor-v1",
    rawOutput: {},
    reportDate: new Date("2026-05-04T00:00:00.000Z"),
    performingLab: "Fleury",
    error: null,
    createdAt: new Date("2026-07-09T12:00:00.000Z"),
    confirmedAt: null,
    items,
    reportFile: { filename: "hemograma.pdf" },
  };
}

describe("toExtractionReview", () => {
  it("joins the catalog display name and panel, and converts Decimals to numbers", () => {
    const review = toExtractionReview(extraction([item()]));

    expect(review.items[0]).toMatchObject({
      biomarkerKey: "hemoglobina",
      displayName: "Hemoglobin",
      panelKey: "cbc",
      value: 14.6,
      refLow: 13.5,
      refHigh: 17.5,
    });
    expect(review.reportDate).toBe("2026-05-04T00:00:00.000Z");
    expect(review.reportFilename).toBe("hemograma.pdf");
  });

  it("leaves display null for an unresolved biomarkerKey", () => {
    const review = toExtractionReview(extraction([item({ biomarkerKey: null })]));

    expect(review.items[0]).toMatchObject({ displayName: null, panelKey: null });
  });

  it("counts values, distinct panels, and medium+low items to check", () => {
    const review = toExtractionReview(
      extraction([
        item({ id: "a", biomarkerKey: "hemoglobina", confidence: "high" }), // cbc
        item({ id: "b", biomarkerKey: "hematocrito", confidence: "medium" }), // cbc
        item({ id: "c", biomarkerKey: "tsh", confidence: "low" }), // thyroid
        item({ id: "d", biomarkerKey: null, confidence: "high" }), // no panel
      ]),
    );

    expect(review.counts).toEqual({ values: 4, panels: 2, toCheck: 2 });
  });
});
