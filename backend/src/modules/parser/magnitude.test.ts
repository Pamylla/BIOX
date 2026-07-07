import { describe, it, expect } from "vitest";
import { isWithinPlausibleMagnitude, type PlausibleMagnitude } from "./magnitude";

describe("isWithinPlausibleMagnitude", () => {
  // Illustrative band in the marker's canonical unit — not real catalog data.
  const ferritin: PlausibleMagnitude = { min: 11, max: 307 };

  it("rejects a value ~100x above the band (separator slip 2400 -> 240000)", () => {
    expect(isWithinPlausibleMagnitude(240000, ferritin)).toBe(false);
  });

  it("rejects a value ~100x below the band (30 read as 0.3)", () => {
    expect(isWithinPlausibleMagnitude(0.3, { min: 30, max: 400 })).toBe(false);
  });

  it("accepts a genuinely high-but-plausible value within tolerance (300 vs 11–307)", () => {
    expect(isWithinPlausibleMagnitude(300, ferritin)).toBe(true);
  });

  it("accepts a normal in-band value", () => {
    expect(isWithinPlausibleMagnitude(120, ferritin)).toBe(true);
  });

  it("treats zero as never a magnitude error", () => {
    expect(isWithinPlausibleMagnitude(0, ferritin)).toBe(true);
  });

  it("respects a wide per-marker tolerance override", () => {
    const permissive: PlausibleMagnitude = { min: 11, max: 307, toleranceOrders: 3 };
    expect(isWithinPlausibleMagnitude(50000, permissive)).toBe(true);
  });

  it("checks only the bound that is provided (open-ended band)", () => {
    // No max: only the lower bound constrains.
    expect(isWithinPlausibleMagnitude(1_000_000, { min: 1 })).toBe(true);
    // No min: only the upper bound constrains.
    expect(isWithinPlausibleMagnitude(0.0001, { max: 10 })).toBe(true);
  });

  it("uses magnitude on the absolute value (sign is irrelevant)", () => {
    expect(isWithinPlausibleMagnitude(-120, ferritin)).toBe(true);
    expect(isWithinPlausibleMagnitude(-240000, ferritin)).toBe(false);
  });
});
