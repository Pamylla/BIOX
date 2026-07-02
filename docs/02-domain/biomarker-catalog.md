# Biomarker Catalog — BIOX

**Document:** `docs/02-domain/biomarker-catalog.md`
**Related:** [`biomarker.md`](biomarker.md) (the `Biomarker` concept & rules), [`overview.md`](overview.md)

> ⚠️ **Awaiting data.** This is the structure of the catalog; the ~22 real biomarker entries are curated clinical reference data and must be filled in from the source (not generated). The rows below are illustrative of the *shape*, not confirmed data.

---

## Purpose

The catalog is the single, global set of `Biomarker` definitions BIOX understands (see [biomarker.md](biomarker.md)). A `Measurement` always points to one catalog entry. The catalog is reference data — it exists once, independent of any patient, and is curated (not user-editable).

## Entry schema

Each entry follows the `Biomarker` definition:

| Field | Meaning |
|---|---|
| `code` | Stable internal identifier (never shown to users, never reused). |
| `canonicalName` | The display name (e.g. "Ferritin"). |
| `canonicalUnit` | The unit all `Measurements` are normalized to (FR-09). |
| `type` | `laboratory` (parsed from a report via `Extraction`) or `anthropometric` (manual entry, e.g. weight). |
| `primaryDomain` | The single domain where the marker scores: Inflammation · Iron · Metabolic · Thyroid · Cardiovascular. |
| `secondaryDomains` | Domains where the marker is interpretive **context only** — it does not score there. |
| `direction` | How to read the value: `high_bad` · `low_bad` · `range` · `context`. |
| `synonyms` | Parser aliases — the names/abbreviations this marker appears under in Brazilian lab reports. |

> **Reference ranges are not part of the catalog.** They come from each report, stored per `Measurement` (ADR-002, [biomarker.md](biomarker.md) boundary note). *(Open point: ADR-002 currently permits an optional catalog display-fallback range, which `biomarker.md` rules out — to be reconciled.)*

## Catalog *(to be completed — ~22 markers)*

Illustrative rows, using the three known multi-domain markers from [biomarker.md](biomarker.md) plus one anthropometric marker:

| code | canonicalName | canonicalUnit | type | primaryDomain | secondaryDomains | direction | synonyms |
|---|---|---|---|---|---|---|---|
| _tbd_ | Ferritin | _e.g. ng/mL_ | laboratory | Iron | Inflammation | context | _ferritina, …_ |
| _tbd_ | Triglycerides | _e.g. mg/dL_ | laboratory | Metabolic | Cardiovascular | high_bad | _triglicerídeos, TG, …_ |
| _tbd_ | hs-CRP | _e.g. mg/L_ | laboratory | Cardiovascular | Inflammation | high_bad | _PCR-us, PCR ultrassensível, …_ |
| _tbd_ | Weight | _e.g. kg_ | anthropometric | — | — | context | _peso, …_ |
| … | | | | | | | |
