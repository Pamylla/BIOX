# ADR-006 — LLM-assisted parser with a human review modal

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related:** FR-08, FR-09, FR-10, FR-11, FR-12, NFR-06, [roadmap.md](../../01-product/roadmap.md) (M3)

## Context

Extraction from Brazilian lab report PDFs is the anchor risk of the MVP (see roadmap M3). Layouts vary widely across laboratories, which makes a purely rule-based deterministic parser brittle and expensive to maintain across formats. At the same time, the data is health-sensitive: silently persisting a mis-extracted value is unacceptable.

## Decision

Use an **LLM-assisted parser** to extract markers, values, units and reference ranges (FR-08), followed by a **mandatory human review modal** where the user confirms which markers enter before anything is persisted (FR-10). Extraction runs asynchronously in a worker (NFR-06).

The steps *around* the LLM extraction stay deterministic: unit normalization (FR-09), duplicate detection (FR-11), and censored-value handling (FR-12) are code, not model output.

## Consequences

- **+** Robust to layout variety without hand-writing a parser per laboratory.
- **+** Human-in-the-loop guards against extraction errors on sensitive data before persistence.
- **+** Downstream data (scores, timeline, insights) is built only on user-confirmed measurements.
- **−** LLM extraction is non-deterministic, so it must **never** bypass the review step; extraction quality is measured against a corpus (roadmap M3).
- **−** Adds a confirmation step to the upload flow and a dependency on the chosen LLM provider (ADR-008).
