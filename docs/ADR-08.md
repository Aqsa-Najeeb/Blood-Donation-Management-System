# ADR-08 — Notification Management

**Status:** Accepted  
**Project:** LIFE LINK  
**Decision date:** Not recorded in the supplied architecture source  
**Source:** `architecture.md`, section 14, and the corresponding architectural discussion where available

## 1. Context

Emergency matching requires notifications to eligible donors and cancellation notifications to previously notified donors. Notification responsibilities should be coordinated consistently.

## 2. Architectural drivers

Correct targeting, cancellation handling, reliability, maintainability and privacy.

## 3. Options considered

The architecture records the selected approach but does not preserve a complete list of alternatives actually discussed. Do not invent a group comparison.

## 4. Decision

Use centralized notification management within the modular monolith. It receives request/recipient context and lifecycle effects through defined interfaces. No external notification provider is approved by this decision.

## 5. Rationale

Centralized notification management

## 6. Consequences

### Positive
Provides one logical place for notification rules and coordination.

### Negative / trade-offs
Requires accurate recipient records and defined delivery semantics; retry guarantees and external integrations remain unspecified.

## 7. Related requirements and decisions

ASR-05, ASR-07; PRD FR-09, FR-12; BR-05, BR-09, BR-10.

**Related ADRs:** See `architecture.md`, sections 4, 7, 13 and 14. ADR-02 is accepted for the eight-module logical decomposition (detailed interfaces/ownership remain to be documented); ADR-09 is accepted for the logical Chat responsibility with conversation grouping open; ADR-10 excludes external integrations in the current scope.
