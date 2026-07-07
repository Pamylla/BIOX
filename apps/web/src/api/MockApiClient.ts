import type {
  ActivityEvent,
  BatchDetail,
  BatchSummary,
  BiomarkerReading,
  BiomarkerRow,
  BiomarkerSeries,
  BiomarkerTrend,
  BiomarkersResponse,
  CompareResponse,
  ExtractionReview,
  FlagStatus,
  InsightDetail,
  InsightSummary,
  InsightsResponse,
  Measurement,
  PanelKey,
  ReportRow,
  ScoreCard,
  ScoreDetail,
  ScoresResponse,
  SystemKey,
  UserProfile,
} from "@biox/shared/contracts";
import { panelKeySchema } from "@biox/shared/contracts";
import type { ApiClient } from "./ApiClient";
import {
  ACTIVITY_FIXTURES,
  BATCH_FIXTURES,
  EXTRACTION_REVIEW_FIXTURE,
  INSIGHT_FIXTURES,
  MARKER_FIXTURES,
  OVERALL_BLURB,
  OVERALL_HISTORY,
  REPORT_FIXTURES,
  SCORE_FIXTURES,
  USER_FIXTURE,
  flagOf,
  formatValue,
  panelLabelOf,
  scoreStatusOf,
  systemLabelOf,
  systemOfPanel,
  type MarkerFixture,
} from "./fixtures";

/** Simulated network latency so loading skeletons are actually visible. */
const LATENCY_MS = 350;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ApiClient over the Marina fixtures. Derivations (flags, counts, deltas,
 * latest/baseline tags) are computed on the fly, mirroring what the real
 * API + engines will return.
 */
export class MockApiClient implements ApiClient {
  /** readAt is mutable so "mark as read" visibly drops the sidebar badge. */
  private readonly readAtById = new Map<string, string | null>(
    INSIGHT_FIXTURES.map((insight) => [insight.id, insight.readAt]),
  );

  async getMe(): Promise<UserProfile> {
    await sleep(LATENCY_MS);
    return { ...USER_FIXTURE };
  }

  async getBatches(): Promise<BatchSummary[]> {
    await sleep(LATENCY_MS);
    return BATCH_FIXTURES.map((batch) => this.batchSummary(batch.id));
  }

  async getBatch(batchId: string): Promise<BatchDetail> {
    await sleep(LATENCY_MS);
    const index = this.batchIndex(batchId);
    const panels = groupByPanel(MARKER_FIXTURES).map(({ key, markers }) => ({
      key,
      label: panelLabelOf(key),
      measurements: markers.map((marker) => this.measurementAt(marker, index)),
    }));
    return { batch: this.batchSummary(batchId), panels };
  }

  async compareBatches(aId: string, bId: string): Promise<CompareResponse> {
    await sleep(LATENCY_MS);
    const aIndex = this.batchIndex(aId);
    const bIndex = this.batchIndex(bId);
    const rows = MARKER_FIXTURES.map((marker) => {
      const valueA = marker.series[aIndex] ?? null;
      const valueB = marker.series[bIndex] ?? null;
      const delta =
        valueA !== null && valueB !== null ? round(valueB - valueA, marker.decimals) : null;
      const statusB = valueB !== null ? flagOf(valueB, marker).status : "none";
      return {
        biomarkerKey: marker.key,
        displayName: marker.name,
        unit: marker.unit,
        valueA,
        valueB,
        delta,
        deltaTone: deltaToneOf(delta, statusB),
        statusB,
      };
    });
    return { a: this.batchSummary(aId), b: this.batchSummary(bId), rows };
  }

  async getBiomarkers(batchId?: string): Promise<BiomarkersResponse> {
    await sleep(LATENCY_MS);
    const id = batchId ?? this.latestBatch().id;
    const index = this.batchIndex(id);
    const panels = groupByPanel(MARKER_FIXTURES).map(({ key, markers }) => ({
      key,
      label: panelLabelOf(key),
      rows: markers.map((marker) => this.biomarkerRow(marker, index)),
    }));
    return { batchId: id, panels };
  }

  async getBiomarkerSeries(biomarkerKey: string): Promise<BiomarkerSeries> {
    await sleep(LATENCY_MS);
    const marker = this.marker(biomarkerKey);
    const lastIndex = BATCH_FIXTURES.length - 1;
    const value = marker.series[lastIndex] ?? null;
    const flag =
      value !== null
        ? flagOf(value, marker)
        : { status: "none" as FlagStatus, label: "No reference provided" };

    const readings: BiomarkerReading[] = BATCH_FIXTURES.map((batch, index) => {
      const v = marker.series[index] ?? null;
      const f =
        v !== null
          ? flagOf(v, marker)
          : { status: "none" as FlagStatus, label: "No reference provided" };
      return {
        batchId: batch.id,
        sequence: batch.sequence,
        collectedAt: batch.collectedAt,
        value: v,
        valueQualifier: null,
        valueLabel: null,
        status: f.status,
        flagLabel: f.label,
      };
    }).reverse();

    const system = systemOfPanel(marker.panel);
    const scoreHistory = SCORE_FIXTURES[system].history;
    const scoreValue = scoreHistory[scoreHistory.length - 1] ?? 0;
    const insight = INSIGHT_FIXTURES.find((candidate) => candidate.markerKeys.includes(marker.key));

    return {
      biomarkerKey: marker.key,
      displayName: marker.name,
      panelKey: marker.panel,
      panelLabel: panelLabelOf(marker.panel),
      unit: marker.unit,
      current: {
        value,
        valueQualifier: null,
        valueLabel: null,
        refLow: marker.refLow,
        refHigh: marker.refHigh,
        refRaw: marker.refRaw,
        status: flag.status,
        flagLabel: flag.label,
        positionPct: value !== null ? positionOf(value, marker) : null,
        trend: this.trendOf(marker, lastIndex),
      },
      readings,
      related: {
        biomarkers: MARKER_FIXTURES.filter(
          (candidate) => candidate.panel === marker.panel && candidate.key !== marker.key,
        )
          .slice(0, 3)
          .map((candidate) => {
            const v = candidate.series[lastIndex] ?? null;
            const f =
              v !== null ? flagOf(v, candidate) : { status: "none" as FlagStatus, label: "" };
            return {
              biomarkerKey: candidate.key,
              displayName: candidate.name,
              status: f.status,
              valueDisplay:
                v !== null ? `${formatValue(v, candidate.decimals)} ${candidate.unit}` : "—",
            };
          }),
        score: {
          systemKey: system,
          label: systemLabelOf(system),
          value: scoreValue,
          status: scoreStatusOf(scoreValue),
        },
        insight: insight ? { id: insight.id, title: insight.title, tone: insight.tone } : null,
      },
    };
  }

  async getScores(batchId?: string): Promise<ScoresResponse> {
    await sleep(LATENCY_MS);
    const id = batchId ?? this.latestBatch().id;
    const index = this.batchIndex(id);
    return {
      batchId: id,
      overall: this.overallCard(index),
      systems: systemKeys().map((system) => this.scoreCard(system, index)),
    };
  }

  async getScoreDetail(system: SystemKey, batchId?: string): Promise<ScoreDetail> {
    await sleep(LATENCY_MS);
    const id = batchId ?? this.latestBatch().id;
    const index = this.batchIndex(id);
    const card = system === "overall" ? this.overallCard(index) : this.scoreCard(system, index);

    const inputMarkers =
      system === "overall"
        ? []
        : MARKER_FIXTURES.filter((marker) => systemOfPanel(marker.panel) === system);
    const history = (system === "overall" ? OVERALL_HISTORY : SCORE_FIXTURES[system].history)
      .slice(0, index + 1)
      .map((value, historyIndex) => {
        const batch = BATCH_FIXTURES[historyIndex];
        return batch
          ? { batchId: batch.id, sequence: batch.sequence, collectedAt: batch.collectedAt, value }
          : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    const insight = INSIGHT_FIXTURES.find((candidate) => candidate.relatedScoreKey === system);

    return {
      card,
      formulaVersion: "scores-v1",
      inputs: inputMarkers.map((marker) => {
        const value = marker.series[index] ?? null;
        const flag =
          value !== null ? flagOf(value, marker) : { status: "none" as FlagStatus, label: "" };
        return {
          biomarkerKey: marker.key,
          displayName: marker.name,
          valueDisplay:
            value !== null ? `${formatValue(value, marker.decimals)} ${marker.unit}` : "—",
          status: flag.status,
          flagLabel: flag.label,
        };
      }),
      history,
      relatedInsight: insight ? { id: insight.id, title: insight.title, tone: insight.tone } : null,
    };
  }

  async getInsights(): Promise<InsightsResponse> {
    await sleep(LATENCY_MS);
    const insights = INSIGHT_FIXTURES.map((insight) => this.insightSummary(insight.id));
    return {
      insights,
      unreadCount: insights.filter((insight) => insight.readAt === null).length,
    };
  }

  async getInsight(insightId: string): Promise<InsightDetail> {
    await sleep(LATENCY_MS);
    const fixture = INSIGHT_FIXTURES.find((insight) => insight.id === insightId);
    if (!fixture) throw new Error(`Unknown insight: ${insightId}`);
    const system = fixture.relatedScoreKey;
    const history = SCORE_FIXTURES[system].history;
    const scoreValue = history[history.length - 1] ?? 0;
    const lastIndex = BATCH_FIXTURES.length - 1;
    return {
      ...this.insightSummary(insightId),
      body: fixture.body,
      grounding: { readings: fixture.groundingReadings, knowledge: fixture.groundingKnowledge },
      relatedBiomarkers: fixture.markerKeys.map((key) => {
        const marker = this.marker(key);
        const value = marker.series[lastIndex] ?? null;
        const flag =
          value !== null ? flagOf(value, marker) : { status: "none" as FlagStatus, label: "" };
        return {
          biomarkerKey: marker.key,
          displayName: marker.name,
          status: flag.status,
          valueDisplay:
            value !== null ? `${formatValue(value, marker.decimals)} ${marker.unit}` : "—",
        };
      }),
      relatedScore: {
        systemKey: system,
        label: systemLabelOf(system),
        value: scoreValue,
        status: scoreStatusOf(scoreValue),
      },
    };
  }

  async markInsightRead(insightId: string): Promise<void> {
    await sleep(120);
    if (this.readAtById.get(insightId) === null) {
      this.readAtById.set(insightId, new Date().toISOString());
    }
  }

  async getActivity(limit = 10): Promise<ActivityEvent[]> {
    await sleep(LATENCY_MS);
    return ACTIVITY_FIXTURES.slice(0, limit).map((event) => ({ ...event }));
  }

  async getReports(): Promise<ReportRow[]> {
    await sleep(LATENCY_MS);
    return REPORT_FIXTURES.map((report) => ({ ...report }));
  }

  async getExtraction(extractionId: string): Promise<ExtractionReview> {
    await sleep(LATENCY_MS);
    if (extractionId !== EXTRACTION_REVIEW_FIXTURE.id) {
      throw new Error(`Unknown extraction: ${extractionId}`);
    }
    const items = EXTRACTION_REVIEW_FIXTURE.items.map((item) => {
      const marker = MARKER_FIXTURES.find((candidate) => candidate.key === item.biomarkerKey);
      return {
        ...item,
        displayName: marker?.name ?? null,
        panelKey: marker?.panel ?? null,
        editedByUser: false,
      };
    });
    const panels = new Set(items.map((item) => item.panelKey).filter(Boolean));
    return {
      id: EXTRACTION_REVIEW_FIXTURE.id,
      status: "needs_review",
      reportFilename: EXTRACTION_REVIEW_FIXTURE.reportFilename,
      reportDate: EXTRACTION_REVIEW_FIXTURE.reportDate,
      performingLab: EXTRACTION_REVIEW_FIXTURE.performingLab,
      error: null,
      items,
      counts: {
        values: items.length,
        panels: panels.size,
        toCheck: items.filter((item) => item.confidence !== "high").length,
      },
    };
  }

  // --- private derivations -------------------------------------------------

  private marker(key: string): MarkerFixture {
    const marker = MARKER_FIXTURES.find((candidate) => candidate.key === key);
    if (!marker) throw new Error(`Unknown biomarker: ${key}`);
    return marker;
  }

  private batchIndex(batchId: string): number {
    const index = BATCH_FIXTURES.findIndex((batch) => batch.id === batchId);
    if (index === -1) throw new Error(`Unknown batch: ${batchId}`);
    return index;
  }

  private latestBatch() {
    const latest = BATCH_FIXTURES[BATCH_FIXTURES.length - 1];
    if (!latest) throw new Error("No batches in fixtures");
    return latest;
  }

  private batchSummary(batchId: string): BatchSummary {
    const index = this.batchIndex(batchId);
    const batch = BATCH_FIXTURES[index]!;
    const overall = OVERALL_HISTORY[index] ?? null;
    return {
      id: batch.id,
      sequence: batch.sequence,
      collectedAt: batch.collectedAt,
      performingLab: batch.performingLab,
      markerCount: MARKER_FIXTURES.filter((marker) => marker.series[index] !== undefined).length,
      overallScore: overall,
      overallStatus: overall !== null ? scoreStatusOf(overall) : null,
      isLatest: index === BATCH_FIXTURES.length - 1,
      isBaseline: batch.sequence === 1,
    };
  }

  private measurementAt(marker: MarkerFixture, batchIndex: number): Measurement {
    const value = marker.series[batchIndex] ?? null;
    const flag =
      value !== null
        ? flagOf(value, marker)
        : { status: "none" as FlagStatus, label: "No reference provided" };
    return {
      id: `${marker.key}-${batchIndex + 1}`,
      biomarkerKey: marker.key,
      displayName: marker.name,
      panelKey: marker.panel,
      panelLabel: panelLabelOf(marker.panel),
      value,
      valueQualifier: null,
      valueLabel: null,
      unit: marker.unit,
      refLow: marker.refLow,
      refHigh: marker.refHigh,
      refRaw: marker.refRaw,
      status: flag.status,
      flagLabel: flag.label,
    };
  }

  private biomarkerRow(marker: MarkerFixture, batchIndex: number): BiomarkerRow {
    const value = marker.series[batchIndex] ?? null;
    const flag =
      value !== null
        ? flagOf(value, marker)
        : { status: "none" as FlagStatus, label: "No reference provided" };
    return {
      biomarkerKey: marker.key,
      displayName: marker.name,
      status: flag.status,
      flagLabel: flag.label,
      value,
      valueQualifier: null,
      valueLabel: null,
      unit: marker.unit,
      refRaw: marker.refRaw,
      series: marker.series.slice(0, batchIndex + 1),
      trend: this.trendOf(marker, batchIndex),
    };
  }

  private trendOf(marker: MarkerFixture, batchIndex: number): BiomarkerTrend | null {
    const current = marker.series[batchIndex];
    const previous = marker.series[batchIndex - 1];
    if (current === undefined || previous === undefined) return null;
    const delta = round(current - previous, marker.decimals);
    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const status = flagOf(current, marker).status;
    return {
      direction,
      deltaLabel:
        delta === 0
          ? "0"
          : `${delta > 0 ? "+" : "−"}${formatValue(Math.abs(delta), marker.decimals)}`,
      tone: delta === 0 ? "none" : status,
    };
  }

  private scoreCard(system: Exclude<SystemKey, "overall">, batchIndex: number): ScoreCard {
    const { history, blurb } = SCORE_FIXTURES[system];
    const value = history[batchIndex] ?? 0;
    const previous = history[batchIndex - 1];
    return {
      systemKey: system,
      label: systemLabelOf(system),
      value,
      status: scoreStatusOf(value),
      delta: previous !== undefined ? value - previous : null,
      blurb,
    };
  }

  private overallCard(batchIndex: number): ScoreCard {
    const value = OVERALL_HISTORY[batchIndex] ?? 0;
    const previous = OVERALL_HISTORY[batchIndex - 1];
    return {
      systemKey: "overall",
      label: systemLabelOf("overall"),
      value,
      status: scoreStatusOf(value),
      delta: previous !== undefined ? value - previous : null,
      blurb: OVERALL_BLURB,
    };
  }

  private insightSummary(insightId: string): InsightSummary {
    const fixture = INSIGHT_FIXTURES.find((insight) => insight.id === insightId);
    if (!fixture) throw new Error(`Unknown insight: ${insightId}`);
    return {
      id: fixture.id,
      title: fixture.title,
      tone: fixture.tone,
      summary: fixture.summary,
      markers: fixture.markerKeys.map((key) => ({
        biomarkerKey: key,
        displayName: this.marker(key).name,
      })),
      relatedScoreKey: fixture.relatedScoreKey,
      createdAt: fixture.createdAt,
      readAt: this.readAtById.get(fixture.id) ?? null,
    };
  }
}

// --- module-level helpers ---------------------------------------------------

function systemKeys(): Array<Exclude<SystemKey, "overall">> {
  return ["metabolic", "cardiovascular", "inflammation", "hematologic", "hepatorenal", "thyroid"];
}

function groupByPanel(
  markers: MarkerFixture[],
): Array<{ key: PanelKey; markers: MarkerFixture[] }> {
  return panelKeySchema.options.map((key) => ({
    key,
    markers: markers.filter((marker) => marker.panel === key),
  }));
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Dot position on the reference band, clamped so it stays visible. */
function positionOf(value: number, marker: MarkerFixture): number {
  const { refLow, refHigh } = marker;
  let pct: number;
  if (refLow !== null && refHigh !== null) {
    pct = ((value - refLow) / (refHigh - refLow)) * 100;
  } else if (refHigh !== null) {
    pct = (value / refHigh) * 90;
  } else if (refLow !== null) {
    pct = 100 - (refLow / Math.max(value, refLow)) * 90;
  } else {
    return 50;
  }
  return Math.max(3, Math.min(97, Math.round(pct)));
}

/** Green = improvement/in range; amber/red = moved toward or past a threshold. */
function deltaToneOf(delta: number | null, statusB: FlagStatus): FlagStatus {
  if (delta === null || delta === 0) return "none";
  if (statusB === "alert" || statusB === "watch") return statusB;
  return "good";
}
