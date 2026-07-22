import { describe, expect, it } from "vitest";
import { extractorOutputSchema } from "./extractor-output";

const validItem = {
  rawLabel: "Ferritina",
  rawValue: "8.610",
  valueLabel: null,
  unit: "ng/mL",
  refLow: "11",
  refHigh: "307",
  refRaw: "11 a 307 ng/mL",
  assayMethod: "Quimioluminescência",
  confidence: "high",
};

const validOutput = {
  collectionDate: "2026-03-14",
  labName: "Fleury",
  items: [validItem],
};

describe("extractorOutputSchema", () => {
  it("accepts a complete, well-formed output", () => {
    const parsed = extractorOutputSchema.parse(validOutput);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]?.rawValue).toBe("8.610");
  });

  it("accepts a qualitative-only item (serology)", () => {
    const output = {
      ...validOutput,
      items: [{ ...validItem, rawValue: null, valueLabel: "Non-reactive", unit: null }],
    };
    expect(() => extractorOutputSchema.parse(output)).not.toThrow();
  });

  it("accepts null collection date and lab name — absent is valid, never invented", () => {
    const output = { ...validOutput, collectionDate: null, labName: null };
    expect(() => extractorOutputSchema.parse(output)).not.toThrow();
  });

  it("accepts an empty items array — an unreadable report extracts nothing", () => {
    expect(() => extractorOutputSchema.parse({ ...validOutput, items: [] })).not.toThrow();
  });

  it("rejects a collection date that is not ISO YYYY-MM-DD", () => {
    const output = { ...validOutput, collectionDate: "14/03/2026" };
    expect(() => extractorOutputSchema.parse(output)).toThrow();
  });

  it("rejects an item with an empty rawLabel", () => {
    const output = { ...validOutput, items: [{ ...validItem, rawLabel: "" }] };
    expect(() => extractorOutputSchema.parse(output)).toThrow();
  });

  it("rejects an unknown confidence level", () => {
    const output = { ...validOutput, items: [{ ...validItem, confidence: "certain" }] };
    expect(() => extractorOutputSchema.parse(output)).toThrow();
  });

  it("rejects numeric values — every value field must be the printed string", () => {
    const output = { ...validOutput, items: [{ ...validItem, rawValue: 8610 }] };
    expect(() => extractorOutputSchema.parse(output)).toThrow();
  });

  it("rejects an output with a missing items field", () => {
    expect(() => extractorOutputSchema.parse({ collectionDate: null, labName: null })).toThrow();
  });
});
