# ADR-07 — Emergency Request Lifecycle and Expiry

**Status:** Accepted  
**Project:** LIFE LINK  
**Decision date:** Not recorded in the supplied architecture source  
**Source:** `architecture.md`, section 14, and the corresponding architectural discussion where available

## 1. Context

Request state controls response eligibility, cancellation, expiry, notifications and whether existing conversations remain writable. These effects must follow consistent state transitions.

## 2. Architectural drivers

Reliability, lifecycle consistency, preservation of records, authorization and correct time-bound behaviour.

## 3. Options considered

The architecture records the selected approach but does not preserve a complete list of alternatives actually discussed. Do not invent a group comparison.

## 4. Decision

Use a dedicated logical responsibility for emergency-request lifecycle and state transitions. The exact expiry execution mechanism is not selected by this ADR/architecture.

## 5. Rationale

Dedicated emergency-request lifecycle component

## 6. Consequences

### Positive
Centralizes lifecycle rules and reduces inconsistent status handling.

### Negative / trade-offs
Requires defined interfaces with request, notification and chat responsibilities. The trigger mechanism still needs implementation design without assuming technology.

## 7. Related requirements and decisions

ASR-04, ASR-05, ASR-06, ASR-07; PRD FR-08, FR-10, FR-11, FR-12, FR-18; BR-10 to BR-14, BR-23, BR-24.

**Related ADRs:** See `architecture.md`, sections 4, 7, 13 and 14. ADR-02 is accepted for the eight-module logical decomposition (detailed interfaces/ownership remain to be documented); ADR-09 is accepted for the logical Chat responsibility with conversation grouping open; ADR-10 excludes external integrations in the current scope.
