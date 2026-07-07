import {
  PANEL_LABELS,
  PANEL_TO_SYSTEM,
  SYSTEM_LABELS,
  type FlagStatus,
  type PanelKey,
  type ScoreStatus,
  type SystemKey,
} from "@biox/shared/contracts";

/**
 * Marina Alves demo fixtures (plan §14). Snapshot 04 values are the exact
 * prototype numbers; earlier snapshots follow the trends the design shows
 * (cholesterol rising, CRP improving, glucose drifting up). Everything
 * derivable — flags, counts, deltas, tags — is COMPUTED here, never
 * hardcoded (§2.4), so the mock behaves like the real engines will.
 */

export interface MarkerFixture {
  key: string;
  name: string;
  panel: PanelKey;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  refRaw: string;
  /** Decimal places when formatting values/deltas of this marker. */
  decimals: number;
  /** Values per batch, chronological (01 → 04). */
  series: number[];
  /** Marker-specific in-range label (design: HDL shows "Protective"). */
  goodLabel?: string;
}

export const MARKER_FIXTURES: MarkerFixture[] = [
  // CBC
  {
    key: "hemoglobin",
    name: "Hemoglobin",
    panel: "cbc",
    unit: "g/dL",
    refLow: 13.5,
    refHigh: 17.5,
    refRaw: "13.5–17.5",
    decimals: 1,
    series: [14.1, 14.4, 14.2, 14.6],
  },
  {
    key: "hematocrit",
    name: "Hematocrit",
    panel: "cbc",
    unit: "%",
    refLow: 41,
    refHigh: 53,
    refRaw: "41–53",
    decimals: 1,
    series: [42.0, 43.1, 42.6, 43.2],
  },
  {
    key: "rbc",
    name: "Red Blood Cells",
    panel: "cbc",
    unit: "10⁶/µL",
    refLow: 4.5,
    refHigh: 5.9,
    refRaw: "4.5–5.9",
    decimals: 2,
    series: [4.8, 4.9, 4.86, 4.92],
  },
  {
    key: "wbc",
    name: "White Blood Cells",
    panel: "cbc",
    unit: "10³/µL",
    refLow: 4.0,
    refHigh: 11.0,
    refRaw: "4.0–11.0",
    decimals: 1,
    series: [6.2, 7.1, 6.5, 6.9],
  },
  {
    key: "platelets",
    name: "Platelets",
    panel: "cbc",
    unit: "10³/µL",
    refLow: 150,
    refHigh: 450,
    refRaw: "150–450",
    decimals: 0,
    series: [230, 244, 238, 248],
  },
  {
    key: "ferritin",
    name: "Ferritin",
    panel: "cbc",
    unit: "ng/mL",
    refLow: 30,
    refHigh: 400,
    refRaw: "30–400",
    decimals: 0,
    series: [150, 161, 168, 176],
  },
  // Glucose Metabolism
  {
    key: "glucose",
    name: "Fasting Glucose",
    panel: "glucose",
    unit: "mg/dL",
    refLow: 70,
    refHigh: 99,
    refRaw: "70–99",
    decimals: 0,
    series: [88, 91, 93, 97],
  },
  {
    key: "hba1c",
    name: "HbA1c",
    panel: "glucose",
    unit: "%",
    refLow: null,
    refHigh: 5.7,
    refRaw: "< 5.7",
    decimals: 1,
    series: [5.4, 5.4, 5.5, 5.6],
  },
  // Lipid Profile
  {
    key: "tchol",
    name: "Total Cholesterol",
    panel: "lipid",
    unit: "mg/dL",
    refLow: null,
    refHigh: 200,
    refRaw: "< 200",
    decimals: 0,
    series: [186, 190, 205, 214],
  },
  {
    key: "ldl",
    name: "LDL Cholesterol",
    panel: "lipid",
    unit: "mg/dL",
    refLow: null,
    refHigh: 130,
    refRaw: "< 130",
    decimals: 0,
    series: [124, 128, 134, 141],
  },
  {
    key: "hdl",
    name: "HDL Cholesterol",
    panel: "lipid",
    unit: "mg/dL",
    refLow: 40,
    refHigh: null,
    refRaw: "> 40",
    decimals: 0,
    series: [48, 50, 52, 54],
    goodLabel: "Protective",
  },
  {
    key: "trig",
    name: "Triglycerides",
    panel: "lipid",
    unit: "mg/dL",
    refLow: null,
    refHigh: 150,
    refRaw: "< 150",
    decimals: 0,
    series: [132, 139, 144, 148],
  },
  // Renal & Hepatic
  {
    key: "urea",
    name: "Urea",
    panel: "renal_hepatic",
    unit: "mg/dL",
    refLow: 15,
    refHigh: 45,
    refRaw: "15–45",
    decimals: 0,
    series: [30, 34, 31, 33],
  },
  {
    key: "creatinine",
    name: "Creatinine",
    panel: "renal_hepatic",
    unit: "mg/dL",
    refLow: 0.7,
    refHigh: 1.3,
    refRaw: "0.7–1.3",
    decimals: 2,
    series: [0.9, 0.92, 0.9, 0.94],
  },
  {
    key: "ast",
    name: "AST",
    panel: "renal_hepatic",
    unit: "U/L",
    refLow: null,
    refHigh: 40,
    refRaw: "< 40",
    decimals: 0,
    series: [24, 26, 25, 27],
  },
  {
    key: "alt",
    name: "ALT",
    panel: "renal_hepatic",
    unit: "U/L",
    refLow: null,
    refHigh: 41,
    refRaw: "< 41",
    decimals: 0,
    series: [27, 31, 28, 30],
  },
  // Inflammation
  {
    key: "esr",
    name: "ESR",
    panel: "inflammation",
    unit: "mm/h",
    refLow: null,
    refHigh: 15,
    refRaw: "< 15",
    decimals: 0,
    series: [13, 12, 12, 11],
  },
  {
    key: "crp",
    name: "CRP",
    panel: "inflammation",
    unit: "mg/L",
    refLow: null,
    refHigh: 3.0,
    refRaw: "< 3.0",
    decimals: 1,
    series: [2.8, 2.2, 1.4, 0.9],
  },
  // Thyroid
  {
    key: "tsh",
    name: "TSH",
    panel: "thyroid",
    unit: "µIU/mL",
    refLow: 0.4,
    refHigh: 4.0,
    refRaw: "0.4–4.0",
    decimals: 1,
    series: [2.6, 2.4, 2.5, 2.3],
  },
  {
    key: "ft4",
    name: "Free T4",
    panel: "thyroid",
    unit: "ng/dL",
    refLow: 0.9,
    refHigh: 1.7,
    refRaw: "0.9–1.7",
    decimals: 2,
    series: [1.1, 1.2, 1.15, 1.2],
  },
];

export interface BatchFixture {
  id: string;
  sequence: number;
  collectedAt: string;
  performingLab: string;
}

export const BATCH_FIXTURES: BatchFixture[] = [
  { id: "batch-01", sequence: 1, collectedAt: "2025-03-15", performingLab: "Hermes Pardini" },
  { id: "batch-02", sequence: 2, collectedAt: "2025-08-22", performingLab: "Fleury" },
  { id: "batch-03", sequence: 3, collectedAt: "2026-01-09", performingLab: "Dasa" },
  { id: "batch-04", sequence: 4, collectedAt: "2026-06-14", performingLab: "Fleury" },
];

/** Score history per system, chronological; last entry = design values (§2.4). */
export const SCORE_FIXTURES: Record<
  Exclude<SystemKey, "overall">,
  { history: number[]; blurb: string }
> = {
  metabolic: {
    history: [82, 84, 81, 79],
    blurb: "Glucose control is drifting toward the upper range across recent snapshots.",
  },
  cardiovascular: {
    history: [80, 78, 75, 72],
    blurb: "Cholesterol markers have been rising since your January snapshot.",
  },
  inflammation: {
    history: [88, 90, 92, 94],
    blurb: "Inflammatory markers are low and improving — a quiet, steady signal.",
  },
  hematologic: {
    history: [89, 90, 89, 90],
    blurb: "Blood counts sit comfortably inside their reference ranges.",
  },
  hepatorenal: {
    history: [90, 92, 91, 91],
    blurb: "Liver and kidney markers remain stable and well within range.",
  },
  thyroid: {
    history: [95, 96, 95, 96],
    blurb: "Thyroid function is steady, with TSH mid-range across snapshots.",
  },
};

export const OVERALL_HISTORY = [80, 83, 81, 84];
export const OVERALL_BLURB =
  "A weighted composite of your six system scores, computed in code from your latest snapshot.";

/** §5.7 thresholds. */
export function scoreStatusOf(value: number): ScoreStatus {
  if (value >= 92) return "excellent";
  if (value >= 80) return "good";
  if (value >= 60) return "watch";
  return "alert";
}

/**
 * Mock-local flag rules mirroring §11.1 (numeric two-sided/one-sided ranges,
 * ±5% borderline). The real engine lands in packages/shared/engines with the
 * full qualifier/label handling; the mock only needs the seed's numeric cases.
 */
export function flagOf(
  value: number,
  marker: Pick<MarkerFixture, "refLow" | "refHigh" | "goodLabel">,
  borderlinePct = 0.05,
): { status: FlagStatus; label: string } {
  const { refLow, refHigh } = marker;
  if (refLow === null && refHigh === null)
    return { status: "none", label: "No reference provided" };
  if (refHigh !== null && value > refHigh) return { status: "alert", label: "Above target" };
  if (refLow !== null && value < refLow) return { status: "alert", label: "Below range" };
  if (refHigh !== null && value >= refHigh * (1 - borderlinePct)) {
    return { status: "watch", label: refLow === null ? "Borderline" : "Upper range" };
  }
  if (refLow !== null && value <= refLow * (1 + borderlinePct)) {
    return { status: "watch", label: refHigh === null ? "Borderline" : "Lower range" };
  }
  return { status: "good", label: marker.goodLabel ?? "In range" };
}

export function formatValue(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

export function panelLabelOf(panel: PanelKey): string {
  return PANEL_LABELS[panel];
}

export function systemOfPanel(panel: PanelKey): Exclude<SystemKey, "overall"> {
  return PANEL_TO_SYSTEM[panel];
}

export function systemLabelOf(system: SystemKey): string {
  return SYSTEM_LABELS[system];
}

export const USER_FIXTURE = {
  id: "user-marina",
  name: "Marina Alves",
  email: "marina.alves@email.com",
  dateOfBirth: "1991-05-12",
  sexAtBirth: "female" as const,
  flagBorderline: true,
  aiProcessingConsent: true,
};

export interface InsightFixture {
  id: string;
  title: string;
  tone: "good" | "watch" | "alert";
  summary: string;
  body: string;
  markerKeys: string[];
  relatedScoreKey: Exclude<SystemKey, "overall">;
  createdAt: string;
  readAt: string | null;
  groundingReadings: string;
  groundingKnowledge: string;
}

export const INSIGHT_FIXTURES: InsightFixture[] = [
  {
    id: "insight-chol-trend",
    title: "Cholesterol has been trending upward",
    tone: "watch",
    summary:
      "Total and LDL cholesterol moved above their targets in your last two snapshots, while HDL stayed protective.",
    body: "Across your four snapshots, total cholesterol went from 186 to 214 mg/dL and LDL from 124 to 141 mg/dL — both now above the targets printed on your reports (< 200 and < 130). HDL improved from 48 to 54 mg/dL, which works in your favor. Patterns like this are usually discussed alongside diet, activity and family history. This is an educational summary of your own values, not a diagnosis.",
    markerKeys: ["tchol", "ldl", "hdl"],
    relatedScoreKey: "cardiovascular",
    createdAt: "2026-06-14",
    readAt: null,
    groundingReadings:
      "Total Cholesterol, LDL and HDL across snapshots 01–04, with report targets.",
    groundingKnowledge: "Curated lipid-panel notes: how LDL/HDL balance is typically read.",
  },
  {
    id: "insight-glucose-watch",
    title: "Glucose is drifting toward the upper range",
    tone: "watch",
    summary:
      "Fasting glucose rose from 88 to 97 mg/dL across snapshots and now sits near the top of its range; HbA1c is borderline at 5.6%.",
    body: "Your fasting glucose has climbed steadily (88 → 91 → 93 → 97 mg/dL) and now sits just under the 99 mg/dL upper bound from your report, with HbA1c at 5.6% against a < 5.7 target. Values inside the range but near a threshold are flagged as watch so the trend stays visible. Educational only — trends like this are worth discussing with a professional.",
    markerKeys: ["glucose", "hba1c"],
    relatedScoreKey: "metabolic",
    createdAt: "2026-06-14",
    readAt: null,
    groundingReadings: "Fasting Glucose and HbA1c across snapshots 01–04, with report ranges.",
    groundingKnowledge: "Curated glucose-metabolism notes: fasting glucose and HbA1c basics.",
  },
  {
    id: "insight-inflammation-low",
    title: "Inflammation markers look quiet",
    tone: "good",
    summary: "CRP fell from 2.8 to 0.9 mg/L across your snapshots and ESR stayed low.",
    body: "C-reactive protein dropped consistently across your four snapshots (2.8 → 2.2 → 1.4 → 0.9 mg/L, target < 3.0) and ESR is at 11 mm/h against a < 15 reference. Low, stable inflammatory markers are generally a reassuring pattern in routine labs. Educational only.",
    markerKeys: ["crp", "esr"],
    relatedScoreKey: "inflammation",
    createdAt: "2026-06-14",
    readAt: null,
    groundingReadings: "CRP and ESR across snapshots 01–04, with report targets.",
    groundingKnowledge: "Curated inflammation notes: what CRP and ESR commonly reflect.",
  },
  {
    id: "insight-thyroid-ok",
    title: "Thyroid function remains steady",
    tone: "good",
    summary: "TSH at 2.3 µIU/mL and Free T4 at 1.2 ng/dL are mid-range and stable.",
    body: "TSH has stayed between 2.3 and 2.6 µIU/mL (range 0.4–4.0) and Free T4 between 1.1 and 1.2 ng/dL (range 0.9–1.7) across all snapshots — comfortably mid-range with no drift. Educational only.",
    markerKeys: ["tsh", "ft4"],
    relatedScoreKey: "thyroid",
    createdAt: "2026-01-09",
    readAt: "2026-01-10",
    groundingReadings: "TSH and Free T4 across snapshots 01–04, with report ranges.",
    groundingKnowledge: "Curated thyroid notes: TSH/Free T4 relationship.",
  },
];

export interface ActivityFixture {
  id: string;
  type: "batch.created" | "insights.generated" | "flag.crossed" | "score.changed";
  title: string;
  createdAt: string;
}

export const ACTIVITY_FIXTURES: ActivityFixture[] = [
  {
    id: "act-1",
    type: "batch.created",
    title: "Snapshot 04 created from Fleury report",
    createdAt: "2026-06-14",
  },
  {
    id: "act-2",
    type: "insights.generated",
    title: "4 insights generated for Snapshot 04",
    createdAt: "2026-06-14",
  },
  {
    id: "act-3",
    type: "flag.crossed",
    title: "LDL Cholesterol crossed above target",
    createdAt: "2026-06-14",
  },
  {
    id: "act-4",
    type: "score.changed",
    title: "Cardiovascular score changed −3 since Snapshot 03",
    createdAt: "2026-06-14",
  },
];

export interface ReportFixture {
  id: string;
  filename: string;
  sizeBytes: number;
  uploadedAt: string;
  extractionId: string;
  extractionStatus: "processing" | "needs_review" | "confirmed" | "discarded" | "failed";
  batchSequence: number | null;
}

export const REPORT_FIXTURES: ReportFixture[] = [
  {
    id: "report-05",
    filename: "fleury-checkup-jun-2026.pdf",
    sizeBytes: 1_834_217,
    uploadedAt: "2026-07-02",
    extractionId: "extraction-05",
    extractionStatus: "needs_review",
    batchSequence: null,
  },
  {
    id: "report-04",
    filename: "fleury-panel-jun-2026.pdf",
    sizeBytes: 2_106_490,
    uploadedAt: "2026-06-14",
    extractionId: "extraction-04",
    extractionStatus: "confirmed",
    batchSequence: 4,
  },
  {
    id: "report-03",
    filename: "dasa-panel-jan-2026.pdf",
    sizeBytes: 1_402_318,
    uploadedAt: "2026-01-09",
    extractionId: "extraction-03",
    extractionStatus: "confirmed",
    batchSequence: 3,
  },
  {
    id: "report-02",
    filename: "fleury-panel-aug-2025.pdf",
    sizeBytes: 1_729_003,
    uploadedAt: "2025-08-22",
    extractionId: "extraction-02",
    extractionStatus: "confirmed",
    batchSequence: 2,
  },
  {
    id: "report-01",
    filename: "hermes-pardini-mar-2025.pdf",
    sizeBytes: 988_412,
    uploadedAt: "2025-03-15",
    extractionId: "extraction-01",
    extractionStatus: "confirmed",
    batchSequence: 1,
  },
];

export interface ExtractionItemFixture {
  id: string;
  rawLabel: string;
  biomarkerKey: string | null;
  value: number | null;
  valueQualifier: "<" | ">" | "≤" | "≥" | null;
  valueLabel: string | null;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  refRaw: string | null;
  confidence: "high" | "medium" | "low";
}

/**
 * Pending extraction for the Review screen: 12 values across 6 panels;
 * confidences follow the design (3 medium: HbA1c, LDL, Free T4 · 1 low: CRP).
 * CRP arrives censored ("< 0.5") to exercise the qualifier rendering (§5.4).
 */
export const EXTRACTION_REVIEW_FIXTURE = {
  id: "extraction-05",
  reportFilename: "fleury-checkup-jun-2026.pdf",
  reportDate: "2026-06-28",
  performingLab: "Fleury",
  items: [
    {
      id: "xi-1",
      rawLabel: "Hemoglobina",
      biomarkerKey: "hemoglobin",
      value: 14.5,
      valueQualifier: null,
      valueLabel: null,
      unit: "g/dL",
      refLow: 13.5,
      refHigh: 17.5,
      refRaw: "13.5–17.5",
      confidence: "high",
    },
    {
      id: "xi-2",
      rawLabel: "Leucócitos",
      biomarkerKey: "wbc",
      value: 7.0,
      valueQualifier: null,
      valueLabel: null,
      unit: "10³/µL",
      refLow: 4.0,
      refHigh: 11.0,
      refRaw: "4.0–11.0",
      confidence: "high",
    },
    {
      id: "xi-3",
      rawLabel: "Glicose em jejum",
      biomarkerKey: "glucose",
      value: 96,
      valueQualifier: null,
      valueLabel: null,
      unit: "mg/dL",
      refLow: 70,
      refHigh: 99,
      refRaw: "70–99",
      confidence: "high",
    },
    {
      id: "xi-4",
      rawLabel: "Hemoglobina glicada (HbA1c)",
      biomarkerKey: "hba1c",
      value: 5.6,
      valueQualifier: null,
      valueLabel: null,
      unit: "%",
      refLow: null,
      refHigh: 5.7,
      refRaw: "< 5.7",
      confidence: "medium",
    },
    {
      id: "xi-5",
      rawLabel: "Colesterol total",
      biomarkerKey: "tchol",
      value: 212,
      valueQualifier: null,
      valueLabel: null,
      unit: "mg/dL",
      refLow: null,
      refHigh: 200,
      refRaw: "< 200",
      confidence: "high",
    },
    {
      id: "xi-6",
      rawLabel: "LDL colesterol",
      biomarkerKey: "ldl",
      value: 139,
      valueQualifier: null,
      valueLabel: null,
      unit: "mg/dL",
      refLow: null,
      refHigh: 130,
      refRaw: "< 130",
      confidence: "medium",
    },
    {
      id: "xi-7",
      rawLabel: "HDL colesterol",
      biomarkerKey: "hdl",
      value: 55,
      valueQualifier: null,
      valueLabel: null,
      unit: "mg/dL",
      refLow: 40,
      refHigh: null,
      refRaw: "> 40",
      confidence: "high",
    },
    {
      id: "xi-8",
      rawLabel: "Creatinina",
      biomarkerKey: "creatinine",
      value: 0.93,
      valueQualifier: null,
      valueLabel: null,
      unit: "mg/dL",
      refLow: 0.7,
      refHigh: 1.3,
      refRaw: "0.7–1.3",
      confidence: "high",
    },
    {
      id: "xi-9",
      rawLabel: "TGP (ALT)",
      biomarkerKey: "alt",
      value: 29,
      valueQualifier: null,
      valueLabel: null,
      unit: "U/L",
      refLow: null,
      refHigh: 41,
      refRaw: "< 41",
      confidence: "high",
    },
    {
      id: "xi-10",
      rawLabel: "Proteína C reativa",
      biomarkerKey: "crp",
      value: 0.5,
      valueQualifier: "<",
      valueLabel: null,
      unit: "mg/L",
      refLow: null,
      refHigh: 3.0,
      refRaw: "< 3.0",
      confidence: "low",
    },
    {
      id: "xi-11",
      rawLabel: "TSH",
      biomarkerKey: "tsh",
      value: 2.4,
      valueQualifier: null,
      valueLabel: null,
      unit: "µIU/mL",
      refLow: 0.4,
      refHigh: 4.0,
      refRaw: "0.4–4.0",
      confidence: "high",
    },
    {
      id: "xi-12",
      rawLabel: "T4 livre",
      biomarkerKey: "ft4",
      value: 1.2,
      valueQualifier: null,
      valueLabel: null,
      unit: "ng/dL",
      refLow: 0.9,
      refHigh: 1.7,
      refRaw: "0.9–1.7",
      confidence: "medium",
    },
  ] satisfies ExtractionItemFixture[],
};
