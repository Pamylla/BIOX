# Roadmap — BIOX

| | |
|---|---|
| **Document** | `docs/01-product/roadmap.md` |
| **Status** | Draft |
| **Related** | [`product-requirements.md`](product-requirements.md) (what), [`.biox/project.md`](../../.biox/project.md) (why) |

---

## How to read this roadmap

- **Milestone-based, not date-based.** BIOX is an educational project; milestones are ordered by dependency and risk, not by artificial deadlines.
- **Risk first.** The parser is the anchor metric of the MVP — if extraction is not reliable, nothing downstream matters. It is validated early, before the product is built around it.
- **Documentation first.** Every milestone starts with its design documented (domain docs, ADRs) before implementation, as defined in `.biox/project.md`.
- **Each milestone ends demoable.** A milestone is done when something can be shown working, not when code is merged.
- `FR-##` / `NFR-##` references point to the [product requirements](product-requirements.md).

---

## M0 — Repository foundation ✅

Repository, branch workflow (`main` → `develop` → `feature/*`), README, MIT license, product requirements document, protected `main`.

**Done when:** foundation PR merged into `develop`. *(current phase)*

---

## M1 — Design & documentation

The design that everything else implements.

- **Domain model** ([`02-domain/`](../02-domain/overview.md)) — ubiquitous language and per-entity docs (User, Patient, Extraction, Batch, Measurement, Biomarker, Score, Insight).
- **Biomarker catalog** — the ~22 markers: canonical names, units, domains, clinical direction, parser synonyms.
- **Data model** (`03-architecture/data-model.md`) — detailed schemas and design principles (soft-delete, versioning, weight modeling decision), to be realized as a Prisma schema.
- **Architecture Decision Records** ([`03-architecture/adr/`](../03-architecture/adr/README.md)):
  - Accepted: PostgreSQL over Firestore (ADR-001), reference range per measurement (ADR-002), frozen versioned score (ADR-003), no RAG in the MVP (ADR-004), insight does not feed the score (ADR-005), LLM parser with human review (ADR-006).
  - Proposed: backend architecture (ADR-007), LLM provider (ADR-008).
- **Architecture overview** — Clean Architecture + DDD module map for frontend and backend.

**Done when:** every MVP domain has its entities and rules documented; open decisions from PRD §8 are resolved or explicitly deferred; proposed ADRs (007, 008) accepted.

---

## M2 — Engineering scaffold

The technical skeleton, empty but running — backend shape as decided in ADR-007.

- Monorepo with Next.js (web) and the backend per ADR-007 (dedicated NestJS api, or Next.js Route Handlers + parsing worker), TypeScript strict everywhere.
- PostgreSQL + Prisma, Docker Compose for local development.
- Firebase project (Authentication & Storage) wired to local development.
- CI pipeline: lint, typecheck, tests on every PR.
- Testing infrastructure (unit + e2e baseline).

**Done when:** `docker compose up` starts the full local stack; CI is green on a trivial PR.

---

## M3 — Parser core (de-risking the anchor metric)

A standalone extraction package, built before the product UI so extraction quality is measured early. Per ADR-006, extraction is LLM-assisted with a mandatory human review step; the normalization and classification around it stay deterministic and fully unit-tested.

- Text extraction from Brazilian lab report PDFs, LLM-assisted (ADR-006, FR-08).
- Extraction of the ~22 catalog biomarkers: values, units, reference ranges (FR-08).
- Deterministic unit normalization to canonical units (FR-09).
- Censored values preserving qualifiers (`< 0.3`, `> 1000`) (FR-12).
- Corpus of real (anonymized) Brazilian lab reports + extraction quality report.

**Done when:** extraction quality is measured against the corpus and considered acceptable to build on; the deterministic normalization/classification logic is fully unit-tested.

---

## M4 — Auth & clinical profile

- Sign-up / sign-in via Google or e-mail with Firebase Authentication (FR-01).
- Explicit consent for sensitive-data processing (FR-02).
- Lean clinical profile + editing (FR-03, FR-05).
- Weight as a dated time series (FR-04).
- Account deletion with full data removal (FR-06, NFR-01).

**Done when:** PRD success criterion 1 passes — create account, consent, fill profile.

---

## M5 — Upload pipeline

From PDF to confirmed data, end to end.

- PDF upload (FR-07) stored in Firebase Storage and processed asynchronously by a job/worker (NFR-06).
- Review modal with per-marker confirmation checkboxes (FR-10) and duplicate flagging (FR-11).
- Uploaded-reports tab (FR-13) with cascading soft-delete (FR-14, NFR-04) and refresh (FR-15).

**Done when:** PRD success criteria 2 and 5 pass — upload a real report, confirm markers; delete a report and see data disappear in cascade.

---

## M6 — Scores & dashboard

The deterministic heart of the product.

- Score engine: 5 domain scores + overall score (FR-17, FR-18), calculated exclusively in code.
- Scores frozen at confirmation with versioned formulas (FR-19, FR-29, NFR-03).
- Dashboard: overall score, per-domain scores, improvement/worsening indicators (FR-20).

**Done when:** PRD success criterion 3 passes — confirm markers and see calculated scores; every score reproducible from original measurements + formula version.

---

## M7 — Timeline & trends

The longitudinal thesis, made visible.

- Timeline of each marker across dates (FR-21).
- Trend (linear regression) and percentage variation per marker (FR-22).

**Done when:** PRD success criterion 4 passes — upload a second report from a different date and watch the timeline evolve.

---

## M8 — Explanatory AI

AI enters last, on top of a working deterministic product.

- Patient identifiers removed before any LLM call (FR-28, NFR-01).
- Longitudinal explanation of a marker or score (FR-24), honest about known limitations (NFR-05).
- Insight traceability: model, `basedOnResultIds`, fixed disclaimer (FR-26, NFR-02).
- Declared medications as interpretation context (FR-27).
- Natural-language questions over the user's data (FR-25).
- Clinical boundaries of PRD §6 enforced at the architecture level (AI has read-only access to data and scores).

**Done when:** PRD success criterion 6 passes — ask for an explanation and receive an honest longitudinal narrative with disclaimer.

---

## M9 — MVP hardening & release

- Full end-to-end walkthrough of all six PRD success criteria.
- LGPD checklist review: consent, real deletion, anonymization (NFR-01).
- Mobile responsiveness pass on dashboard and timeline (NFR-07).
- P2 items if capacity allows: manual result entry/correction (FR-16), batch comparison (FR-23).

**Done when:** all six success criteria pass end to end on a fresh account with real reports. **This is the MVP.**

---

## Post-MVP horizon

Deferred by the PRD, in no committed order:

- **RAG + indexed knowledge base** — replaces curated-context grounding (revisits ADR-004; core learning goal of the project).
- **Protocol Engine** — interpretation by clinical condition.
- **Recommendation engine.**
- **Exportable reports** (PDF).
- **Multi-patient / caregiver profiles.**
- **Security hardening** — encryption at rest, access-control review (PRD §8 open decision).
- **OCR** — support for photographed/scanned reports (extends the parser beyond text PDFs).

---

*This roadmap evolves with the project. Changes that alter MVP scope must be reflected in the PRD first.*
