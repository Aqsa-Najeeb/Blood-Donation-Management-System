# ADR-01 — Overall Architecture Style

**Status:** Accepted  
**Project:** LIFE LINK  
**Decision date:** Not recorded in the supplied architecture source  
**Source:** `architecture.md`, section 14, and the corresponding architectural discussion where available

## 1. Context

The project needs a maintainable structure for related donor-search, request, notification, chat and administration responsibilities. The architecture records Modular Monolithic Architecture as the group-approved style.

## 2. Architectural drivers

Maintainability, understandable separation of responsibilities, coherent application behaviour, and avoidance of unnecessary distributed-system complexity.

## 3. Options considered

The architecture records the selected option but does not preserve a complete list of alternatives actually discussed. Do not retrospectively claim unrecorded alternatives as group discussions.

## 4. Decision

Use a Modular Monolithic Architecture: one application organized into logical modules, not independently deployed microservices.

## 5. Rationale

Modular Monolithic Architecture

## 6. Consequences

### Positive
Keeps deployment and coordination conceptually simple while allowing logical separation.

### Negative / trade-offs
Requires disciplined module boundaries and interfaces as the system grows.

## 7. Related requirements and decisions

ASR-08; PRD scope and NFRs. Exact PRD requirement IDs are not enumerated in the architecture's ADR table.

**Related ADRs:** See `architecture.md`, sections 4, 7, 13 and 14. ADR-02 is accepted for the eight-module logical decomposition (detailed interfaces/ownership remain to be documented); ADR-09 is accepted for the logical Chat responsibility with conversation grouping open; ADR-10 excludes external integrations in the current scope.
