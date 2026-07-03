# Insight

**Document:** `docs/02-domain/insight.md`
**Type:** AI-generated entity
**Related:** `overview.md`, `measurement.md`, `score.md`, ADR-005 (insight does not feed the score), FR-28/NFR-01 (anonymization before the LLM)

---

## Purpose

Represent an **AI-generated natural-language explanation** — the product's "the AI explains". The `Insight` turns numbers into understanding: "your iron stores have been improving across the last three exams, but are still below ideal". It is what turns a dashboard of values into a follow-up the person actually understands. It interprets and contextualizes; it **never** diagnoses, prescribes, or treats.

## Responsibilities

- Store the generated text.
- Store the model that generated it.
- Store the source data (`basedOnResultIds`) — which `Measurements`/`Scores` the explanation relied on.
- Store the fixed disclaimer.
- Store the generation timestamp.

Not the `Insight`'s responsibility: computing scores, altering data, or reaching a diagnosis. It is always a leaf of the flow — it reads, produces text, and stops.

## Relationships

- Belongs to a `Patient`.
- **Reads** `Measurements`, `Scores`, and curated knowledge.
- **Never writes** to any of those entities (ADR-005).
- It is a separate collection — never mixed with `Measurements` or `Scores`.

## Business rules (the locks)

- **Never overwrites the previous one.** Each generation is a new, historizable record. You can see what the AI said in January and what it said in April — interpretation has a history too.
- **Never feeds back into the Score Engine** (ADR-005). The AI reads data and scores; never the other way around. If the AI's interpretation influenced the data it interprets, the system would fall into self-confirmation and lose its factual anchor.
- **Always stores `basedOnResultIds` + model + disclaimer.** Every explanation is traceable to the data that originated it and the model that generated it. Without that, it is not an insight — it is a guess.
- **No diagnosis, prescription, or treatment.** It interprets and contextualizes ("iron improving, still below ideal"); it never concludes a disease or suggests a course of action. A design boundary, not a temporary limitation.
- **Does not hide a limitation by omission.** Where a marker has a known limitation, the insight mentions it — it does not present "no signal" as "all clear".
- **Anonymization before the LLM** (FR-28, NFR-01). Patient identifiers are removed before any call to the model (LGPD).

## Knowledge as context

In the MVP, the `Insight` consumes knowledge **curated in the prompt context** (no RAG — ADR-004): the ~40 relationships between markers, clinical direction, and medication effects on markers. That last point is critical: the relationships include **medication→marker** (e.g. an anti-TNF suppresses CRP), not only marker→marker — so the AI does not mislead by omission, reading a normal CRP as "no inflammation" when it is merely suppressed by the medication.

## Future evolution

- Begins consuming condition-based clinical protocols when the Protocol Engine arrives (post-MVP) — condition-aware contextual reading enriches the explanation. The `basedOn` structure already supports tracing new sources.
- May evolve from curated knowledge to an indexed base with RAG when the knowledge no longer fits in the context (see ADR-004) — an additive transition, not a rewrite.

## Boundary note

The `Insight` is interpretation, not fact. It sits at the tip of the flow: it reads `Measurements` (the data), reads `Scores` (the synthesis), reads knowledge (the context), and produces text — always read-only backwards. It is the only non-deterministic entity in the system, and that is why it is the most heavily guarded: so that the uncertainty of a language model never contaminates the factual base on which everything else rests.
