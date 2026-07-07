import type {
  ActivityEvent,
  BatchDetail,
  BatchSummary,
  BiomarkerSeries,
  BiomarkersResponse,
  CompareResponse,
  ExtractionReview,
  InsightDetail,
  InsightsResponse,
  ReportRow,
  ScoreDetail,
  ScoresResponse,
  SystemKey,
  UserProfile,
} from "@biox/shared/contracts";

/**
 * The only surface screens talk to (plan Fase 2: screens never touch
 * fixtures directly). MockApiClient implements it over the Marina seed;
 * HttpApiClient will implement it over the real API with the same types.
 * Write operations join incrementally as their screens are built.
 */
export interface ApiClient {
  getMe(): Promise<UserProfile>;

  getBatches(): Promise<BatchSummary[]>;
  getBatch(batchId: string): Promise<BatchDetail>;
  compareBatches(aId: string, bId: string): Promise<CompareResponse>;

  getBiomarkers(batchId?: string): Promise<BiomarkersResponse>;
  getBiomarkerSeries(biomarkerKey: string): Promise<BiomarkerSeries>;

  getScores(batchId?: string): Promise<ScoresResponse>;
  getScoreDetail(system: SystemKey, batchId?: string): Promise<ScoreDetail>;

  getInsights(): Promise<InsightsResponse>;
  getInsight(insightId: string): Promise<InsightDetail>;
  markInsightRead(insightId: string): Promise<void>;

  getActivity(limit?: number): Promise<ActivityEvent[]>;
  getReports(): Promise<ReportRow[]>;
  getExtraction(extractionId: string): Promise<ExtractionReview>;
}
