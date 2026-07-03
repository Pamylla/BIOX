# Score

**Document:** `docs/02-domain/score.md`
**Type:** computed entity (derived)
**Related:** `overview.md`, `measurement.md`, `batch.md`, `insight.md`, ADR-003 (frozen, versioned score), ADR-005 (insight does not feed the score)

---

## Purpose

Represent a **computed indicator (0–100)**, per domain and overall, frozen at the moment a `Batch` is confirmed. The `Score` translates a set of `Measurements` into a synthetic, visual reading — the "Inflammation 72", the "Overall Score 81" — which is the heart of the dashboard. It is not AI-generated, nor recomputed on every view: it is a deterministic function of the data.

## Responsibilities

- Store the score value (0–100), the domain it refers to, and whether it is a domain or overall score.
- Store the **formula version** used in the computation.
- Reference the `Measurements` that composed it.
- Anchor to the `Batch` of the corresponding date.

Not the `Score`'s responsibility: interpreting (that's `Insight`) and being a source of truth (the truth is the `Measurements`; the Score is derived from them).

## Relationships

- Belongs to a `Batch` and a `Patient`.
- Derives from many `Measurements`.
- Is **read** by `Insights` — and **never written** by them (ADR-005).

## Business rules

- **Frozen at confirmation, with a `formulaVersion`** (ADR-003). The score is computed once, when the `Batch` is confirmed, and becomes a historical record. Changing the formula later does **not** rewrite past scores — it only increments the version for future computations. This ensures "your score improved from 71 to 45" stays true: the 71 remains 71.
- **Only the primary domain scores.** Only `Measurements` whose `Biomarker` has that domain as its `primaryDomain` enter the computation. Secondary markers are context, they do not score — which is what keeps the five scores independent.
- **Overall score = versioned simple average** in the MVP. Domain weights are a deliberately deferred decision; the simple average is the honest starting point, with the methodology disclosed.
- **Deterministic and reproducible.** Given the same set of `Measurements` and the same `formulaVersion`, the result is always the same. No non-deterministic input (such as LLM output) takes part in the computation (ADR-005).

## Derived nature

The `Score` is **computed**, not factual — it could, in theory, be recomputed from the `Measurements` and the formula. It is persisted anyway (it is not a view) precisely because the formula evolves: freezing it with a version is what allows comparing scores over time without the past rewriting itself. Derived at the source, historical in practice.

## Open decisions

- **Domain weights** in the overall score (the MVP uses a simple average).
- **Shape of the saturation curve** of the per-marker score — how a value far outside the range saturates the score (linear? asymptotic?). It affects how "sensitive" the score is to extreme values.

Both evolve without breaking history: change the formula, increment the `formulaVersion`, and old scores remain intact.

## Future evolution

- Gains domain weights and a saturation curve with no migration — just a new formula version.
- When the Protocol Engine arrives (post-MVP), condition-based protocols can adjust the *interpretation context* of the score without altering the universal computation — the reading changes, the base number does not.

## Boundary note

The `Score` says *how well* a domain is doing (the number); the `Insight` says *what that means* (the explanation). The Score is input to the Insight, never the other way around: the AI reads the score to explain it, but never rewrites it. This unidirectionality is the guarantee that the number stays a pure function of the data (ADR-005).
