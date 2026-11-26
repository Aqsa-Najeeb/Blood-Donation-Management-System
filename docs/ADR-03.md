# ADR-03 — Component Communication

**Status:** Accepted  
**Project:** LIFE LINK  
**Decision date:** Not recorded in the supplied architecture source  
**Source:** `architecture.md`, section 14, and the corresponding architectural discussion where available

## 1. Context

The modular monolith needs controlled communication between logical responsibilities without exposing internal implementation details.

## 2. Architectural drivers

Maintainability, low coupling, clear interfaces, reliable coordination, and avoiding unnecessary infrastructure.

## 3. Options considered

The architecture records the chosen approach but does not preserve a complete list of alternatives actually discussed. Do not invent a group comparison.

## 4. Decision

Modules communicate through defined module interfaces. Direct function/method calls are suitable within a module. Asynchronous communication may be used where it provides a clear benefit. External APIs are used only for approved and required integrations.

## 5. Rationale

Defined module interfaces; direct calls within a module; asynchronous communication where beneficial

## 6. Consequences

### Positive
Supports clear dependencies and allows internal implementation to change behind interfaces.

### Negative / trade-offs
Requires interface discipline; asynchronous flows can add complexity and should not be used without need.

## 7. Related requirements and decisions

ASR-08, ASR-04, ASR-05, ASR-06; PRD FR-08 to FR-13 and other cross-responsibility requirements as applicable.

**Related ADRs:** See `architecture.md`, sections 4, 7, 13 and 14. ADR-02 is accepted for the eight-module logical decomposition (detailed interfaces/ownership remain to be documented); ADR-09 is accepted for the logical Chat responsibility with conversation grouping open; ADR-10 excludes external integrations in the current scope.
