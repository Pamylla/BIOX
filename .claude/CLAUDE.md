<!-- Keep this file and .claude/docs/ updated when project structure, conventions, or tooling changes -->

# BIOX

A health-intelligence platform that turns laboratory results into an evolving, evidence-based health timeline. Stack: a TypeScript monorepo (npm workspaces) — NestJS backend + Next.js frontend (ADR-007).

> **Status: early scaffold.** The architecture is decided (ADR-007) and the monorepo is live: `backend/` (NestJS) holds the first module — the `parser` — under a Vitest suite. `frontend/` (Next.js) and the shared-types package are not created yet. Formatter hooks and testing/styling docs are still unprovisioned — run `/optimus:init` (or `/optimus:unit-test`) to add them.

## Conventions

- **Intent lives in `.biox/project.md`** — read it before designing any feature; it is the product/architecture source of truth.
- **Architecture:** Clean Architecture + SOLID, feature-based modules each with a single responsibility. Composition over inheritance; add abstractions only when a real problem demands them.
- **Typing & style:** TypeScript with strong types; prefer small, pure, self-documenting functions and meaningful names over magic numbers.
- **AI boundary:** AI explains, summarizes, and correlates results — it must NEVER calculate medical scores. Deterministic/medical calculations live in code, kept separate from AI interpretations.
- **UX target:** clean, calm, minimal, spacious — modeled on Linear, Notion, and Stripe.
- **Commits:** Conventional Commits — `type(scope): description` in English, imperative mood, lowercase (e.g. `docs(project): redefine project vision and engineering goals`). Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`.

## Modules (planned)

- **Frontend** — Auth, Dashboard, Patient Profile, Exams, Timeline, Scores, Reports, Settings
- **Backend** — Auth, Patient, Exam, Parser, Biomarker, Knowledge Base, Score Engine, AI, Recommendation

## Commands

Monorepo via npm workspaces (ADR-007): `backend/` (NestJS) is the only workspace so far; `frontend/` (Next.js) + a shared package join later. Root scripts delegate to `backend`.
- `npm test` — run the test suite once (Vitest)
- `npm run test:watch` — Vitest in watch mode
- `npm run typecheck` — `tsc --noEmit` over `backend/`

## Documentation

Read the relevant doc before making changes:
- `.claude/docs/coding-guidelines.md` — for new features, refactoring, code structure

## Agents

After implementing features or fixing bugs:
- `.claude/agents/code-simplifier.md` — simplifies recently changed code
