# ADR-008 — LLM provider

- **Status:** Proposed
- **Date:** 2026-07-02
- **Related:** ADR-006, ADR-004, FR-24, FR-28, NFR-01

## Context

Two LLM-dependent features need a provider: the LLM-assisted parser (ADR-006) and the explanatory AI (FR-24). Constraints that bear on the choice:

- Patient identifiers must be removed before any LLM call (FR-28, NFR-01) — the provider must be compatible with anonymized payloads.
- The MVP grounds explanations with curated context, not RAG (ADR-004).

Candidates under consideration:

1. **OpenRouter** — a single API gateway to many hosted models; fast to start, no local infrastructure, but data leaves the environment and cost scales with usage.
2. **Ollama** — locally/self-hosted open models; maximum data control (helpful for LGPD posture) and no per-token cost, but requires hosting and the quality ceiling depends on the chosen open model.

A hybrid (local for parsing, hosted for explanation, or vice-versa) is also possible.

## Decision

*Pending.* To be decided during M1/M2, weighing LGPD posture, extraction quality, and operating cost.

## Consequences

To be recorded when the decision is made. Regardless of provider, the anonymization boundary (FR-28) and the read-only AI boundary (ADR-005) hold.
