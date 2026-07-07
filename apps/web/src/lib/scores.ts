import type { ScoreStatus } from "@biox/shared/contracts";
import type { FlagTone } from "../ui";

/** Score status labels as the design capitalizes them. */
export const SCORE_STATUS_LABEL: Record<ScoreStatus, string> = {
  excellent: "Excellent",
  good: "Good",
  watch: "Watch",
  alert: "Alert",
};

/** Score status → visual tone (excellent renders green like good). */
export function scoreTone(status: ScoreStatus): FlagTone {
  return status === "excellent" ? "good" : status;
}

/** "+3" / "−2" / "0". */
export function formatScoreDelta(delta: number): string {
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
}
