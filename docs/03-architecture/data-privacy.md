# Data Privacy

**Document:** `docs/03-architecture/data-privacy.md`
**Purpose:** how BIOX keeps personal data out of the places it must never reach — the LLM, the logs, and the repository — and how it satisfies LGPD for sensitive health data.
**Related:** NFR-01, PRD NFR-04 / FR-06 (deletion model), `parser-spike.md`, `patient.md`, `user.md`.

---

## Why this matters

BIOX processes **sensitive personal data** (health data — LGPD art. 11). A lab report is dense with identifiers that have **no clinical function** in the product but carry real privacy risk. The guiding principle is simple and absolute:

> Personal identifiers never reach the LLM, never enter logs, and never enter the repository.

Two distinct categories of risk are addressed here: **patient data** (the serious concern — clinical PII flowing through the pipeline) and **developer/repository hygiene** (a smaller, one-time concern about what becomes public when the repo opens).

---

## What counts as PII in a Brazilian lab report

None of the following has clinical use in BIOX, and all of it must be stripped before processing:

- Name
- National ID numbers (CPF, RG)
- Date of birth *(age is derived and kept; the raw date is not required as an identifier)*
- Requesting physician name and registration number (CRM)
- Laboratory protocol/order numbers
- Electronic-signature hashes
- Phone, email, address

The report's clinical body — marker, value, unit, reference range, method, collection date — is what BIOX needs. Everything else is noise to be removed.

---

## Pipeline anonymization — defense in depth

No single layer is trusted alone. Each one independently reduces exposure.

### Layer 1 — Region isolation
A lab report has a fixed structure: **header** (identity), **body** (results), **footer** (signatures). Only the **body** is needed for extraction. The header and footer — where almost all PII lives — are never sent to the extractor. This alone removes most identifiers before any model call.

### Layer 2 — Pattern redaction before the LLM
Before any call to the extraction model, a **local** redaction pass replaces recognizable PII patterns with placeholders (`[CPF]`, `[NAME]`, `[DOB]`, …). This runs on the server, never in the model. Patterns covered include national ID formats, dates of birth, emails, phone numbers, and long hex signature hashes. Redaction is applied to whatever text reaches the extractor, as a second net behind region isolation.

### Layer 3 — Minimal clinical storage
The `Patient` stores **only what has clinical use**: sex, and date of birth (to derive age). It **never** stores CPF, RG, physician data, or protocol numbers — they are dropped, not persisted. If it has no clinical function, it does not enter the database.

### Layer 4 — Original file encrypted at rest
The original PDF is retained in Storage (for reprocessing) **encrypted at rest**, and never used as operational text. The domain operates on the structured, redacted data — the raw file is archived material, not a working source.

### Layer 5 — No PII in logs or errors
Logs, error traces, and analytics never contain raw report text or identifiers. A parsing error logs the marker and the failure mode, never the patient's data.

---

## LGPD compliance

- **Sensitive data (art. 11):** health data requires a lawful basis. BIOX uses **explicit consent**, recorded with a date at signup (see `user.md`).
- **Anonymization before processing:** identifiers are removed before the data reaches the LLM (Layers 1–2), minimizing what is processed at all.
- **Data-subject rights (art. 18):** the user can request **erasure**. This is the **purge** path — permanent, irreversible removal of personal data, including already soft-deleted records and the encrypted file in Storage. See the two-tier deletion model in PRD NFR-04 / FR-06.
- **Data minimization:** only clinically useful data is stored (Layer 3).

The deletion model, in short: **soft-delete** is the everyday operational mechanism (reversible, cascading, auditable); **purge** is the legal right (permanent). They are distinct and must not be confused.

---

## Repository hygiene (developer-facing)

A public repository is itself a place PII can leak — not through the app, but through committed files and git metadata.

### Rule 1 — Only synthetic data in the repository
No real lab report, real value set, or real patient data is ever committed. Documentation and examples use **synthetic** data exclusively (see `parser-spike.md`, which illustrates every hard case with fictional values).

### Rule 2 — Ignore real data at the source
Real reports live outside version control. The `.gitignore` excludes report files and any local data directory, so a real PDF cannot be committed by accident:

```
# Never commit real lab reports or patient data
*.pdf
/private/
/fixtures/real/
/uploads/
```

*(Adjust paths to the project layout. The convention: `fixtures/real/` is git-ignored — real data never enters version control; synthetic fixtures used by tests live in a versioned, clearly-named directory such as `fixtures/synthetic/`.)*

### Rule 3 — Git author identity
Commit metadata is public in an open repository. Use the GitHub-provided no-reply email for commits so a personal email is not exposed in `git log`. Configure this locally so future commits are safe by default; decide separately whether to rewrite existing history (history rewriting changes commit hashes and affects any existing clones/forks).

### Rule 4 — Scan before going public
Before making the repository public, scan the **full git history** (all branches, all diffs — not just the current tree) for PII patterns: national IDs, dates of birth, emails, phone numbers, names, signature hashes. Removing a file today does not remove it from history; committed PII stays recoverable until history is cleaned.

---

## Checklist before handling real data or going public

- [ ] `.gitignore` excludes real reports and data directories
- [ ] Only synthetic data present in the repo (tree + history)
- [ ] Full git-history PII scan passed
- [ ] Git author email set to no-reply
- [ ] Pipeline: region isolation active (body only to extractor)
- [ ] Pipeline: pattern redaction runs before any LLM call
- [ ] Storage: original files encrypted at rest
- [ ] Logs verified free of raw report text / identifiers
- [ ] Consent recorded at signup; purge path implemented for erasure requests

---

## Definition of done

A reviewer can trace, from this document, exactly where every class of personal data goes — and confirm that none of it reaches the LLM, the logs, or the repository. Privacy is a designed property of the system, not an afterthought.
