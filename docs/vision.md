# Vision — BIOX

**Document:** `docs/vision.md`
**Related:** [`product-requirements.md`](product-requirements.md) (what), [`roadmap.md`](roadmap.md) (when)

---

## In one sentence

BIOX turns lab results scattered across PDFs into a **navigable story of your health over time**.

---

## The problem

Everyone who gets blood work done accumulates PDFs. One from lab A in January, another from lab B in April, a third in August. Each is a static snapshot of a single day — and each lives isolated in a downloads folder or an email inbox.

What no one gets to see is the thing that actually matters: **the movement**. Has ferritin been climbing across the last three tests, or was one day just lucky? Did the effort to bring CRP down actually work? Is something slowly getting worse, test after test, that no single result reveals on its own?

The information exists. It just isn't navigable in time. And time is where health happens.

---

## The vision

Imagine that each new lab report isn't a file you file away, but a **new version of your health state** — like a commit in a repository.

```
v1 — January    Ferritin 18 · CRP 6.5 · Inflammation 71
       │
v2 — April       Ferritin 28 · CRP 2.1 · Inflammation 45
       │
v3 — August      Ferritin 36 · CRP 0.8 · Inflammation 22
```

Suddenly the questions that matter become answerable:

- What changed since last time?
- What improved, what got worse?
- Which trend deserves attention?
- What was the impact of that weight change, that new medication?

This is the BIOX thesis: **the value isn't in interpreting a single test — it's in seeing the trajectory.** Standalone test analyzers already exist by the dozen. A system that treats your health as a versioned history, shows the path over time, and explains it in human language — that's rare.

---

## What BIOX is

A **health intelligence dashboard**. You upload your lab reports, it extracts the biomarkers, computes scores by domain, plots the evolution over time, and uses AI to explain what the numbers are saying — always in language a person understands, not lab jargon.

## What BIOX is not

It is not a doctor. **It does not diagnose, prescribe, treat, or tell you that you have disease X.** It interprets and contextualizes your own data; the clinical conclusion always belongs to a professional. This boundary is not a temporary limitation — it is a design principle. BIOX exists to help you arrive at the appointment better informed, not to replace it.

---

## Why now, why this way

Three design bets hold the product together:

1. **Longitudinal, not pointwise.** The architecture is biomarker-oriented and versioned by date from day one. The PDF is disposable raw material; what gets stored is knowledge structured across time.

2. **Honest by principle.** Where a test has a known limitation, BIOX says so — it does not dress up an absence of signal as "all clear." The user's trust is worth more than the appearance of certainty.

3. **Universal, extensible in layers.** The core works for anyone who uploads a test. Specific clinical conditions are interpretation layers that add on later, without rewriting the base.

---

## How we'll know it worked

The moment that proves everything isn't the first test on the dashboard. It's the **second**: when the person uploads a report from another date and watches the timeline move — the ferritin that was 18 and is now 28, the inflammation score that dropped, the trend taking shape before their eyes.

In that instant BIOX stops being a PDF reader and becomes what it set out to be: **the living memory of someone's health.**
