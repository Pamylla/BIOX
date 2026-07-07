# Extraction Output Schema

**Document:** `docs/03-architecture/extraction-schema.md`
**Purpose:** the contract the extractor (LLM with structured output) must fulfill — the shape of what comes out of a lab report, before human review. Every field exists to carry a rule the spike surfaced.
**Related:** `parser-spike.md` (the 10 hard cases), ADR-006 (parser + review modal), ADR-002 (range per result), `measurement.md`, `data-privacy.md`.

---

## Design principles

1. **Preserve the raw, always.** Every value keeps the exact string the report printed, alongside the normalized value. A reviewer can always see what the report literally said. This is the safety net for the number-conversion risk (spike #8).
2. **Never invent.** Missing range, unknown tier, ambiguous number → represented explicitly as such, never guessed (spike #6).
3. **Flag for review, don't decide.** The extractor produces data and *reasons to review*; the human confirms. Nothing here persists without passing the modal (ADR-006).
4. **No PII.** The schema has no field for name, national ID, physician, or protocol number. Those are stripped before extraction (`data-privacy.md`).

---

## Top-level shape

```ts
interface ExtractionResult {
  collectionDate: string | null;   // ISO 8601; the report's collection date (spike #10)
  labName: string | null;          // lab name only — not PII
  markers: ExtractedMarker[];
  unmatched: UnmatchedMarker[];    // found in report but not in the catalog
  reviewContext: ReviewContext;    // questions the report can't answer (asked in the modal)
}
```

`collectionDate` is the temporal axis — the date the Batch will carry (not the upload date). One report = one collection date in the MVP (spike #10).

---

## The core object: ExtractedMarker

```ts
interface ExtractedMarker {
  catalogKey: string;              // e.g. "ferritina" — resolved catalog code
  rawLabel: string;                // name exactly as printed, e.g. "Ferritina"

  // --- value: raw + normalized (spike #8) ---
  rawValue: string;                // exactly as printed: "8.610", "0,03", "< 0.3"
  value: number | null;            // normalized numeric; null if censored/unparseable
  censoring: "none" | "less_than" | "greater_than";  // spike (censored values)

  // --- units (spike #1) ---
  unit: string;                    // unit as printed, e.g. "mg/dL"
  canonicalUnit: string;           // catalog canonical, e.g. "mg/L"
  valueCanonical: number | null;   // value converted to canonicalUnit
  conversionFactor: number | null; // e.g. 10 (mg/dL → mg/L); null if no conversion

  // --- reference range (spike #3, #4, #6) ---
  referenceRange: ReferenceRange;

  // --- provenance (spike #5) ---
  origin: "measured" | "calculated";  // GME, LDL, HOMA, eGFR are "calculated"

  // --- review signals (ADR-006) ---
  confidence: number;              // 0.0–1.0
  needsReview: boolean;
  reviewReasons: ReviewReason[];   // why it needs a look
}
```

### ReferenceRange (spike #3, #4, #6)

```ts
type ReferenceRange =
  | { type: "simple"; low: number | null; high: number | null; unit: string; raw: string }
  | { type: "tiered"; tiers: RangeTier[]; raw: string }              // LDL by risk, HbA1c bands
  | { type: "fasting_dependent"; fasting: SimpleBounds; nonFasting: SimpleBounds; raw: string }
  | { type: "sex_age_dependent"; options: ConditionalBounds[]; raw: string }  // TSH/T4 pregnancy, vit D by age
  | { type: "absent"; raw: string };                                // "not provided" — spike #6
```

- `raw` always holds the reference text verbatim, whatever the type.
- **`absent` is a valid, first-class state.** No range is not an error and never triggers an invented one (spike #6). It resolves to a **neutral flag**.
- `tiered` and `sex_age_dependent` capture *all* options; the applicable one is chosen at flag-time using `reviewContext` (below). Until resolvable, the flag is **neutral** (ADR-002).

### ReviewReason — why the extractor asks for a look

```ts
type ReviewReason =
  | "low_confidence"
  | "unit_converted"          // a conversion was applied — verify it
  | "number_ambiguous"        // separator ambiguity (spike #8)
  | "magnitude_out_of_range"  // sanity check failed vs expected order of magnitude
  | "range_absent"            // no reference range
  | "range_needs_context"     // tiered / fasting / sex-age — needs reviewContext
  | "calculated_value"        // origin = calculated, inherits input uncertainty
  | "censored_value";         // "< x" / "> x"
```

---

## reviewContext — what the report can't tell (spike #4, #7)

These are **not extracted** — they are questions the modal asks the human, because the answer isn't in the report. The extractor emits which ones are *needed*; the modal collects the answers.

```ts
interface ReviewContext {
  needed: ContextQuestion[];   // which questions this report requires
}

type ContextQuestion =
  | "fasting"      // resolves fasting-dependent ranges (triglycerides, cholesterol)
  | "pregnant"     // resolves pregnancy tiers (TSH, T4)
  | "age"          // resolves age-dependent ranges (vitamin D) — usually derivable from Patient
  | "sex";         // resolves sex-dependent ranges — usually known from Patient
```

Age and sex are usually already known from the `Patient` and don't need re-asking; `fasting` and `pregnant` typically do. The clinical-context panel in the review modal (from the spike) is what surfaces these.

---

## The number-conversion rule, enforced in the schema (spike #8)

The highest-risk step gets structural enforcement, not just a guideline:

1. `rawValue` is **always** preserved verbatim — the reviewer sees the original.
2. Comma → decimal, dot → thousands, applied deterministically to produce `value`.
3. **Magnitude sanity check:** `value` (or `valueCanonical`) is compared to the marker's expected order of magnitude. On failure → `magnitude_out_of_range` and `needsReview = true`.
4. Any ambiguity → `number_ambiguous` and `needsReview = true`. Never silently resolved.

A value that fails the sanity check **cannot** reach persistence without human confirmation.

---

## Worked example (synthetic)

A synthetic hs-CRP entry printed as `0,03 mg/dL` with a "×10 for mg/L" note:

```json
{
  "catalogKey": "pcr_us",
  "rawLabel": "Proteína C Reativa Ultra Sensível",
  "rawValue": "0,03",
  "value": 0.03,
  "censoring": "none",
  "unit": "mg/dL",
  "canonicalUnit": "mg/L",
  "valueCanonical": 0.3,
  "conversionFactor": 10,
  "referenceRange": { "type": "tiered", "tiers": [ /* ... */ ], "raw": "≥0.20 mg/dL aggravating factor (see note)" },
  "origin": "measured",
  "confidence": 0.86,
  "needsReview": true,
  "reviewReasons": ["unit_converted", "range_needs_context"]
}
```

Note: raw `0,03` preserved; converted to `0.3 mg/L`; `unit_converted` flags the conversion for the reviewer to confirm; the tiered range keeps all tiers and waits for context.

---

## What maps to `Measurement`

After human confirmation in the modal, each `ExtractedMarker` becomes a `Measurement`:

| Schema field | Measurement field |
|---|---|
| `catalogKey` | reference to `Biomarker` |
| `rawValue` | original value (preserved) |
| `valueCanonical` + `canonicalUnit` | normalized value + unit |
| `referenceRange` | reference range (from the report — ADR-002) |
| `origin` | `measured` / `calculated` |
| `censoring` | censoring qualifier |
| `collectionDate` (parent) | the `Batch` date |

`confidence`, `needsReview`, and `reviewReasons` are **review-time only** — they guide the human, they are not persisted on the `Measurement`.

---

## Definition of done

The extractor's output is complete when: every value carries its raw form, every conversion is flagged, every missing range is explicit, every value needing context is marked — so the review modal has everything it needs to let a human confirm safely, and nothing false slips through to persistence.
