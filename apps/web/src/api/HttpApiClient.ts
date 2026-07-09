import type {
  ActivityEvent,
  BatchDetail,
  BatchSummary,
  BiomarkerSeries,
  BiomarkersResponse,
  CompareResponse,
  DiscardExtractionResponse,
  ExtractionItem,
  ExtractionReview,
  InsightDetail,
  InsightsResponse,
  ReportRow,
  ScoreDetail,
  ScoresResponse,
  SystemKey,
  UpdateExtractionItem,
  UploadReportResponse,
  UserProfile,
} from "@biox/shared/contracts";
import type { ApiClient } from "./ApiClient";

/** Error carrying the API's `{ error: { code, message } }` contract (plan §10). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface HttpApiClientOptions {
  /** API origin including the version prefix, e.g. "http://localhost:3333/v1". */
  baseUrl: string;
  /** Current Firebase ID token, or null when signed out. Called per request so it stays fresh. */
  getToken: () => Promise<string | null>;
  /**
   * Screens whose endpoints aren't built on the API yet delegate here — a
   * migration scaffold, not the destination. As each backend lands (scores in
   * Fase 5, insights in Fase 6…), its method moves from the fallback to a real
   * request below.
   */
  fallback: ApiClient;
}

/**
 * The real ApiClient over `fetch`. Today it serves the ingestion flow
 * (reports + extraction review) live and delegates every other screen to the
 * mock fallback, so the app stays whole while the backend fills in phase by phase.
 */
export class HttpApiClient implements ApiClient {
  constructor(private readonly options: HttpApiClientOptions) {}

  // --- live: ingestion pipeline -------------------------------------------

  getReports(): Promise<ReportRow[]> {
    return this.request("GET", "/reports");
  }

  uploadReport(file: File): Promise<UploadReportResponse> {
    const body = new FormData();
    body.append("file", file);
    return this.request("POST", "/reports", { body });
  }

  getExtraction(extractionId: string): Promise<ExtractionReview> {
    return this.request("GET", `/extractions/${encodeURIComponent(extractionId)}`);
  }

  updateExtractionItem(
    extractionId: string,
    itemId: string,
    patch: UpdateExtractionItem,
  ): Promise<ExtractionItem> {
    return this.request(
      "PATCH",
      `/extractions/${encodeURIComponent(extractionId)}/items/${encodeURIComponent(itemId)}`,
      { json: patch },
    );
  }

  discardExtraction(extractionId: string): Promise<DiscardExtractionResponse> {
    return this.request("POST", `/extractions/${encodeURIComponent(extractionId)}/discard`);
  }

  // --- delegated to the fallback until their endpoints exist ---------------

  getMe(): Promise<UserProfile> {
    return this.options.fallback.getMe();
  }
  getBatches(): Promise<BatchSummary[]> {
    return this.options.fallback.getBatches();
  }
  getBatch(batchId: string): Promise<BatchDetail> {
    return this.options.fallback.getBatch(batchId);
  }
  compareBatches(aId: string, bId: string): Promise<CompareResponse> {
    return this.options.fallback.compareBatches(aId, bId);
  }
  getBiomarkers(batchId?: string): Promise<BiomarkersResponse> {
    return this.options.fallback.getBiomarkers(batchId);
  }
  getBiomarkerSeries(biomarkerKey: string): Promise<BiomarkerSeries> {
    return this.options.fallback.getBiomarkerSeries(biomarkerKey);
  }
  getScores(batchId?: string): Promise<ScoresResponse> {
    return this.options.fallback.getScores(batchId);
  }
  getScoreDetail(system: SystemKey, batchId?: string): Promise<ScoreDetail> {
    return this.options.fallback.getScoreDetail(system, batchId);
  }
  getInsights(): Promise<InsightsResponse> {
    return this.options.fallback.getInsights();
  }
  getInsight(insightId: string): Promise<InsightDetail> {
    return this.options.fallback.getInsight(insightId);
  }
  markInsightRead(insightId: string): Promise<void> {
    return this.options.fallback.markInsightRead(insightId);
  }
  getActivity(limit?: number): Promise<ActivityEvent[]> {
    return this.options.fallback.getActivity(limit);
  }

  // --- transport -----------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    init: { json?: unknown; body?: BodyInit } = {},
  ): Promise<T> {
    const token = await this.options.getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    let body = init.body;
    if (init.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(init.json);
    }

    const response = await fetch(`${this.options.baseUrl}${path}`, { method, headers, body });
    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const fallbackCode = `http_${response.status}`;
  try {
    const payload = (await response.json()) as { error?: { code?: string; message?: string } };
    const error = payload.error;
    return new ApiError(
      response.status,
      error?.code ?? fallbackCode,
      error?.message ?? response.statusText,
    );
  } catch {
    return new ApiError(response.status, fallbackCode, response.statusText);
  }
}
