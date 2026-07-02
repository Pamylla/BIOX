# ADR-001 — PostgreSQL over Firestore as the system of record

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related:** [product-requirements.md](../../01-product/product-requirements.md), [domain/overview.md](../../02-domain/overview.md)

## Context

BIOX is biomarker-oriented and longitudinal. The core queries are relational: measurements across dates, grouped by health domain, joined to the biomarker catalog, with versioned scores and reproducible history. Firebase is already part of the stack for Authentication and file Storage, which makes Firestore (a document database) the "free" default for persistence.

However, the clinical data is highly relational and demands transactional integrity (cascading soft-delete), reproducible aggregates (score recomputation), and mature schema migrations.

## Decision

Use **PostgreSQL** (via Prisma) as the single system of record for all clinical data — patients, extractions, batches, measurements, scores, insights. **Firebase is limited to Authentication and file Storage** (the raw uploaded PDFs).

## Consequences

- **+** Relational integrity, powerful time-series and aggregate queries, transactional soft-delete cascades, versioned migrations via Prisma.
- **+** Clear separation of responsibilities: Firebase owns identity and blobs; PostgreSQL owns the truth.
- **−** Two data systems to operate; a Firebase UID ↔ Patient mapping must be maintained.
- **−** Requires hosting and operating a PostgreSQL instance (rather than relying on serverless Firestore).
