/** Formatting helpers. MVP fixes dates as "DD MMM YYYY" (plan §7, item 3). */

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** "2026-06-14" → "14 Jun 2026". */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));
}

/** Snapshot sequence as the UI shows it: 4 → "04". */
export function formatSequence(sequence: number): string {
  return String(sequence).padStart(2, "0");
}

/** "Snapshot 04 · 14 Jun 2026" — topbar / timeline label. */
export function snapshotLabel(sequence: number, collectedAt: string): string {
  return `Snapshot ${formatSequence(sequence)} · ${formatDate(collectedAt)}`;
}

/** 1834217 → "1.8 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
