# ADR-007 — Next.js frontend + NestJS backend, with an in-process extraction worker

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related:** [ADR-001](ADR-001-postgresql-over-firestore.md) (Postgres), [ADR-006](ADR-006-llm-parser-with-review-modal.md) (parser + async extraction), NFR-06 (async processing), [roadmap.md](../../01-product/roadmap.md)

---

## Context

BIOX needs a web application (React-based UI) and a backend that runs the extraction pipeline: anonymization, an LLM call, and deterministic post-processing (unit normalization, Brazilian-number conversion + magnitude check, censoring, dedup). Two architectural questions had to be resolved together:

1. **App structure** — a single Next.js app doing both frontend and backend (via API routes), or Next.js for the frontend with a dedicated NestJS backend?
2. **Extraction worker placement** — NFR-06 already fixed that extraction runs asynchronously in a worker (it must not block the UI or hit timeouts). The open question was *where* that worker runs relative to the backend.

Two forces shaped the decision. First, this is a **solo-developer MVP** — every extra deploy and moving part is real operational cost. Second, the project is explicitly a **portfolio piece aimed at senior, international roles**, where demonstrating backend architecture maturity — not just frontend skill — is a goal.

## Decision

**1. Next.js (frontend) + a dedicated NestJS backend, as a monorepo** with workspaces: `frontend/` (Next.js), `backend/` (NestJS), and a shared types package. A single Next.js app doing everything was viable for the MVP but was not chosen.

**2. The extraction worker runs in-process inside the NestJS deployment for now, behind a queue boundary that is ready to split into a separate deployment later.** The API enqueues a job; a processor consumes it. Whether that processor lives in the same process now or a separate entrypoint later is a bootstrap detail — same queue, same processor code.

**3. The queue is `pg-boss`**, built on the existing PostgreSQL (ADR-001), rather than BullMQ + Redis.

## Rationale

**Why a dedicated NestJS backend, not Next.js API routes.**
- For the MVP alone, a single Next.js app would be faster (one codebase, one deploy). But the goal here is to demonstrate senior full-stack range beyond frontend. A structured NestJS backend — modules, dependency injection, guards, clear separation of concerns — materializes the architectural planning already in the docs (ADRs, domain model, layered design). A mature `docs/` pointing at organized NestJS modules tells a coherent story of engineering rigor; the same docs pointing at scattered API routes would not.
- NestJS is the industry's structured-backend choice and pairs naturally with the Clean-Architecture direction the codebase is already taking (the parser depends on a catalog *port*, not the concrete catalog).

**Why the NestJS choice already settled the worker's hardest question.**
- The original driver to isolate the worker was serverless timeout — functions dying in ~10–60s while an LLM extraction takes ~40s. That driver belonged to the *Next.js Route Handlers* option. A dedicated NestJS process is long-lived and has no function timeout, so a 40s extraction simply runs. With that pressure gone, an in-process worker satisfies NFR-06 without a second deployment.

**Why in-process now, split-ready later.**
- A queue is needed either way (the API enqueues, a processor consumes). The only variable is where the processor runs. Running it in-process gives the required async behavior today with **one service to operate** — decisive for a solo developer — while keeping the migration to a separate deployment cheap: same queue, same processor code, only the bootstrap changes. This mirrors the project's recurring principle: model broad, instantiate lean.

**Why pg-boss, not BullMQ + Redis.**
- pg-boss runs on the PostgreSQL BIOX already has (ADR-001) — zero new infrastructure. BullMQ requires Redis, another piece to run, observe, and pay for. pg-boss's lower throughput is irrelevant for this workload (parsing is infrequent and gated by human review). Fewer moving parts is the right call for a solo MVP.

## Consequences

**Positive.**
- Demonstrates backend architecture maturity for portfolio/hiring — the stated goal.
- NFR-06 satisfied today with a single deployment.
- No new infrastructure beyond the existing Postgres.
- Migration to a separate worker deployment is a bootstrap change, not a rewrite.
- Monorepo with shared types keeps frontend/backend contracts in sync.

**Negative / costs.**
- More work than a single Next.js app: two workspaces, NestJS setup, and deepening NestJS knowledge (its DI/decorator patterns have a learning curve). For a solo MVP this is real overhead — accepted here because the extra structure *is* the portfolio signal.
- An in-process worker means a heavy parse competes with API latency, and a crash/OOM during parsing could affect the API. Tolerated at MVP volume (low, human-gated); the queue boundary is the escape hatch.

**Triggers to revisit.**
- Promote the worker to a separate deployment (option B) when load or reliability demands it — resource isolation for LLM jobs, independent scaling, fault isolation.
- Reconsider pg-boss → BullMQ/Redis only if throughput ever becomes a real constraint (unlikely at human-gated volume).

## Alternatives considered

- **Single Next.js app (frontend + API routes):** faster for the MVP, one deploy. Rejected because it under-demonstrates backend maturity and would hit serverless timeouts on LLM extraction. Migration later (month 12–18) is possible but is avoidable rework given the decision can be made correctly now.
- **Separate worker deployment from day one (option B):** better isolation, but a second deployment's operational overhead is not justified by MVP volume. Deferred behind the queue boundary.
- **BullMQ + Redis:** more robust/higher-throughput, but adds Redis. Not justified at this volume.
