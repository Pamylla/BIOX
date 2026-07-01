<!-- Keep this file and .claude/docs/ updated when project structure, conventions, or tooling changes -->

# BIOX

A health-intelligence platform that turns laboratory results into an evolving, evidence-based health timeline. Intended stack: TypeScript across a modular frontend and backend (not yet scaffolded).

> **Status: greenfield.** Only the vision doc at `.biox/project.md` exists — no code, manifest, or tooling yet. Re-run `/optimus:init` once the project is scaffolded to detect the real stack and install formatter hooks, testing/styling/architecture docs, and the test-guardian agent.

## Conventions

- **Intent lives in `.biox/project.md`** — read it before designing any feature; it is the product/architecture source of truth.
- **Architecture:** Clean Architecture + SOLID, feature-based modules each with a single responsibility. Composition over inheritance; add abstractions only when a real problem demands them.
- **Typing & style:** TypeScript with strong types; prefer small, pure, self-documenting functions and meaningful names over magic numbers.
- **AI boundary:** AI explains, summarizes, and correlates results — it must NEVER calculate medical scores. Deterministic/medical calculations live in code, kept separate from AI interpretations.
- **UX target:** clean, calm, minimal, spacious — modeled on Linear, Notion, and Stripe.

## Modules (planned)

- **Frontend** — Auth, Dashboard, Patient Profile, Exams, Timeline, Scores, Reports, Settings
- **Backend** — Auth, Patient, Exam, Parser, Biomarker, Knowledge Base, Score Engine, AI, Recommendation

## Commands

No build/test/lint tooling exists yet — add commands here after scaffolding the project.

## Documentation

Read the relevant doc before making changes:
- `.claude/docs/coding-guidelines.md` — for new features, refactoring, code structure

## Agents

After implementing features or fixing bugs:
- `.claude/agents/code-simplifier.md` — simplifies recently changed code
