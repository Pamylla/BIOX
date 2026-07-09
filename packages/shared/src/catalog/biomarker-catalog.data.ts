/**
 * biomarker-catalog.data.ts
 *
 * The seed catalog data (a .ts seed for now — not Prisma yet). Only markers with
 * CONFIRMED clinical reference data are cadastrados with a canonicalUnit +
 * conversions, sourced from docs/02-domain/biomarker-catalog.md ("Unit
 * normalization — confirmed conversion pairs").
 *
 * NOTHING here is invented. Cadastrados so far:
 *  - 3 confirmed markers with canonicalUnit + conversions (Passo A).
 *  - Weight (anthropometric, single unit).
 *  - Lote 2: 8 single-unit lab markers — definition fields curator-confirmed,
 *    canonicalUnit set, no conversion pair in use, with derived magnitude bands.
 *
 * Still pending (join in curated batches): Lote 1 (lipids/glucose — conversion
 * factors need clinical sign-off) and Lote 3 (creatinine, iron, vit D, T4/T3,
 * transferrin — factor + direction validation). Synonyms are always Portuguese:
 * they are the bridge to the PDF, which is written in Portuguese, so they must
 * match what the report prints — not a style choice.
 *
 * `plausibleMagnitude` bands are cadastradas for every marker with a CONFIRMED
 * canonical unit (the 3 confirmed + Lote 2). They are derived parsing fuses (min
 * near zero, max ~10-50x the normal ceiling, intentionally wide) — a safety net
 * for gross number-conversion errors, NOT clinical limits (ADR-002). Lote 1/3
 * bands stay in the doc DRAFT until their unit is signed off, so a band is never
 * cadastrada in the wrong unit. A marker without a band still degrades safely.
 */

import type { BiomarkerDefinition } from "./biomarker.types";

export const BIOMARKER_SEED: BiomarkerDefinition[] = [
  {
    code: "triglicerideos",
    canonicalName: "Triglycerides",
    synonyms: ["triglicerídeos", "triglicérides", "triglicerides", "TG"],
    primaryDomain: "Metabolic",
    secondaryDomains: ["Cardiovascular"],
    panelKey: "lipid",
    direction: "high_bad",
    type: "laboratory",
    canonicalUnit: "mg/dL",
    conversions: { "mmol/L": 88.57 },
    plausibleMagnitude: { min: 5, max: 10000 }, // derived parsing fuse (canonical unit)
  },
  {
    code: "ferritina",
    canonicalName: "Ferritin",
    synonyms: ["ferritina", "ferritin"],
    primaryDomain: "Iron",
    secondaryDomains: ["Inflammation"],
    panelKey: "cbc",
    direction: "context",
    type: "laboratory",
    canonicalUnit: "ng/mL",
    // µg/L ≡ ng/mL (unit identity); mcg/L and ug/L are ASCII spellings of the
    // same confirmed unit, kept so real BR reports don't flag a trivial variant.
    conversions: { "µg/L": 1, "mcg/L": 1, "ug/L": 1 },
    plausibleMagnitude: { min: 1, max: 40000 }, // derived parsing fuse (canonical unit)
  },
  {
    code: "pcr_us",
    canonicalName: "hs-CRP",
    synonyms: [
      "PCR-us",
      "PCRus",
      "PCR ultrassensível",
      "PCR ultra-sensível",
      "proteína C reativa ultrassensível",
      "hs-CRP",
      "hsCRP",
    ],
    primaryDomain: "Cardiovascular",
    secondaryDomains: ["Inflammation"],
    panelKey: "inflammation",
    direction: "high_bad",
    type: "laboratory",
    canonicalUnit: "mg/L",
    conversions: { "mg/dL": 10 },
    plausibleMagnitude: { min: 0.01, max: 500 }, // derived parsing fuse (canonical unit)
  },
  {
    code: "peso",
    canonicalName: "Weight",
    synonyms: ["peso", "weight"],
    primaryDomain: null,
    secondaryDomains: [],
    direction: "context",
    type: "anthropometric",
    canonicalUnit: "kg",
    // Single unit in use; no conversions and no magnitude band needed.
  },

  // --- Lote 2: single-unit markers (no conversion pair in use in BR reports).
  // canonicalUnit is confirmed; conversions are N/A; plausibleMagnitude pending.
  // Clinical fields (domain/direction) are the curator's calls, taken as given.
  {
    code: "hba1c",
    canonicalName: "Glycated Hemoglobin",
    synonyms: ["HbA1c", "hemoglobina glicada", "A1C", "glicada", "hemoglobina glicosilada"],
    primaryDomain: "Metabolic",
    secondaryDomains: [],
    panelKey: "glucose",
    direction: "high_bad",
    type: "laboratory",
    canonicalUnit: "%",
    plausibleMagnitude: { min: 2, max: 20 }, // derived parsing fuse (canonical unit)
  },
  {
    code: "glicemia_media",
    canonicalName: "Estimated Average Glucose",
    synonyms: ["glicemia média estimada", "GME", "eAG", "glicose média estimada"],
    primaryDomain: "Metabolic",
    secondaryDomains: [],
    panelKey: "glucose",
    direction: "high_bad",
    type: "laboratory",
    canonicalUnit: "mg/dL",
    plausibleMagnitude: { min: 10, max: 2000 }, // inherits glucose scale (canonical unit)
    // Derived from HbA1c (calculated). Mark origin: "calculated" once that field
    // exists, so it does not double-count with HbA1c in a score.
  },
  {
    code: "tsh",
    canonicalName: "Thyroid-Stimulating Hormone",
    synonyms: [
      "TSH",
      "hormônio tireoestimulante",
      "tirotrofina",
      "hormônio tireoestimulante ultrassensível",
    ],
    primaryDomain: "Thyroid",
    secondaryDomains: [],
    panelKey: "thyroid",
    direction: "range",
    type: "laboratory",
    canonicalUnit: "µUI/mL",
    plausibleMagnitude: { min: 0.001, max: 500 }, // derived parsing fuse (canonical unit)
  },
  {
    code: "hemoglobina",
    canonicalName: "Hemoglobin",
    synonyms: ["hemoglobina", "Hb", "hemoglobin"],
    primaryDomain: null,
    secondaryDomains: ["Iron"],
    panelKey: "cbc",
    direction: "context",
    type: "laboratory",
    canonicalUnit: "g/dL",
    plausibleMagnitude: { min: 2, max: 25 }, // derived parsing fuse (canonical unit)
  },
  {
    code: "hematocrito",
    canonicalName: "Hematocrit",
    synonyms: ["hematócrito", "Ht", "HCT"],
    primaryDomain: null,
    secondaryDomains: ["Iron"],
    panelKey: "cbc",
    direction: "context",
    type: "laboratory",
    canonicalUnit: "%",
    plausibleMagnitude: { min: 5, max: 75 }, // derived parsing fuse (canonical unit)
  },
  {
    code: "leucocitos",
    canonicalName: "Leukocytes",
    synonyms: ["leucócitos", "glóbulos brancos", "WBC", "contagem de leucócitos"],
    primaryDomain: null,
    secondaryDomains: ["Inflammation"],
    panelKey: "cbc",
    direction: "context",
    type: "laboratory",
    canonicalUnit: "/µL",
    plausibleMagnitude: { min: 100, max: 500000 }, // derived parsing fuse (canonical unit)
  },
  {
    code: "vhs",
    canonicalName: "Erythrocyte Sedimentation Rate",
    synonyms: ["VHS", "hemossedimentação", "velocidade de sedimentação", "ESR"],
    primaryDomain: "Inflammation",
    secondaryDomains: [],
    panelKey: "inflammation",
    direction: "high_bad",
    type: "laboratory",
    canonicalUnit: "mm/h",
    plausibleMagnitude: { min: 0, max: 200 }, // derived parsing fuse; min 0 => no lower bound
  },
  {
    code: "sat_transferrina",
    canonicalName: "Transferrin Saturation",
    synonyms: ["saturação de transferrina", "IST", "TSAT", "índice de saturação"],
    primaryDomain: "Iron",
    secondaryDomains: [],
    // Iron marker; grouped with the CBC panel in the design (as ferritin is).
    panelKey: "cbc",
    direction: "low_bad",
    type: "laboratory",
    canonicalUnit: "%",
    plausibleMagnitude: { min: 1, max: 100 }, // percentage; natural ceiling ~100
  },
];
