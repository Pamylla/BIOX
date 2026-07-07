/**
 * biomarker-catalog.ts
 *
 * The concrete catalog that implements the parser's `BiomarkerCatalogPort`
 * (Dependency Inversion: the parser depends on the port, this module supplies
 * the curated data). It adds a synonym resolver on top of the port so the
 * extraction step can turn a report's marker name ("Vit D", "25-OH-vitamina D")
 * into a stable catalog code.
 *
 * Synonym matching is accent- and punctuation-insensitive: "PCR-us",
 * "PCR ultrassensível", and "PCRus" all resolve to the same code. Curation
 * mistakes fail loudly — a duplicate code, or one alias claimed by two markers,
 * throws when the catalog is built.
 */

import type { BiomarkerCatalogPort } from "../parser/biomarker-catalog.port";
import type { BiomarkerDefinition } from "./biomarker.types";
import { BIOMARKER_SEED } from "./biomarker-catalog.data";

/** The concrete catalog: the parser port plus synonym resolution and listing. */
export interface BiomarkerCatalog extends BiomarkerCatalogPort {
  findByCode(code: string): BiomarkerDefinition | null;
  /** Resolve a report's marker name/alias to its full definition; null if unknown. */
  findBySynonym(name: string): BiomarkerDefinition | null;
  /** Every definition in the catalog (read-only copy). */
  all(): BiomarkerDefinition[];
}

/**
 * Normalize a marker name/alias for matching: strip case, accents, and any
 * non-alphanumeric characters. "PCR-us" -> "pcrus"; "Triglicerídeos" ->
 * "triglicerideos"; "25-OH-vitamina D" -> "25ohvitaminad".
 */
function normalizeAlias(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // drop combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Build a catalog from a seed. Indexes by code and by normalized alias (code +
 * canonical name + synonyms). Throws on duplicate codes or ambiguous aliases so
 * curation errors surface at startup, not at parse time.
 */
export function createBiomarkerCatalog(
  seed: BiomarkerDefinition[],
): BiomarkerCatalog {
  const byCode = new Map<string, BiomarkerDefinition>();
  const codeByAlias = new Map<string, string>();

  for (const entry of seed) {
    if (byCode.has(entry.code)) {
      throw new Error(`Duplicate biomarker code: "${entry.code}"`);
    }
    byCode.set(entry.code, entry);

    for (const alias of [entry.code, entry.canonicalName, ...entry.synonyms]) {
      const key = normalizeAlias(alias);
      if (key === "") continue;
      const owner = codeByAlias.get(key);
      if (owner !== undefined && owner !== entry.code) {
        throw new Error(
          `Ambiguous synonym "${alias}" (normalized "${key}"): claimed by both "${owner}" and "${entry.code}"`,
        );
      }
      codeByAlias.set(key, entry.code);
    }
  }

  return {
    findByCode: (code) => byCode.get(code) ?? null,
    findBySynonym: (name) => {
      const code = codeByAlias.get(normalizeAlias(name));
      return code === undefined ? null : byCode.get(code) ?? null;
    },
    all: () => [...seed],
  };
}

/** The concrete, curated catalog the parser consults through the port. */
export const biomarkerCatalog = createBiomarkerCatalog(BIOMARKER_SEED);
