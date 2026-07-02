# Extraction

**Document:** `docs/02-domain/extraction.md`
**Type:** permanent entity
**Related:** `overview.md`, `batch.md`, `measurement.md`, ADR-006 (LLM parser + review modal)

---

## Purpose

Represent the **uploaded lab report file** and the process of extracting data from it. `Extraction` exists to deliberately separate the *upload* (the PDF, the parsing, the review) from the *clinical event* it produces (`Batch`). One is the document that arrives; the other is the clinical meaning extracted from it.

## Responsibilities

- Hold the reference to the original file in Storage.
- Record the status of the ingestion process (uploaded, processing, awaiting review, confirmed, failed).
- Hold what the parser extracted, in raw form, before human review.
- Keep the review trail: what was confirmed and what was discarded.

Not the `Extraction`'s responsibility: being the clinical source of truth. Once confirmed, the truth lives in the structured `Measurements` — the PDF becomes archived raw material, not operational data.

## Relationships

- Belongs to one `Patient`.
- Produces one or more `Batches` (a single PDF may contain exams from different dates).
- Originates the `Measurements` that survive the review.
- Records the markers discarded during review (audit trail).

## Business rules

- **Human review before persistence.** The flow is: parser extracts → normalizes units → **review modal** shows the found markers with checkboxes → the user confirms which ones go in → only then do they become `Measurements` inside a `Batch`. No clinical data is persisted without passing through this review (see ADR-006).
- **What is discarded is recorded** as an audit trail — what was left out and why — it does not silently disappear.
- **Anonymization before the LLM.** Patient identifiers are removed before any call to the extraction model (LGPD).
- **Extraction runs asynchronously** (job/worker); it does not block the interface or hit timeouts — reports can be long.
- **Censored values** (`< 0.3`, `> 1000`) preserve the qualifier during extraction; they are not reduced to a bare number.
- **Cascading soft-delete:** deleting an `Extraction` marks the `Batches` and `Measurements` it originated as deleted, in cascade; the dashboard reflects the change on refresh.
- **The original file is retained** in Storage for reprocessing, but the domain operates on the structured data — the PDF is not re-read on every use.

## Future evolution

- Supports new input formats (photo of a report, direct integration with a lab portal) without changing the downstream entities — only the parser changes. `Batch`, `Measurement`, `Score`, and `Insight` neither know nor care where the data came from.
- Reprocessing: if the parser improves, an old `Extraction` can be reprocessed from the stored file, producing a new review.

## Boundary note

`Extraction` stops at the moment the confirmed data becomes `Measurements` grouped into a `Batch`. The **collection date**, the clinical grouping, and the versioning of the health state are the responsibility of `Batch`, not `Extraction` — see `batch.md`.
