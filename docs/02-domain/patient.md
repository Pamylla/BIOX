# Patient

**Document:** `docs/02-domain/patient.md`
**Type:** permanent entity
**Related:** `overview.md`, `extraction.md`, `batch.md`, `measurement.md`

---

## Purpose

Hold the clinical data of the monitored person. `Patient` is the central node of the domain — nearly everything else (`Extraction`, `Batch`, `Measurement`, `Score`, `Insight`) hangs off it. It exists to answer "whose health data is this?", separate from "who is logged in?" (that's `User`).

## Responsibilities

- Store the lean clinical profile: sex, date of birth, height, lifestyle flags (vegetarian, smoker), declared conditions and medications.
- Serve as the anchor point for the person's entire health history.

Not the `Patient`'s responsibility: authentication and access control (that's `User`), and weight as a single value (weight is a time series — see Business rules).

## Relationships

- Belongs to one `User` (1:1 in the MVP).
- Has many `Extractions` (the uploaded reports).
- Has many `Batches` (the dated clinical events).
- Has many `Measurements` (the values measured over time).
- Has many `Scores` and `Insights`.

## Business rules

- **Weight is a time series, not a static field.** It lives as an *anthropometric* `Measurement` — a value on a date — not as a single overwritten field. The product thesis ("what was the impact of a weight change?") is impossible if weight is only a current number. Modeled this way, weight inherits everything the laboratory markers already have: timeline, linear-regression trend, deltas. The only difference is that an anthropometric marker is self-measured rather than parsed from a lab report — a flag on the `Biomarker`, not a new table.
  - **Entered via the Profile** (a quick "add today's weight", no upload ceremony), because it is manual and frequent.
  - **Displayed on the Dashboard/Timeline** alongside the other markers, because clinically it belongs there — the AI needs it to reason about metabolic and cardiovascular context.
- **Height can be static** (it changes little in adults).
- **Age is derived from the date of birth**, never stored as a number — otherwise it goes stale.
- **Conditions and medications are context for the AI, nothing more** in the MVP. They do not activate clinical protocols (the Protocol Engine is post-MVP). Example: a declared anti-inflammatory tells the AI that CRP may be suppressed — but it does not change the `Score` computation.
- **Explicit LGPD consent** for processing sensitive data is mandatory and recorded with a date (health data is sensitive — LGPD art. 11).
- **Cascading soft-delete (within an active account).** Deleting a `Patient`'s data marks all linked clinical data as deleted, in cascade — reversible, never a silent edit. This is distinct from **account deletion** (FR-06), which performs an irreversible hard purge of all the account's data (LGPD right to erasure). The two delete semantics — reversible in-account soft-delete vs. account-level hard purge — and the purge mechanism will be detailed in `03-architecture/data-model.md` *(to be added)*.

## Future evolution

- The relationship with `User` goes from 1:1 to 1:N, enabling the caregiver profile (one account managing several patients). The existing `User`/`Patient` separation makes this a change of cardinality, not of architecture.
- Gains a link to a lightweight user-conditions table when the Protocol Engine arrives, activating condition-based clinical interpretation protocols. The current structure already accommodates this.
- The anthropometric `Measurement` model opens the door to other manual, non-lab measurements (blood pressure, waist circumference, fingerstick glucose) entering through the same path later — no new schema. Modeled broad, instantiated lean.
