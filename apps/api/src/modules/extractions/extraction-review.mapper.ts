import {
  biomarkerCatalog,
  type ExtractionItem as ExtractionItemDto,
  type ExtractionReview,
  type PanelKey,
  type ValueQualifier,
} from "@biox/shared";
import type { Extraction, ExtractionItem, Prisma } from "@prisma/client";

export type ExtractionWithItems = Extraction & {
  items: ExtractionItem[];
  reportFile: { filename: string };
};

/** Prisma Decimal → the plain number the contract carries (null passes through). */
function decimalToNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : value.toNumber();
}

/**
 * Joins the catalog's display name + UI panel onto a stored item, so the
 * review screen never reaches into the catalog itself. An unresolved
 * biomarkerKey (null, or a code not in the catalog) leaves both null — the
 * contract's "unrecognized, fixable in review" case.
 */
export function toExtractionItemDto(item: ExtractionItem): ExtractionItemDto {
  const definition = item.biomarkerKey ? biomarkerCatalog.findByCode(item.biomarkerKey) : null;
  return {
    id: item.id,
    rawLabel: item.rawLabel,
    biomarkerKey: item.biomarkerKey,
    displayName: definition?.canonicalName ?? null,
    panelKey: definition?.panelKey ?? null,
    value: decimalToNumber(item.value),
    valueQualifier: (item.valueQualifier as ValueQualifier | null) ?? null,
    valueLabel: item.valueLabel,
    unit: item.unit,
    refLow: decimalToNumber(item.refLow),
    refHigh: decimalToNumber(item.refHigh),
    refRaw: item.refRaw,
    confidence: item.confidence,
    editedByUser: item.editedByUser,
  };
}

/**
 * Shapes the Review screen payload (plan §11.3): items with their catalog
 * display joined, plus the header counts computed server-side —
 * "N values across M panels · K to check" (K = medium + low confidence).
 */
export function toExtractionReview(extraction: ExtractionWithItems): ExtractionReview {
  const items = extraction.items.map(toExtractionItemDto);
  const panels = new Set(
    items.map((item) => item.panelKey).filter((panel): panel is PanelKey => panel !== null),
  );
  return {
    id: extraction.id,
    status: extraction.status,
    reportFilename: extraction.reportFile.filename,
    reportDate: extraction.reportDate?.toISOString() ?? null,
    performingLab: extraction.performingLab,
    error: extraction.error,
    items,
    counts: {
      values: items.length,
      panels: panels.size,
      toCheck: items.filter((item) => item.confidence !== "high").length,
    },
  };
}
