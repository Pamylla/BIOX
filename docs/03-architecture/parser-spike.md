# Parser Spike — Findings

**Document:** `docs/03-architecture/parser-spike.md`
**Goal:** validate the biggest technical risk of BIOX — extracting structured data from real Brazilian lab reports — before building any UI. Corresponds to milestone **M1** ("the milestone that unblocks or kills the project").
**Related:** ADR-006 (LLM parser + review modal), ADR-002 (range per result), `measurement.md`, `biomarker.md`.

> **No personal data.** All examples below are synthetic. Real reports contain PII (name, national ID, doctor, signatures) that must never enter this document, the repository, or any LLM call. See "Privacy" below and `data-privacy.md`.

---

## Method

A real multi-page Brazilian lab report was used as the stress test (synthetic equivalent below). The report followed a regular three-column layout (Exam / Result / Reference) across all pages. The spike measured: (1) catalog coverage, (2) the hard cases the extractor must handle, (3) a viability verdict.

## Coverage result

Of the **22 catalog markers** (MVP), **21 were present** in a single comprehensive report. The one absent (standard CRP) was absent for a real clinical reason, not a parser failure: the report carried only high-sensitivity CRP. This validates keeping CRP and hs-CRP as **distinct markers** — not every report has both, and one cannot substitute for the other.

The report also contained ~30 markers **outside** the MVP catalog (extended hemogram, electrolytes, liver enzymes, hormones, other vitamins). The extractor must recognize catalog markers and ignore the rest without breaking.

---

## The hard cases (what the extractor must handle)

Each is a real pattern found in the report, illustrated with synthetic values.

### 1. Unit mismatch vs canonical (requires conversion)
A marker may report in a unit different from the catalog's canonical one, sometimes with a conversion note in the report text.
- Example: hs-CRP reported as `0.03 mg/dL`, with a note "to obtain mg/L, multiply by 10" → `0.3 mg/L` (canonical). Missing the conversion stores the value 10× wrong.
- The unit itself may **change over time** (a report noting a unit change on a given date). Unit is per-result, never assumed from the catalog.

### 2. CRP vs hs-CRP are distinct
The report carried only hs-CRP (used here for cardiovascular risk, per the cited guideline). The extractor must not treat hs-CRP as standard CRP. Confirms the two-marker decision.

### 3. Tiered reference ranges (range depends on risk/category)
- LDL: "Extreme <40 / Very High <50 / High <70 / Intermediate <100 / Low <115" — the "ideal" depends on the patient's cardiovascular risk, which the report does **not** state.
- HbA1c: "Normal <5.7% / Increased risk 5.7–6.4% / Diabetes ≥6.5%".
- Rule: capture the tiered structure; when the applicable tier is unknown, the flag stays **neutral** (ADR-002) rather than wrong.

### 4. Fasting-dependent ranges
Triglycerides and total cholesterol carry two ranges: "fasting <150 / non-fasting <175". The correct range depends on whether the patient was fasting — data **not in the report**.
- **Decision:** the review modal asks the patient (see "Context questionnaire" below).

### 5. Measured vs calculated values
Some values are computed, not measured: estimated average glucose (from HbA1c), LDL (Martin formula), HOMA-IR, eGFR.
- **Decision:** the `Measurement` carries an `origin` flag — `measured` or `calculated`. This matters for interpretation and for the AI's honesty (a calculated value inherits the uncertainty of its inputs).

### 6. Absent range (valid state)
A marker may have a value but **no reference range** ("not provided by the manufacturer"). Example: total iron-binding capacity.
- **Rule:** never invent a range. Absent range is a valid state → neutral flag. The reference range field on `Measurement` is optional.

### 7. Range by sex / age / pregnancy
TSH and free T4 carry separate ranges for pregnancy; vitamin D differs by age group.
- **Decision:** the review modal's context questionnaire captures the parameters needed to select the right tier (sex, age, pregnancy status), or the extractor captures all tiers and the correct one is resolved at flag time.

### 8. Brazilian number notation (CRITICAL)
`8.610 /µL` is eight thousand six hundred ten; `0.03` is three hundredths. In the source, comma is the decimal separator and dot is the thousands separator.
- This is the highest-risk conversion in the whole pipeline: a separator swap can change a value by orders of magnitude and invalidate an entire analysis. It gets its own hardened rule (see below).

### 9. Embedded history (opportunity, deferred)
Many markers include a "History" table with results from prior dates (e.g. ferritin on two dates; glucose across four years). A single PDF thus already contains a partial time series.
- **Decision (MVP):** extract **only the current value**. The embedded history has no per-value reference range and unknown provenance (possibly another lab/method); importing it would mix lower-quality data and adds parsing risk right where number-conversion safety matters most.
- **Deferred (post-MVP):** harvesting embedded history to pre-populate the timeline is a documented future opportunity — it would make evolution visible on the *first* upload. Not discarded; deferred until the parser is proven robust.

### 10. One PDF = one collection date
The report had a single collection date across all pages. One PDF = one clinical event.
- Confirms the glossary decision: **Extraction 1:1 Batch works for the MVP.** The deferred multi-date (1:N) complexity did not appear.

---

## Hardened rule: Brazilian number conversion

Because a conversion error can invalidate a whole report, this rule is explicit and defended in depth:

1. **Comma (`,`) is ALWAYS the decimal separator.** Never thousands.
2. **Dot (`.`) is ALWAYS the thousands separator** in large integers (`8.610`, `197.000`). Never decimal.
3. **Sanity check against expected magnitude.** Every converted value is checked against the marker's expected order of magnitude (derived from the reference range). A ferritin parsed as `2400` when the range is ~11–307 triggers an alert.
4. **Ambiguous or out-of-magnitude conversions force human review** — they enter the modal flagged, never persisted silently.
5. **Double representation stored during review:** the raw string from the report and the normalized numeric value are both kept, so a reviewer can always see what the report literally said.

---

## The review modal is now more than a table

The spike showed the modal (ADR-006) must include a **context questionnaire** — capturing what the report cannot tell:

- **Fasting?** (resolves fasting-dependent ranges — #4)
- **Pregnant? Age? Sex?** (resolves sex/age/pregnancy tiers — #7)
- **Weight** (feeds the anthropometric time series; also clinical context)

This is an addition to the design blueprint's "Review Extraction" state: the values table stays, and a small clinical-context panel sits alongside it. The human fills the gaps no parser can close.

---

## Privacy (why this document has no real data)

Real reports contain PII: name, national ID, date of birth, requesting physician, registration numbers, and electronic-signature hashes. None of it has clinical function in BIOX, and none may reach an LLM, this repository, or any log.

Anonymization strategy (defense in depth, detailed in `data-privacy.md`):

1. **Region isolation** — only the results body is sent to the extractor; header (identity) and footer (signatures) are never sent.
2. **Pattern redaction before the LLM** — national ID, dates of birth, emails, phone numbers are redacted by pattern, locally, before any model call.
3. **Minimal clinical storage** — the `Patient` stores only what has clinical use (sex, birth date for age); never national ID or document numbers.
4. **Original PDF encrypted at rest** in Storage, never in operational text.

---

## Verdict (M1)

**Viable, but not trivial.** Coverage is strong (21/22), the layout is regular enough for an LLM with structured output, and one PDF maps cleanly to one Batch. But cases 1–8 are rules the extractor must handle explicitly — they are not edge noise. This makes the **human review modal essential**, not optional: with tiered ranges, unit conversions, and fasting-dependent values, a human confirmation before persistence is a requirement, not a nicety.

The biggest technical risk of BIOX is **retired to "manageable"** — with the number-conversion rule and the review modal as the two load-bearing safeguards.
