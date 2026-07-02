# ADR-005 — Insights never feed the score

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related:** product-requirements.md §6, [project.md](../../../.biox/project.md), [domain/overview.md](../../02-domain/overview.md)

## Context

The product's central boundary is that AI interprets but never computes deterministic values (`project.md`, PRD §6). If an AI-generated `Insight` could influence a `Score`, interpretation would become self-confirmation: the model would end up explaining numbers it had itself shaped, and the deterministic core would no longer be deterministic.

## Decision

`Insight` is a **read-only leaf** of the data flow. It reads `Measurements` and `Scores` and produces natural-language text. It **never writes back** to `Measurements` or `Scores`. This is enforced architecturally: AI services have no write access to clinical or score data.

## Consequences

- **+** The deterministic core stays deterministic; no feedback loop between interpretation and computation.
- **+** A clear, testable boundary — AI components can be verified to have read-only access.
- **+** Insights remain fully traceable to the data they were based on, without ever altering it.
- **−** The AI cannot "fix" data it judges wrong; corrections flow only through the deterministic path (a new measurement, ADR-002/003 semantics).
