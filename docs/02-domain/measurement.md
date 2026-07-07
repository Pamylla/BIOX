# Measurement

**Document:** `docs/02-domain/measurement.md`
**Type:** permanent entity
**Related:** `overview.md`, `batch.md`, `biomarker.md`, `score.md`, ADR-002 (range per result)

---

## Purpose

Represent the **value of a `Biomarker` measured on a specific date**, with the reference range from that report. `Measurement` is the atom of the biomarker-oriented database — the datum that repeats with each `Batch` and forms the time series. It is the unit on which all of the product's longitudinal value is built: without `Measurements` accumulated over time, there is no evolution, trend, or comparison.

## Responsibilities

- Store the measured value, its original unit, and the normalized value (in the marker's canonical unit).
- Store the **reference range from that report** — not from the catalog.
- Store the computed flag (in/out of range, high/low) for that result.
- Preserve censoring qualifiers (`< 0.3`, `> 1000`).
- Point to the `Biomarker` that defines the marker — without copying the definition.

## Relationships

- Belongs to a `Patient`. A laboratory `Measurement` also belongs to a `Batch` (its clinical event); an anthropometric `Measurement` (manual Profile entry, e.g. weight) has no `Batch` — its collection date lives on the `Measurement` itself.
- References a `Biomarker` (the global definition; the `Measurement` is the measured instance).
- Consumed by `Scores` (it enters the computation) and by `Insights` (read by the AI).

## Business rules

- **The reference range is always from the report, per result** — never from a fixed catalog (ADR-002). Real reports proved that the same ferritin, at the same lab, has a different range across dates; that the range varies by sex, age, and method; and that some markers have a tiered range by risk. A fixed catalog would produce clinically wrong flags.
- **Original and normalized values coexist.** The original preserves what the report stated; the normalized one (in the marker's canonical unit) is what enables comparison and trend computation. CRP in mg/dL and in mg/L become the same axis once normalized.
- **The flag is computed, not extracted.** It results from crossing the normalized value × the report's range × the `Biomarker`'s `direction` (high_bad / low_bad / range / context). The flag of a `low_bad` marker (e.g. HDL) is the opposite of a `high_bad` one.
- **Censored values preserve the qualifier.** `< 0.3` is stored as "less than 0.3", not as 0.3 — computation and display respect the uncertainty.
- **A tiered range may produce a neutral flag.** Markers like LDL (range by cardiovascular risk) may stay with a neutral flag until a target is defined — better not to flag than to flag wrongly.
- **The marker definition is never duplicated.** The `Measurement` references the `Biomarker`; it does not copy name, domain, or direction. This prevents "ferritin" being defined divergently across exams.
- **It is immutable once confirmed.** A correction comes as new data (a new `Extraction`/review), not as a silent edit.

## Laboratory vs anthropometric Measurement

Not every `Measurement` comes from a report. Weight — and, in the future, blood pressure, waist circumference, fingerstick glucose — is an **anthropometric `Measurement`**: same nature (value + date + time series), different origin (manual entry, not PDF parsing).

- The distinction is a characteristic inherited from the referenced `Biomarker` (laboratory vs anthropometric), not a separate entity.
- An anthropometric `Measurement` is entered via the Profile (manual entry) and does not go through a report `Extraction`/`Batch` — but it participates equally in the timeline, the trend, and the AI context.

## Future evolution

- It is the time series that feeds every trend: the linear regression runs dynamically over a marker's `Measurements`, with no new field.
- Supports new qualifier types or result metadata (e.g. assay method, when clinically relevant) without changing the nature of the entity.

## Boundary note

The `Measurement` holds the *measured factual datum*. It does **not** compute the `Score` (the Score is derived, aggregating several Measurements per domain) and does **not** interpret (interpretation is `Insight`). And the *definition* of what the marker is — name, synonyms, domain, direction — lives in the `Biomarker`, not here. See `biomarker.md`.
