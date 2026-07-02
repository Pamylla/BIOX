# ADR-004 — No RAG in the MVP; curated knowledge in context

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related:** [project.md](../../../.biox/project.md), [product-requirements.md](../../01-product/product-requirements.md) (§3, §8)

## Context

`project.md` sets Retrieval-Augmented Generation as a goal ("whenever possible, AI responses should be grounded using RAG"). A full RAG pipeline requires a vector store, an indexing process, chunking strategy, and retrieval evaluation — significant infrastructure. The MVP works with a small, well-known set (~22 biomarkers), for which the grounding knowledge is bounded and reviewable.

## Decision

The MVP grounds AI explanations with **curated knowledge injected directly into the prompt context**, not retrieval. **RAG is deferred to post-MVP** (see [roadmap](../../01-product/roadmap.md) post-MVP horizon).

This ADR is the explicit record of *why* the MVP diverges from the `project.md` "whenever possible RAG" guidance.

## Consequences

- **+** Faster path to a grounded MVP with no vector infrastructure to build or operate.
- **+** Curated context is small enough to be human-reviewed for correctness — a good fit for sensitive health content.
- **−** Does not scale to a large knowledge base; the approach is revisited when the knowledge outgrows the context window.
- **−** Grounding is only as good as the curation; the curated set must be version-controlled and reviewed.
