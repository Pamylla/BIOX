import { describe, expect, it } from "vitest";
import { flagMeasurement, type FlagInput, type FlagResult } from "./flag-engine";

/** Only the range/value fields vary per case; borderline defaults to the §11.1 5%. */
function flag(partial: Omit<FlagInput, "borderlinePct"> & { borderlinePct?: number }): FlagResult {
  return flagMeasurement({ borderlinePct: 0.05, ...partial });
}

describe("flagMeasurement", () => {
  describe("no range (rule 1 & 2)", () => {
    it("surfaces a serology label verbatim when there is no numeric range", () => {
      expect(
        flag({ value: null, valueLabel: "Non-reactive", refLow: null, refHigh: null }),
      ).toEqual({ status: "none", label: "Non-reactive" });
    });

    it("reports 'No reference provided' for a bare numeric value with no range", () => {
      expect(flag({ value: 42, refLow: null, refHigh: null })).toEqual({
        status: "none",
        label: "No reference provided",
      });
    });

    it("stays neutral for a label-only value even when a range is present", () => {
      expect(flag({ value: null, valueLabel: "Reactive", refLow: 0, refHigh: 1 })).toEqual({
        status: "none",
        label: "Reactive",
      });
    });
  });

  describe("two-sided ranges", () => {
    it("flags above the ceiling as alert 'Above target'", () => {
      expect(flag({ value: 120, refLow: 70, refHigh: 99 })).toEqual({
        status: "alert",
        label: "Above target",
      });
    });

    it("flags below the floor as alert 'Below range'", () => {
      expect(flag({ value: 60, refLow: 70, refHigh: 99 })).toEqual({
        status: "alert",
        label: "Below range",
      });
    });

    it("names the near side: 'Upper range' vs 'Lower range'", () => {
      expect(flag({ value: 97, refLow: 70, refHigh: 99 })).toMatchObject({
        status: "watch",
        label: "Upper range",
      });
      expect(flag({ value: 72, refLow: 70, refHigh: 99 })).toMatchObject({
        status: "watch",
        label: "Lower range",
      });
    });

    it("is 'In range' comfortably inside", () => {
      expect(flag({ value: 85, refLow: 70, refHigh: 99 })).toEqual({
        status: "good",
        label: "In range",
      });
    });
  });

  describe("one-sided ranges", () => {
    it("flags above a `< 200` ceiling", () => {
      expect(flag({ value: 214, refLow: null, refHigh: 200 })).toMatchObject({ status: "alert" });
    });

    it("reads 'Borderline' near a one-sided ceiling", () => {
      expect(flag({ value: 148, refLow: null, refHigh: 150 })).toEqual({
        status: "watch",
        label: "Borderline",
      });
    });

    it("flags below a `> 40` floor and is good above it", () => {
      expect(flag({ value: 35, refLow: 40, refHigh: null })).toMatchObject({
        status: "alert",
        label: "Below range",
      });
      expect(flag({ value: 54, refLow: 40, refHigh: null })).toMatchObject({ status: "good" });
    });
  });

  describe("inclusivity", () => {
    it("treats the boundary as in-range by default", () => {
      expect(flag({ value: 99, refLow: 70, refHigh: 99 })).toMatchObject({ status: "watch" });
    });

    it("flags the boundary when the range is exclusive", () => {
      expect(flag({ value: 99, refLow: 70, refHigh: 99, highInclusive: false })).toMatchObject({
        status: "alert",
        label: "Above target",
      });
      expect(flag({ value: 70, refLow: 70, refHigh: 99, lowInclusive: false })).toMatchObject({
        status: "alert",
        label: "Below range",
      });
    });
  });

  describe("value qualifiers", () => {
    it("`< 0.5` under a refHigh of 3.0 counts as inside (§11.1 example)", () => {
      expect(flag({ value: 0.5, valueQualifier: "<", refLow: null, refHigh: 3.0 })).toEqual({
        status: "good",
        label: "In range",
      });
    });

    it("a censored-low value never triggers an above-range alert", () => {
      // < 250 against a `< 200` ceiling: the true value is unknown but capped, so
      // we don't manufacture an alert (domain: better not to flag than flag wrongly).
      expect(flag({ value: 250, valueQualifier: "<", refLow: null, refHigh: 200 })).toMatchObject({
        status: "good",
      });
    });

    it("a censored-high value never triggers a below-range alert", () => {
      expect(flag({ value: 30, valueQualifier: ">", refLow: 40, refHigh: null })).toMatchObject({
        status: "good",
      });
    });

    it("still flags a censored-low value that is below the floor", () => {
      expect(flag({ value: 0.01, valueQualifier: "<", refLow: 0.5, refHigh: null })).toMatchObject({
        status: "alert",
        label: "Below range",
      });
    });
  });

  describe("borderline toggle", () => {
    it("collapses the watch band to good when borderlinePct is 0", () => {
      expect(flag({ value: 97, refLow: 70, refHigh: 99, borderlinePct: 0 })).toEqual({
        status: "good",
        label: "In range",
      });
    });

    it("keeps true out-of-range alerts when borderline is off", () => {
      expect(flag({ value: 120, refLow: 70, refHigh: 99, borderlinePct: 0 })).toMatchObject({
        status: "alert",
      });
    });
  });

  // §11.1: "Os 20 biomarcadores do seed devem reproduzir exatamente os status do
  // design." Marina Alves snapshot 04 (plan §14) — expect 2 alert, 3 watch, 15 good.
  describe("Marina Alves seed (design parity)", () => {
    const seed: Array<{
      name: string;
      value: number;
      refLow: number | null;
      refHigh: number | null;
      status: FlagResult["status"];
    }> = [
      { name: "Hemoglobin", value: 14.6, refLow: 13.5, refHigh: 17.5, status: "good" },
      { name: "Hematocrit", value: 43.2, refLow: 41, refHigh: 53, status: "good" },
      { name: "RBC", value: 4.92, refLow: 4.5, refHigh: 5.9, status: "good" },
      { name: "WBC", value: 6.9, refLow: 4.0, refHigh: 11.0, status: "good" },
      { name: "Platelets", value: 248, refLow: 150, refHigh: 450, status: "good" },
      { name: "Ferritin", value: 176, refLow: 30, refHigh: 400, status: "good" },
      { name: "Glucose", value: 97, refLow: 70, refHigh: 99, status: "watch" },
      { name: "HbA1c", value: 5.6, refLow: null, refHigh: 5.7, status: "watch" },
      { name: "Total cholesterol", value: 214, refLow: null, refHigh: 200, status: "alert" },
      { name: "LDL", value: 141, refLow: null, refHigh: 130, status: "alert" },
      { name: "HDL", value: 54, refLow: 40, refHigh: null, status: "good" },
      { name: "Triglycerides", value: 148, refLow: null, refHigh: 150, status: "watch" },
      { name: "Urea", value: 33, refLow: 15, refHigh: 45, status: "good" },
      { name: "Creatinine", value: 0.94, refLow: 0.7, refHigh: 1.3, status: "good" },
      { name: "AST", value: 27, refLow: null, refHigh: 40, status: "good" },
      { name: "ALT", value: 30, refLow: null, refHigh: 41, status: "good" },
      { name: "ESR", value: 11, refLow: null, refHigh: 15, status: "good" },
      { name: "CRP", value: 0.9, refLow: null, refHigh: 3.0, status: "good" },
      { name: "TSH", value: 2.3, refLow: 0.4, refHigh: 4.0, status: "good" },
      { name: "FT4", value: 1.2, refLow: 0.9, refHigh: 1.7, status: "good" },
    ];

    it.each(seed)("$name → $status", ({ value, refLow, refHigh, status }) => {
      expect(flag({ value, refLow, refHigh }).status).toBe(status);
    });

    it("totals 2 alert, 3 watch, 15 good across the panel", () => {
      const tally = seed.reduce<Record<string, number>>((acc, m) => {
        const { status } = flag({ value: m.value, refLow: m.refLow, refHigh: m.refHigh });
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      }, {});
      expect(tally).toEqual({ alert: 2, watch: 3, good: 15 });
    });
  });
});
