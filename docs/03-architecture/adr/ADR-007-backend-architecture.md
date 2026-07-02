# ADR-007 — Backend architecture

- **Status:** Proposed
- **Date:** 2026-07-02
- **Related:** [roadmap.md](../../01-product/roadmap.md) (M2), NFR-06, ADR-006

## Context

The backend must expose the API, run the deterministic score engine, and run the LLM-assisted parsing jobs (ADR-006), which are long-running and likely to exceed serverless execution limits (NFR-06). BIOX is developed by a solo developer, so operational overhead is a real cost.

Two technically valid shapes are on the table:

1. **Dedicated NestJS service** — a separate backend deployment alongside the Next.js frontend. Strong DDD/Clean Architecture ergonomics, clear module boundaries, but a solo developer maintains **two deployments**.
2. **Next.js Route Handlers + a dedicated worker** — API co-located with the frontend, plus a separate worker process for long-running parsing jobs. Fewer moving parts for CRUD, but business logic risks leaking into the web layer and must be disciplined to preserve Clean Architecture.

## Decision

*Pending.* To be decided before M2 (engineering scaffold).

## Consequences

To be recorded when the decision is made. The choice affects the monorepo layout, deployment topology, and where the parsing worker lives — but not the domain model, which is deliberately framework-independent.
