import { useSearchParams } from "react-router-dom";

/**
 * Global batch context (plan §10): `?batch=` selects which snapshot the
 * Dashboard, Biomarkers and Scores screens are looking at. Undefined means
 * "latest" — the API resolves the default.
 */
export function useBatchParam(): string | undefined {
  const [searchParams] = useSearchParams();
  return searchParams.get("batch") ?? undefined;
}
