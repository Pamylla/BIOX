# Biomarker Catalog — BIOX

**Document:** `docs/02-domain/biomarker-catalog.md`
**Related:** [`overview.md`](overview.md) (`Biomarker` and `Measurement` definitions)

> ⚠️ **Awaiting data.** This is the structure of the catalog; the ~22 real biomarker entries are curated clinical reference data and must be filled in from the source (not generated). Each row below is illustrative of the *shape*, not confirmed data.

---

## Purpose

The catalog is the single, global definition of every biomarker BIOX understands (the `Biomarker` entity in [overview.md](overview.md)). A `Measurement` always points to one catalog entry. The catalog is reference data — it exists once, independent of any patient.

## Entry schema

Each biomarker entry defines:

| Field | Meaning |
|---|---|
| `code` | Stable internal identifier (never shown to users, never reused). |
| `canonicalName` | The display name (e.g. "Ferritin"). |
| `canonicalUnit` | The unit all measurements are normalized to (FR-09). |
| `healthDomain` | One of: Inflammation · Iron · Metabolic · Thyroid · Cardiovascular. |
| `clinicalDirection` | How to read the value: `higher-is-better` · `lower-is-better` · `target-range`. |
| `synonyms` | Parser aliases — the names/abbreviations this marker appears under in Brazilian lab reports. |
| `defaultReferenceRange` | Optional fallback range for display when a report omits one (per ADR-002, the report's own range is authoritative). |

## Catalog *(to be completed — ~22 markers)*

| code | canonicalName | canonicalUnit | healthDomain | clinicalDirection | synonyms |
|---|---|---|---|---|---|
| _tbd_ | _e.g. Ferritin_ | _e.g. ng/mL_ | Iron | target-range | _ferritina, …_ |
| _tbd_ | _e.g. CRP_ | _e.g. mg/L_ | Inflammation | lower-is-better | _PCR, proteína C reativa, …_ |
| _tbd_ | _e.g. TSH_ | _e.g. µUI/mL_ | Thyroid | target-range | _TSH, hormônio tireoestimulante, …_ |
| … | | | | | |

> Open decision (PRD §8): Triglycerides are assigned **primary Metabolic**, secondary Cardiovascular — recorded here once the full catalog is filled in.
