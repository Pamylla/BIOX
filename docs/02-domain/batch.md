# Batch

**Document:** `docs/02-domain/batch.md`
**Type:** permanent entity
**Related:** `overview.md`, `extraction.md`, `measurement.md`, `score.md`

---

## Purpose

Represent a **clinical event**: the set of measurements from a single collection date. `Batch` is the "commit" in the GitHub-of-health metaphor — each confirmed `Batch` is a **dated version of the person's health state**. It is the unit around which the entire longitudinal view revolves.

## Responsibilities

- Group the `Measurements` from a single collection date/context.
- Carry the **collection date** — the system's temporal axis.
- Anchor the `Scores` computed at that moment.
- Serve as the unit of comparison between versions (the "before and after").

Not the `Batch`'s responsibility: the file and the extraction process (that's `Extraction`), and the score computation itself (that's `Score` — the `Batch` only anchors it).

## Relationships

- Belongs to one `Patient`.
- Is originated by one or more `Extractions` (a clinical event may come from more than one PDF).
- Contains many `Measurements`.
- Anchors the `Scores` of that date.

## Business rules

- **The collection date, not the upload date, is the temporal axis.** It orders the timeline and the trends. Measurements collected in January and uploaded in March belong to January on the timeline.
- **Duplicate detection at query-time.** Same marker, same date, is flagged in the review modal — no extra schema field, it is a check performed at query time.
- **A `Batch` is an immutable version.** Once confirmed, it is not silently edited; a correction comes as new data (a new `Extraction`/review), preserving history.
- **Cascading soft-delete:** deleting a `Batch` marks its `Measurements` and the `Scores` anchored to it as deleted.

## Future evolution

- Becomes the unit of **version diff** — comparing two `Batches` field by field ("what changed from v2 to v3") is the basis of the longitudinal narrative and the future comparison feature. The `Batch` already stores enough for this; the diff is a computation over two of them, not a new structure.
- Supports attaching context to the event (e.g. "routine checkup", "post-treatment") when it makes sense to enrich interpretation — without changing the nature of the entity.

## Boundary note

The `Batch` begins where the `Extraction` ends: when the confirmed, reviewed data is grouped under a date. The `Extraction` handles *how the data arrived*; the `Batch` handles *what it means clinically on that date*. The derived computations (timeline, trend, diff) do **not** live in the `Batch` — they are on-demand views over the `Batches` and their `Measurements`, per the `overview.md`.
