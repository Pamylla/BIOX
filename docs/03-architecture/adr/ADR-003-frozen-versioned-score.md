# ADR-003 — Scores are frozen at confirmation with a formula version

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related:** FR-17, FR-18, FR-19, FR-29, NFR-03, [domain/overview.md](../../02-domain/overview.md)

## Context

Scores are the deterministic heart of the product (FR-17, FR-18). Score formulas will evolve as the model matures. The product must guarantee that a score is auditable and reproducible (FR-29, NFR-03), and that changing a formula does not silently rewrite a user's history.

## Decision

Compute scores **deterministically in code**, and at the moment of confirmation **freeze** the resulting value together with:

- the **formula version** used, and
- the **source measurement ids** the score was computed from.

Scores are never recomputed silently on read. Recomputation after a formula change is an explicit, deliberate operation, and produces new versioned score records rather than mutating existing ones.

## Consequences

- **+** Reproducibility (FR-29) and auditability: any historical score can be recomputed from its stored inputs and formula version.
- **+** Stable history across formula changes; enables version diffing (FR-23).
- **+** Reinforces the deterministic core — the score is a pure function of measurements and formula version.
- **−** Requires versioning formulas and persisting the inputs of every score.
- **−** After a formula change, old and new scores coexist; the UI must communicate which version a score belongs to.
