# ADR-002 — Store the reference range per measurement

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related:** FR-08, NFR-05, [domain/overview.md](../../02-domain/overview.md)

## Context

Each lab report carries its own reference range for a biomarker. Ranges differ across laboratories, across methods, and change over time. A ferritin measurement from 2023 must be interpreted against the range printed on the 2023 report, not against a range edited into the catalog later. FR-08 extracts the range from the report itself.

## Decision

Store the reference range **on each `Measurement`**, exactly as reported, rather than on the `Biomarker` catalog entry. The catalog never holds ranges: when a report omits a range, the `Measurement` simply has none (a neutral flag) — a range is never invented or backfilled from the catalog.

## Consequences

- **+** Historical accuracy: every measurement keeps the range it was judged against; classification stays faithful to the source document.
- **+** Supports honest reading (NFR-05) — the system never retroactively rewrites how a past result was classified.
- **−** Denormalization: the same range repeats across many measurements of the same biomarker.
- **−** A report that omits a range yields a `Measurement` with no range (neutral flag); the range is never fabricated — the UI must represent "no range provided" honestly.
