import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SystemKey, UpdateExtractionItem } from "@biox/shared/contracts";
import { useApi } from "./ApiProvider";

/**
 * Query hooks — the data layer every screen consumes. Query keys are
 * centralized so invalidations stay predictable.
 */
export const queryKeys = {
  me: ["me"] as const,
  batches: ["batches"] as const,
  batch: (id: string) => ["batches", id] as const,
  compare: (a: string, b: string) => ["compare", a, b] as const,
  biomarkers: (batchId?: string) => ["biomarkers", batchId ?? "latest"] as const,
  biomarkerSeries: (key: string) => ["biomarkers", "series", key] as const,
  scores: (batchId?: string) => ["scores", batchId ?? "latest"] as const,
  scoreDetail: (system: SystemKey, batchId?: string) =>
    ["scores", system, batchId ?? "latest"] as const,
  insights: ["insights"] as const,
  insight: (id: string) => ["insights", id] as const,
  activity: ["activity"] as const,
  reports: ["reports"] as const,
  extraction: (id: string) => ["extractions", id] as const,
};

export function useMe() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.me, queryFn: () => api.getMe() });
}

export function useBatches() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.batches, queryFn: () => api.getBatches() });
}

export function useBatch(batchId: string) {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.batch(batchId), queryFn: () => api.getBatch(batchId) });
}

export function useCompare(aId: string | undefined, bId: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.compare(aId ?? "", bId ?? ""),
    queryFn: () => api.compareBatches(aId!, bId!),
    enabled: Boolean(aId && bId),
  });
}

export function useBiomarkers(batchId?: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.biomarkers(batchId),
    queryFn: () => api.getBiomarkers(batchId),
  });
}

export function useBiomarkerSeries(biomarkerKey: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.biomarkerSeries(biomarkerKey),
    queryFn: () => api.getBiomarkerSeries(biomarkerKey),
  });
}

export function useScores(batchId?: string) {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.scores(batchId), queryFn: () => api.getScores(batchId) });
}

export function useScoreDetail(system: SystemKey, batchId?: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.scoreDetail(system, batchId),
    queryFn: () => api.getScoreDetail(system, batchId),
  });
}

export function useInsights() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.insights, queryFn: () => api.getInsights() });
}

export function useInsight(insightId: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.insight(insightId),
    queryFn: () => api.getInsight(insightId),
  });
}

/** Marks an insight read and refreshes the list (sidebar badge, §5.11). */
export function useMarkInsightRead() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (insightId: string) => api.markInsightRead(insightId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.insights });
    },
  });
}

export function useActivity(limit?: number) {
  const api = useApi();
  return useQuery({
    queryKey: [...queryKeys.activity, limit ?? 10],
    queryFn: () => api.getActivity(limit),
  });
}

export function useReports() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.reports, queryFn: () => api.getReports() });
}

export function useExtraction(extractionId: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.extraction(extractionId),
    queryFn: () => api.getExtraction(extractionId),
    // While the worker runs, poll until the extraction leaves `processing`.
    refetchInterval: (query) => (query.state.data?.status === "processing" ? 2_000 : false),
  });
}

/** Uploads a PDF; the caller navigates to review once the extraction id comes back. */
export function useUploadReport() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.uploadReport(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    },
  });
}

/** Persists an inline correction and refreshes the extraction under review. */
export function useUpdateExtractionItem(extractionId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, patch }: { itemId: string; patch: UpdateExtractionItem }) =>
      api.updateExtractionItem(extractionId, itemId, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.extraction(extractionId) });
    },
  });
}

/** Soft-discards the extraction; the caller leaves the review screen on success. */
export function useDiscardExtraction() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (extractionId: string) => api.discardExtraction(extractionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    },
  });
}
