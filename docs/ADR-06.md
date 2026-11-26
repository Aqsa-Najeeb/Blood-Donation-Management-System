# ADR-06 — Donor Search and Location Matching

**Status:** Accepted  
**Project:** LIFE LINK  
**Decision date:** Not recorded in the supplied architecture source  
**Source:** `architecture.md`, section 14, and the corresponding architectural discussion where available

## 1. Context

Normal donor search and emergency matching both rely on blood group, availability, manually selected approximate location and radius rules. Consistency is important for privacy and correctness.

## 2. Architectural drivers

Search performance, location privacy, consistent matching, maintainability and reuse of matching rules.

## 3. Options considered

The architecture records the selected approach but does not preserve a complete list of alternatives actually discussed. Do not invent a group comparison.

## 4. Decision

Keep donor-search and location-matching as separate logical responsibilities communicating through defined interfaces. Apply consistent approximate-location and inclusive-radius rules.

## 5. Rationale

Separate donor-search and location-matching responsibilities with defined interfaces

## 6. Consequences

### Positive
Separates user-facing search from reusable location matching and reduces inconsistent calculations.

### Negative / trade-offs
Requires clear interface and data ownership decisions; detailed module boundaries remain subject to ADR-02.

## 7. Related requirements and decisions

ASR-02, ASR-03; PRD FR-05, FR-06, FR-09; BR-02, BR-06, BR-09, BR-18.

**Related ADRs:** See `architecture.md`, sections 4, 7, 13 and 14. ADR-02 is accepted for the eight-module logical decomposition (detailed interfaces/ownership remain to be documented); ADR-09 is accepted for the logical Chat responsibility with conversation grouping open; ADR-10 excludes external integrations in the current scope.
