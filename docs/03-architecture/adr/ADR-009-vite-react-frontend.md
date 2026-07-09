# ADR-009 — Vite + React SPA frontend in a pnpm workspaces monorepo

- **Status:** Accepted
- **Date:** 2026-07-09
- **Supersedes:** the frontend-framework and workspace-layout parts of [ADR-007](ADR-007-backend-architecture.md) (its backend decisions — dedicated NestJS API, in-process extraction worker, pg-boss — remain in force)
- **Related:** [implementation-plan.md](../../implementation-plan.md) (decisions D1 and D8, §8), [ADR-007](ADR-007-backend-architecture.md)

---

## Context

ADR-007 chose a monorepo with a Next.js frontend (`frontend/`), a NestJS backend (`backend/`), and a shared types package. When the implementation plan was drawn up and its pre-Phase-0 decisions were confirmed (D1–D9), the frontend half of that choice was revisited:

- The entire product lives behind authentication. There is no public content, so SEO and server-side rendering — the main reasons to pick Next.js — buy nothing here.
- ADR-007's own rationale for a dedicated NestJS backend was that a clean frontend ↔ backend separation demonstrates full-stack architecture for the portfolio. A plain SPA talking to that API makes the separation even cleaner than a Next.js BFF, which would blur it again.

## Decision

**1. The frontend is a Vite + React 18 + TypeScript SPA with React Router** (implementation plan D1), living in `apps/web`. No SSR, no BFF layer.

**2. The monorepo uses pnpm workspaces with the layout `apps/web`, `apps/api`, `packages/shared`** (implementation plan D8), replacing ADR-007's `frontend/`/`backend/` naming. `packages/shared` is the concrete form of ADR-007's "shared types package": framework-free TypeScript (zod contracts, biomarker catalog, extraction utilities, and — as they land — the flag/score engines) importable by both apps, so types and deterministic logic exist exactly once.

**3. Everything else in ADR-007 stands unchanged:** dedicated NestJS backend, extraction worker in-process behind a queue boundary, pg-boss on Postgres.

## Consequences

**Positive.**
- No SSR/serverless machinery to build, debug, or deploy — the web app ships as static assets, and the NestJS API stays the only long-lived service.
- The SPA ↔ API boundary is explicit in the repo layout, which is the architecture story the portfolio wants to tell.
- Shared contracts live in one framework-free package with its own tests, importable from both sides.

**Negative / costs.**
- If public, SEO-relevant pages ever appear (marketing site, shared reports), they will need a separate solution — accepted, as the product is behind auth by design.
- Without Next.js conventions, routing, code-splitting, and the app shell are hand-rolled (React Router + Vite). Accepted: the design system and shell are custom anyway (D2, D6).

## Alternatives considered

- **Keep Next.js as decided in ADR-007:** rejected once D1 made explicit that no SEO/SSR requirement exists; the framework's server side would be dead weight and would dilute the SPA ↔ API separation.
- **npm workspaces (ADR-007's implicit default):** replaced by pnpm workspaces (D8) as part of the same restructuring that fixed the `apps/*` + `packages/*` layout.
