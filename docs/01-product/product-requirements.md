# Product Requirements — BIOX

| | |
|---|---|
| **Document** | `docs/01-product/product-requirements.md` |
| **Status** | MVP |
| **Source of truth** | [`.biox/project.md`](../../.biox/project.md) (vision & engineering goals) |
| **Related** | Domain model, data model and biomarker catalog docs will be added as the project evolves |

---

## 1. Summary

BIOX is a **health intelligence dashboard**: the user uploads their laboratory exams and the system shows the **evolution of their health over time**, with per-domain scores, trends and AI-generated explanations.

The differentiator is **not** interpreting an isolated exam — it is the **longitudinal** view. Each new exam creates a new version of the health state (the "GitHub of health" metaphor), and the value lies in answering *what changed, what improved, what deserves attention* over time.

**What BIOX explicitly is not:** it does not diagnose, does not prescribe, does not treat, and never states "you have disease X". It interprets and contextualizes data; the clinical conclusion always belongs to the physician.

---

## 2. Problem and audience

**Problem.** Exam results live scattered across PDFs from different laboratories, each one a static snapshot. A person cannot see whether their ferritin has been rising for three exams, whether the effort to lower CRP worked, or whether something is slowly getting worse. The information exists, but it is not navigable through time.

**MVP audience.** People who closely track their own health — those managing a chronic condition, those who do regular check-ups, those who want to understand their own evolution. In the MVP, one user monitors themselves (1:1).

---

## 3. MVP scope

### In scope ✅

- Authentication (Google / e-mail).
- Lean clinical profile (sex, birth date, height, flags, conditions, medications).
- **Weight as a time series** (dated, not a single field).
- Exam PDF upload.
- **Parser** for Brazilian lab reports extracting ~22 biomarkers.
- **Review modal before persisting** (user confirms which markers enter).
- Uploaded-reports tab, with deletion (cascading soft-delete) and refresh.
- **5 per-domain scores** + an overall score.
- **Timeline** and **trends** (linear regression).
- Visual **dashboard** (overall score, improvement/worsening arrows, evolution).
- **Explanatory AI**: longitudinal narrative and natural-language questions.
- Minimal LGPD compliance (consent, real deletion, pre-LLM anonymization).

### Out of scope ⛔ (deferred)

- Protocol Engine (interpretation by clinical condition).
- Recommendation engine.
- Exportable reports.
- RAG / indexed knowledge base (MVP uses curated knowledge in context).
- Multi-patient / caregiver profile.
- Diagnosis, prescription, treatment — **never**, not even in the future.

---

## 4. Functional requirements

Naming: `FR-##`. Priority: **P0** (MVP does not exist without it), **P1** (MVP is incomplete without it), **P2** (nice to have).

### Account and profile

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | User authenticates via Google or e-mail | P0 |
| FR-02 | User gives explicit consent for sensitive-data processing at sign-up | P0 |
| FR-03 | User fills in a lean clinical profile (sex, birth date, height, flags, conditions, medications) | P0 |
| FR-04 | User records dated weight entries, forming a time series | P1 |
| FR-05 | User edits their profile at any time | P1 |
| FR-06 | User deletes their account; all personal data is permanently removed (LGPD right to erasure) | P0 |

### Upload and extraction

| ID | Requirement | Priority |
|---|---|---|
| FR-07 | User uploads an exam PDF | P0 |
| FR-08 | Parser extracts biomarkers, values, units and reference ranges from the report | P0 |
| FR-09 | System normalizes units to the marker's canonical unit | P0 |
| FR-10 | Before persisting, a modal lists the extracted markers with checkboxes for the user to confirm which ones enter | P0 |
| FR-11 | System detects and flags duplicate results (same marker, same date) in the modal | P1 |
| FR-12 | System handles censored values (`< 0.3`, `> 1000`) preserving the qualifier | P1 |
| FR-13 | User sees a tab with uploaded reports | P0 |
| FR-14 | User deletes a report; its data disappears from the dashboard in cascade | P0 |
| FR-15 | Screen offers refresh to see updated data after deletion | P1 |
| FR-16 | User manually registers or corrects a biomarker result (fallback for parser failures) | P2 |

### Analysis and visualization

| ID | Requirement | Priority |
|---|---|---|
| FR-17 | System calculates 5 per-domain scores (Inflammation, Iron, Metabolic, Thyroid, Cardiovascular) | P0 |
| FR-18 | System calculates an overall score | P0 |
| FR-19 | Score is frozen at confirmation time, with the formula version recorded | P0 |
| FR-20 | Dashboard shows overall score, per-domain scores and improvement/worsening indicator | P0 |
| FR-21 | Timeline shows the evolution of each marker across dates | P0 |
| FR-22 | System calculates trend (linear regression) and percentage variation per marker | P1 |
| FR-23 | System compares two versions (batches) showing what changed | P2 |
| FR-29 | Every calculation must be reproducible using the original measurements and the score version | P0 |

### Explanatory AI

| ID | Requirement | Priority |
|---|---|---|
| FR-24 | AI generates a longitudinal explanation of a marker or score (interprets, does not diagnose) | P0 |
| FR-25 | AI answers natural-language questions ("why did my score drop?", "what got worse?") | P1 |
| FR-26 | Each insight records the model used, the underlying data (`basedOnResultIds`) and a fixed disclaimer | P0 |
| FR-27 | AI considers declared medications as context (e.g. anti-TNF suppresses CRP) | P1 |
| FR-28 | Patient identifiers are removed before any LLM call | P0 |

---

## 5. Non-functional requirements

| ID | Requirement | Detail |
|---|---|---|
| NFR-01 | **Privacy (LGPD)** | Exam data is sensitive (art. 11): explicit consent, real data deletion, anonymization before the LLM |
| NFR-02 | **Traceability** | Every AI interpretation records which data it was based on and which model generated it |
| NFR-03 | **Score reproducibility** | Formula is versioned; old scores remain reproducible after a formula change |
| NFR-04 | **Non-destructiveness** | In-account deletion is soft-delete and a correction is a new record, never a silent edit. Account deletion (FR-06) is different: an irreversible hard purge of all the account's data (LGPD right to erasure), to be detailed in `03-architecture/data-model.md` *(to be added)* |
| NFR-05 | **Honest reading** | Where an exam has a known clinical limitation, the UI does not present "no changes" as "all good" — it flags the limitation |
| NFR-06 | **Parsing performance** | Extraction runs in an asynchronous process (job/worker); it does not block the UI or hit timeouts |
| NFR-07 | **Responsiveness** | Dashboard and timeline are usable on mobile |

---

## 6. Clinical boundaries (what the AI never does)

Containment requirements — as important as the functional ones:

- **It does not diagnose.** It never states the user has a disease.
- **It does not prescribe or treat.** It never suggests medication, dosage or clinical conduct.
- **It interprets, it does not conclude.** "Iron stores improving, still below the ideal for this profile" — yes. "You have anemia" — no.
- **It does not hide limitations by omission.** If a marker has a known limitation (e.g. CRP/ESR can be normal despite disease activity in certain conditions), the reading says "no signal in blood tests, which have known limitations" — not "no activity".
- **Insights never feed the score.** The AI reads data and scores; it never writes them — otherwise interpretation becomes self-confirmation.

---

## 7. MVP success criteria

The MVP is ready when a user can, end to end:

1. Create an account, give consent and fill in the profile.
2. Upload a real lab report PDF and see the markers correctly extracted in the review modal.
3. Confirm the markers and see the dashboard with calculated scores.
4. Upload a **second** report from a different date and see the **timeline evolve** (the moment that proves the longitudinal thesis).
5. Delete a wrong report and see the dashboard return to the correct state.
6. Ask the AI for an explanation and receive an honest longitudinal narrative, with disclaimer.

**Anchor metric of value:** the parser's extraction quality on real Brazilian lab reports. If step 2 is not reliable, nothing downstream matters — that is why the parser is the biggest technical risk and comes early in the roadmap.

---

## 8. Assumptions and open decisions

**Assumptions.**

- User has their reports as PDFs (not photos/paper) in the MVP.
- One user = one patient in the MVP.
- ~22 biomarkers cover most initial check-ups (see biomarker catalog, to be documented).

**Resolved.**

- Weight modeling: weight is an anthropometric `Measurement` — a flag on the `Biomarker`, not a dedicated table — so it inherits timeline, trend and deltas like lab markers. See [domain/patient.md](../02-domain/patient.md).
- Triglycerides classification: primary Metabolic, secondary Cardiovascular. See [domain/biomarker.md](../02-domain/biomarker.md).

**Open decisions** (recorded, not blocking this PRD):

- Per-domain weights in the overall score (MVP: simple versioned mean).
- Score saturation curve per marker.
- Security NFRs (encryption in transit/at rest, access control) to be detailed later in the project.

---

## 9. References

- [`.biox/project.md`](../../.biox/project.md) — product and architecture source of truth.
- Biomarker catalog — the ~22 markers, domains, clinical direction, parser synonyms *(to be added)*.
- Domain model — entities, relationships, rules *(to be added)*.
- Data model — detailed schemas and design principles *(to be added)*.
