/**
 * extraction-item.factory.ts
 *
 * Turns one raw marker the LLM transcribed (ExtractorItem) into a persistable
 * ExtractionItem row — the deterministic middle of the pipeline (plan §11.3
 * steps 4–6). Everything here is code, never AI:
 *
 *  4. normalize the Brazilian-formatted number  (parse-marker-value / brazilian-number)
 *  5. resolve rawLabel → biomarkerKey via catalog synonyms (unresolved = null, revisable)
 *  6. run the plausibility (magnitude) sanity check → downgrade confidence
 *
 * Guiding rule: the deterministic pipeline only ever LOWERS the model's
 * confidence — never raises it. When its own checks distrust a value (out of
 * plausible magnitude, unparseable, ambiguous separators) it flags the item so
 * it lands in the review screen's "K to check" bucket.
 */

import {
  type BiomarkerCatalog,
  type Censoring,
  parseBrazilianNumber,
  parseMarkerValue,
  type ExtractorItem,
  type ValueQualifier,
} from "@biox/shared";
import { Confidence, Plausibility, type Prisma } from "@prisma/client";

/** Item fields the worker feeds into `extractionItem.createMany` under a parent. */
type ExtractionItemData = Prisma.ExtractionItemCreateManyExtractionInput;

/** The parser only distinguishes strict from inclusive bounds by symbol class. */
function qualifierFromCensoring(censoring: Censoring): ValueQualifier | null {
  if (censoring === "less_than") return "<";
  if (censoring === "greater_than") return ">";
  return null;
}

/** Lower confidence to at most medium — used when a check distrusts the value but isn't a magnitude error. */
function cappedAtMedium(confidence: Confidence): Confidence {
  return confidence === Confidence.high ? Confidence.medium : confidence;
}

/** A raw reference bound as printed → a number in the report's unit; null when absent or unparseable. */
function parseBound(bound: string | null): number | null {
  return bound === null ? null : parseBrazilianNumber(bound).value;
}

/**
 * Build one ExtractionItem from a transcribed marker. `value`, `refLow`, and
 * `refHigh` are persisted in the report's printed unit (matching the stored
 * `unit`); canonicalization to the catalog unit happens later, at confirm →
 * Measurement (ADR-002). The magnitude check still runs on the canonical value
 * internally, because the plausibility band is defined in that unit.
 */
export function toExtractionItemData(
  item: ExtractorItem,
  catalog: BiomarkerCatalog,
): ExtractionItemData {
  const biomarkerKey = catalog.findBySynonym(item.rawLabel)?.code ?? null;

  let value: number | null = null;
  let valueQualifier: ValueQualifier | null = null;
  let plausibility: Plausibility = Plausibility.ok;
  let confidence = item.confidence as Confidence;

  if (item.rawValue !== null) {
    // An unresolved marker has no catalog entry: parseMarkerValue with an empty
    // key parses the number but skips unit conversion and the magnitude check
    // (both need a catalog entry) — a safe no-op, not a guess.
    const parsed = parseMarkerValue(
      { catalogKey: biomarkerKey ?? "", rawValue: item.rawValue, unit: item.unit ?? "" },
      catalog,
    );
    value = parsed.value;
    valueQualifier = qualifierFromCensoring(parsed.censoring);

    if (parsed.reasons.includes("magnitude_out_of_range")) {
      plausibility = Plausibility.out_of_magnitude;
      confidence = Confidence.low;
    } else if (
      parsed.reasons.includes("unparseable") ||
      parsed.reasons.includes("ambiguous_separator")
    ) {
      confidence = cappedAtMedium(confidence);
    }
  }

  return {
    rawLabel: item.rawLabel,
    biomarkerKey,
    value,
    valueQualifier,
    valueLabel: item.valueLabel,
    unit: item.unit,
    refLow: parseBound(item.refLow),
    refHigh: parseBound(item.refHigh),
    refRaw: item.refRaw,
    assayMethod: item.assayMethod,
    confidence,
    plausibility,
  };
}
