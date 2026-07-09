# Architecture Decision Records

An **ADR** records a significant technical decision: its context, the decision itself, and its consequences. ADRs are immutable once accepted — a later decision that reverses an earlier one is a *new* ADR that supersedes it, never an edit.

Format: each ADR follows Context → Decision → Consequences, with a status.
Statuses: **Proposed** (under discussion) · **Accepted** (in force) · **Superseded** (replaced by a later ADR).

> These records were drafted from the decisions already documented across [`01-product/`](../../01-product/product-requirements.md) and [`02-domain/overview.md`](../../02-domain/overview.md). They formalize decisions that were made during product definition.

## Index

| ADR | Decision | Status |
|---|---|---|
| [ADR-001](ADR-001-postgresql-over-firestore.md) | PostgreSQL over Firestore as the system of record | Accepted |
| [ADR-002](ADR-002-reference-range-per-measurement.md) | Store the reference range per measurement | Accepted |
| [ADR-003](ADR-003-frozen-versioned-score.md) | Scores are frozen at confirmation with a formula version | Accepted |
| [ADR-004](ADR-004-no-rag-in-mvp.md) | No RAG in the MVP — curated knowledge in context | Accepted |
| [ADR-005](ADR-005-insight-does-not-feed-score.md) | Insights never feed the score | Accepted |
| [ADR-006](ADR-006-llm-parser-with-review-modal.md) | LLM-assisted parser with a human review modal | Accepted |
| [ADR-007](ADR-007-backend-architecture.md) | Next.js frontend + NestJS backend, in-process extraction worker | Partially superseded (ADR-009) |
| [ADR-008](ADR-008-llm-provider.md) | LLM provider: OpenRouter vs Ollama | Proposed |
| [ADR-009](ADR-009-vite-react-frontend.md) | Vite + React SPA frontend in a pnpm workspaces monorepo | Accepted |
