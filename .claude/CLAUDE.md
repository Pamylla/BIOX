<!-- Keep this file and .claude/docs/ updated when project structure, conventions, or tooling changes -->

# BIOX

A health-intelligence platform that turns laboratory results into an evolving, evidence-based health timeline. Stack: a TypeScript monorepo (pnpm workspaces) — NestJS API + Vite/React web app + a framework-free shared package (see `docs/implementation-plan.md` §8).

> **Status: MVP build in progress**, phase by phase per `docs/implementation-plan.md`. Three workspaces are live: `apps/api` (NestJS — `auth`, `users`, `health`, `storage` modules so far; Prisma + Postgres via `docker-compose.yml`), `apps/web` (Vite + React + React Router — design system in `src/ui`, app shell in `src/app`, feature scaffolds in `src/features`), and `packages/shared` (zod contracts, biomarker catalog, extraction utilities). Formatter hooks (husky + lint-staged) are provisioned; testing/styling docs are still missing — run `/optimus:unit-test` to add them.

## Conventions

- **Intent lives in `.biox/project.md`** — read it before designing any feature; it is the product/architecture source of truth.
- **Architecture:** Clean Architecture + SOLID, feature-based modules each with a single responsibility. Composition over inheritance; add abstractions only when a real problem demands them.
- **Typing & style:** TypeScript with strong types; prefer small, pure, self-documenting functions and meaningful names over magic numbers.
- **AI boundary:** AI explains, summarizes, and correlates results — it must NEVER calculate medical scores. Deterministic/medical calculations live in code, kept separate from AI interpretations.
- **UX target:** clean, calm, minimal, spacious — modeled on Linear, Notion, and Stripe.
- **Commits:** Conventional Commits — `type(scope): description` in English, imperative mood, lowercase (e.g. `docs(project): redefine project vision and engineering goals`). Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`.

## Modules

- **`apps/web`** — features by domain in `src/features/`: auth, dashboard, ingestion, timeline, biomarkers, scores, insights, settings. Design system (`src/ui`), app shell/router (`src/app`), API client layer (`src/api`).
- **`apps/api`** — NestJS modules in `src/modules/`: auth, users, health, storage today; reports, extractions, batches, measurements, scores, insights, catalog, activity, privacy planned (implementation plan §8).
- **`packages/shared`** — deterministic, framework-free code importable by both apps: `contracts/` (zod schemas, the single source of API types), `catalog/` (biomarker catalog), `extraction/` (Brazilian-number parsing, unit conversion, magnitude checks); the flag/score engines land here as pure functions.

## Commands

Monorepo via pnpm workspaces: `apps/api` (NestJS), `apps/web` (Vite + React), `packages/shared`. Root scripts fan out with `pnpm -r`.

- `pnpm test` — run every workspace's test suite once (Vitest)
- `pnpm typecheck` — `tsc --noEmit` in every workspace
- `pnpm lint` — ESLint over the repo
- `pnpm format:check` — Prettier check
- `pnpm dev` — all apps in watch mode (`pnpm -r --parallel dev`)
- `pnpm build` — build every workspace

Scope a single workspace with `--filter`, e.g. `pnpm --filter @biox/api test:watch`.

## Documentation

Read the relevant doc before making changes:
- `.claude/docs/coding-guidelines.md` — for new features, refactoring, code structure

## Agents

After implementing features or fixing bugs:
- `.claude/agents/code-simplifier.md` — simplifies recently changed code
