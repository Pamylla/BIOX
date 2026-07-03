# User

**Document:** `docs/02-domain/user.md`
**Type:** permanent entity
**Related:** `overview.md`, `patient.md`

---

## Purpose

Represent the **authenticatable identity** — who logs in. `User` exists to separate *who accesses the system* from *whose clinical data it is* (`Patient`). In the MVP this separation is 1:1, but it is what sustains, without a rewrite, future scenarios such as a caregiver managing several patients.

## Responsibilities

- Authentication (Google / email, via Firebase Auth).
- Recording the LGPD consent for processing sensitive data.
- Account preferences.

Not the `User`'s responsibility: holding clinical data (that's `Patient`). A `User` authenticates; a `Patient` has a health history.

## Relationships

- Has one `Patient` (1:1 in the MVP).
- Delegates authentication to Firebase Auth; the system stores only the identifier (`uid`) as a key.

## Business rules

- **Explicit LGPD consent** for processing sensitive data (art. 11) is mandatory at signup, with a recorded date.
- **Credentials never travel through nor are stored by the system** — that is the authentication provider's responsibility. The system never sees or stores a password.
- **Account deletion triggers the purge** (see PRD §5.1): permanent, irreversible removal of the linked personal data, including already soft-deleted records and the files in Storage. Not to be confused with operational soft-delete.

## Future evolution

- The relationship with `Patient` goes from 1:1 to 1:N, enabling the caregiver profile (one account managing several patients). Since the `User`/`Patient` separation already exists, this is a change of cardinality, not of architecture.
- Supports roles and permissions (e.g. read access for an invited professional) when it makes sense, without changing the nature of the entity.

## Boundary note

The `User` handles *access and identity*; the `Patient` handles *health*. The boundary is deliberate: keeping them separate from the MVP (even at 1:1) is what makes the future multi-patient case a simple evolution, not a refactor. See `patient.md`.
