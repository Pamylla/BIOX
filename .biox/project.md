# BIOX - Project Instructions

## Project Overview

BIOX is a modern health intelligence platform focused on helping people understand the evolution of their laboratory exams over time.

The application is **not** intended to diagnose diseases or replace medical professionals. Its purpose is to organize laboratory data, calculate deterministic health indicators, and provide AI-powered explanations based on scientific evidence.

The project should always prioritize:

* Simplicity
* Maintainability
* Scalability
* Excellent UX
* Evidence-based interpretations
* Modular architecture

---

# Product Vision

BIOX transforms laboratory results into clear and understandable health insights.

Instead of showing isolated values, the platform focuses on:

* Health evolution
* Trends
* Biomarker relationships
* Personalized explanations
* Historical comparison

The long-term vision is to become a personal health timeline.

---

# Development Philosophy

Whenever implementing a feature, prefer:

* Clean Architecture
* SOLID principles
* Composition over inheritance
* Feature-based organization
* Strong typing
* Reusable components
* Testability

Avoid unnecessary abstractions until they solve a real problem.

---

# AI Responsibilities

AI should NEVER calculate medical scores.

AI should:

* explain results
* summarize trends
* identify possible correlations
* generate natural language reports
* answer questions based on retrieved scientific evidence

Deterministic calculations must always be implemented in code.

---

# Project Principles

Always prioritize:

1. Readability
2. Maintainability
3. Type safety
4. Reusability
5. Accessibility
6. Performance
7. Developer Experience

---

# User Experience

BIOX should feel similar to modern SaaS products such as Linear, Notion and Stripe.

Characteristics:

* clean
* calm
* minimal
* spacious
* intuitive

Avoid cluttered dashboards.

---

# Architecture

The project is divided into independent modules.

Frontend:

* Authentication
* Dashboard
* Patient Profile
* Exams
* Timeline
* Scores
* Reports
* Settings

Backend:

* Auth Module
* Patient Module
* Exam Module
* Parser Module
* Biomarker Module
* Knowledge Base
* Score Engine
* AI Module
* Recommendation Module

Every module should have a single responsibility.

---

# Medical Philosophy

BIOX is an evidence-based platform.

Every generated interpretation should be traceable to scientific references whenever possible.

Never fabricate medical information.

Always separate:

* factual data
* calculated indicators
* AI interpretations
* recommendations

---

# Code Generation Rules

When generating code:

* Prefer TypeScript.
* Use meaningful names.
* Avoid magic numbers.
* Keep functions small.
* Prefer pure functions.
* Write self-documenting code.
* Add comments only when they explain intent.

Always suggest improvements if the architecture can be enhanced.

---

# Documentation

Every significant feature should include:

* purpose
* architecture
* responsibilities
* future improvements

Documentation is considered part of the implementation.

---

# Goal

BIOX should become a production-quality portfolio project demonstrating:

* Software Architecture
* Frontend Engineering
* Backend Engineering
* AI Integration
* Clinical Data Modeling
* UX Design
* Modern Engineering Practices
