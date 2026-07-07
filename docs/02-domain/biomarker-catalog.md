# Biomarker Catalog — BIOX

**Document:** `docs/02-domain/biomarker-catalog.md`
**Related:** [`biomarker.md`](biomarker.md) (the `Biomarker` concept & rules), [`overview.md`](overview.md)

> ⚠️ **Partially cadastrado.** 12 of the ~22 markers are seeded in code with curator-confirmed definitions (see the [catalog table](#catalog-12-of-22-markers-cadastrados)). Each of those with a confirmed canonical unit also carries a derived `plausibleMagnitude` parsing fuse. The remaining ~10 are curated clinical reference data and must be filled in from the source (not generated). Lote 1/3 conversion factors — and their bands — await clinical sign-off and are **not** seeded until confirmed.

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
| `conversions` | *(optional)* Curated source-unit → canonical factors the parser uses to normalize a value (e.g. `mmol/L → 88.57` for a `mg/dL` marker). The canonical unit is an implicit factor of `1` and is never listed here. A unit that is neither canonical nor a listed pair is flagged for review, **never** converted with a guessed factor. See [Unit normalization](#unit-normalization--confirmed-conversion-pairs) below. |
| `type` | `laboratory` (parsed from a report via `Extraction`) or `anthropometric` (manual entry, e.g. weight). |
| `primaryDomain` | The single domain where the marker scores: Inflammation · Iron · Metabolic · Thyroid · Cardiovascular. |
| `secondaryDomains` | Domains where the marker is interpretive **context only** — it does not score there. |
| `direction` | How to read the value: `high_bad` · `low_bad` · `range` · `context`. |
| `synonyms` | Parser aliases — the names/abbreviations this marker appears under in Brazilian lab reports. |
| `plausibleMagnitude` | *(optional)* Expected order-of-magnitude band `{ min?, max?, toleranceOrders? }`, **in `canonicalUnit`** — a parsing safety net (spike #8), **not** a clinical range. See the note below. |

> **Reference ranges are not part of the catalog.** They come from each report, stored per `Measurement` (ADR-002, [biomarker.md](biomarker.md) boundary note). When a report omits a range, the `Measurement` simply has none (neutral flag) — a range is never taken from the catalog.

> **`plausibleMagnitude` is a parsing band, not a clinical judgement.** It states the expected order of magnitude for a real value, in the marker's canonical unit, and exists only to flag separator/parse errors — a decimal slip turning `24` into `2400` (see [parser-spike.md](../03-architecture/parser-spike.md) #8). It never classifies a result and does **not** conflict with ADR-002: the clinical reference range still comes solely from the report, per `Measurement`. The value is converted to `canonicalUnit` **before** the check, so the band is defined in that unit; a marker may omit the band, and then the check is simply skipped. Example (illustrative): ferritin `{ min: 11, max: 307 }` in ng/mL.

## Catalog *(12 of ~22 markers cadastrados)*

These rows are seeded in code — `backend/src/modules/biomarker/biomarker-catalog.data.ts` — and consulted by the parser through the catalog port. `canonicalName` is the internal English label; `synonyms` are Portuguese because they are the bridge to the report (the PDF is in Portuguese) and must match what it prints. Confirmed conversion pairs live in [Unit normalization](#unit-normalization--confirmed-conversion-pairs); every marker with a confirmed unit also carries a derived `plausibleMagnitude` parsing fuse in code (see the [magnitude bands](#plausiblemagnitude--derived-parsing-fuses) section).

| code | canonicalName | canonicalUnit | type | primaryDomain | secondaryDomains | direction | synonyms (pt) |
|---|---|---|---|---|---|---|---|
| `ferritina` | Ferritin | ng/mL | laboratory | Iron | Inflammation | context | ferritina |
| `triglicerideos` | Triglycerides | mg/dL | laboratory | Metabolic | Cardiovascular | high_bad | triglicerídeos, TG |
| `pcr_us` | hs-CRP | mg/L | laboratory | Cardiovascular | Inflammation | high_bad | PCR-us, PCR ultrassensível |
| `peso` | Weight | kg | anthropometric | — | — | context | peso |
| `hba1c` | Glycated Hemoglobin | % | laboratory | Metabolic | — | high_bad | HbA1c, hemoglobina glicada, A1C |
| `glicemia_media` | Estimated Average Glucose | mg/dL | laboratory | Metabolic | — | high_bad | GME, glicemia média estimada |
| `tsh` | Thyroid-Stimulating Hormone | µUI/mL | laboratory | Thyroid | — | range | TSH, hormônio tireoestimulante |
| `hemoglobina` | Hemoglobin | g/dL | laboratory | — | Iron | context | hemoglobina, Hb |
| `hematocrito` | Hematocrit | % | laboratory | — | Iron | context | hematócrito, Ht, HCT |
| `leucocitos` | Leukocytes | /µL | laboratory | — | Inflammation | context | leucócitos, glóbulos brancos, WBC |
| `vhs` | Erythrocyte Sedimentation Rate | mm/h | laboratory | Inflammation | — | high_bad | VHS, hemossedimentação |
| `sat_transferrina` | Transferrin Saturation | % | laboratory | Iron | — | low_bad | saturação de transferrina, IST, TSAT |

**Pending (~10):** Lote 1 — Total Cholesterol, LDL, HDL, Glucose (conversion factors awaiting clinical sign-off); Lote 3 — Creatinine, Serum Iron, Vitamin D (25-OH), Free T4, Free T3, Transferrin/TIBC (factor + direction validation). None are seeded until their data is confirmed.

## Unit normalization *(confirmed conversion pairs)*

The parser normalizes every value to the marker's `canonicalUnit` before any magnitude or clinical step (FR-09). It reads these pairs from the catalog via the catalog port and **never guesses**: a unit that is neither the canonical unit nor a listed pair is flagged for review, not converted. A wrong factor shifts a value by orders of magnitude, so each pair is confirmed against a documented source before it is registered here.

The canonical unit is an implicit factor of `1` and is not repeated in the pairs.

| marker | canonicalUnit | source unit → factor | basis |
|---|---|---|---|
| Triglycerides | mg/dL | `mmol/L → 88.57` | Confirmed — NCBI/AHRQ plus 6+ concurring sources. |
| Ferritin | ng/mL | `µg/L → 1` | Unit identity: `µg/L ≡ ng/mL` (same magnitude, different name). |
| hs-CRP | mg/L | `mg/dL → 10` | Confirmed against the reference lab report. |

> **Decision — hs-CRP canonical unit is `mg/L`.** hs-CRP is reported inconsistently across labs and over time — some laudos print `mg/dL`, some `mg/L`. We fix the canonical unit at `mg/L` (the reference-lab convention) so every stored `Measurement` and every magnitude band is comparable regardless of how a given report printed it. Reports in `mg/dL` are normalized with the `× 10` pair above; any other hs-CRP unit is flagged for review rather than assumed.

## plausibleMagnitude — derived parsing fuses

These bands are **coarse parsing fuses, not clinical limits.** Their only job is to catch a gross number-conversion error (e.g. `24` mis-parsed as `2400`) on the canonical value, post-conversion. They are never shown to the user, never enter the analysis, and never influence a score — clinical precision comes from the report's reference range (ADR-002). The rule: `min` near zero (below any real physiological measure), `max` ≈ 10–50× the normal ceiling, intentionally wide. Combined with the code's ±5× tolerance (`toleranceOrders` default 0.7), the fuse only trips ~50×+ out of range — unambiguously a conversion error, not biology.

Cadastradas only for markers with a **confirmed canonical unit** (the band is stated in that unit), so a Lote 1/3 band waits for its unit sign-off — see the DRAFT proposals below. A marker with no band degrades safely (no magnitude flag).

| marker (code) | canonicalUnit | min | max |
|---|---|---|---|
| Triglycerides (`triglicerideos`) | mg/dL | 5 | 10000 |
| Ferritin (`ferritina`) | ng/mL | 1 | 40000 |
| hs-CRP (`pcr_us`) | mg/L | 0.01 | 500 |
| Glycated Hemoglobin (`hba1c`) | % | 2 | 20 |
| Estimated Average Glucose (`glicemia_media`) | mg/dL | 10 | 2000 |
| TSH (`tsh`) | µUI/mL | 0.001 | 500 |
| Hemoglobin (`hemoglobina`) | g/dL | 2 | 25 |
| Hematocrit (`hematocrito`) | % | 5 | 75 |
| Leukocytes (`leucocitos`) | /µL | 100 | 500000 |
| ESR (`vhs`) | mm/h | 0 | 200 |
| Transferrin Saturation (`sat_transferrina`) | % | 1 | 100 |

> Bands are a starting point, not immutable law: if one marker's fuse ever false-positives on a real value, its band is tuned individually without touching the others. `Weight` intentionally has no band (single-unit anthropometric). Lote 1/3 proposed bands live with the DRAFT factors below and are cadastradas together with the unit.

## Unit normalization — DRAFT *(pending clinical validation — do NOT seed)*

> 🚧 **Not cadastrado.** Everything in this section is a literature-sourced **proposal**, not confirmed data. It is recorded here only to consolidate the research (the reference table's stated purpose). **No factor below is in the seed or the port** until a clinical reviewer signs it off. A wrong factor corrupts every downstream analysis silently — so these move into the confirmed section above one batch at a time, each tested against a known real-report value first.

**Lote 1 — lipids & glucose** (classical NCBI/AHRQ factors; higher confidence):

| marker | canonicalUnit (proposed) | source unit → factor | basis |
|---|---|---|---|
| Total Cholesterol | mg/dL | `mmol/L → 38.67` | NCBI/AHRQ. Same cholesterol molecule → same factor as LDL/HDL. |
| LDL | mg/dL | `mmol/L → 38.67` | Same base as cholesterol. |
| HDL | mg/dL | `mmol/L → 38.67` | Same base as cholesterol. |
| Glucose | mg/dL | `mmol/L → 18.0` | Molecular weight 180.18 → factor ≈ 18.018. |

**Lote 3 — factor + direction validation** (⚠️ validate the *direction* of the inversion, not just the number):

| marker | canonicalUnit (proposed) | source unit → factor | basis / caution |
|---|---|---|---|
| Serum Iron | µg/dL | `µmol/L → 5.587` | `µg/dL × 0.179 = µmol/L`; inverse ≈ 5.587. ⚠️ easy to invert. |
| Creatinine | mg/dL | `µmol/L → 0.0113` | Factor 88.4 is `mg/dL → µmol/L`; inverse `1/88.4 ≈ 0.0113`. ⚠️ **test against the reference laudo's 0.65 mg/dL** before promoting. |
| Vitamin D (25-OH) | ng/mL | `nmol/L → 0.401` | `75 nmol/L ≈ 30 ng/mL` (÷2.496). |
| Free T4 | ng/dL | `pmol/L → 0.0777` | Standard T4 factor (MW ~777). **Confirm.** |
| Free T3 | pg/mL | `pmol/L → 0.651` | Standard T3 factor. **Confirm.** |
| Transferrin / TIBC | µg/dL | `µmol/L → 5.587` | Same base as iron (measured as iron-binding capacity). |

**Optional pairs for already-cadastrado markers** (low risk — mostly unit identities — but still not seeded pending your OK):

| marker (code) | proposal | note |
|---|---|---|
| TSH (`tsh`) | `mUI/L → 1` | Identity: `µUI/mL ≡ mUI/L`. |
| Leukocytes (`leucocitos`) | `/mm³ → 1` | Identity: `/µL ≡ /mm³`. |
| Hemoglobin (`hemoglobina`) | `g/L → 0.1` | `g/dL × 10 = g/L`; rare in BR reports. Real factor, not identity. |

**New marker not yet in the catalog:** PCR (comum) — canonical `mg/L`, same as hs-CRP; if a report prints `mg/dL`, pair `mg/dL → 10`. Needs its own definition fiche (code/synonyms/domain/direction) before cadastro.

**Proposed `plausibleMagnitude` bands (DRAFT — cadastrar together with the unit).** Same derived rule as the confirmed fuses; stated in the proposed canonical unit, so they are only valid once that unit is signed off.

| marker | unit (proposed) | min | max |
|---|---|---|---|
| Total Cholesterol | mg/dL | 20 | 1000 |
| LDL | mg/dL | 5 | 800 |
| HDL | mg/dL | 5 | 200 |
| Glucose | mg/dL | 10 | 2000 |
| Serum Iron | µg/dL | 5 | 2000 |
| Creatinine | mg/dL | 0.1 | 30 |
| Vitamin D (25-OH) | ng/mL | 1 | 200 |
| Free T4 | ng/dL | 0.05 | 20 |
| Free T3 | pg/mL | 0.5 | 50 |
| Transferrin / TIBC | µg/dL | 50 | 1000 |
| PCR (comum) | mg/L | 0.1 | 500 |
