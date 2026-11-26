# ADR-02 — Module Boundaries and Responsibilities

**Status:** Accepted with interface and detailed ownership mapping to be completed  
**Project:** LIFE LINK  
**Decision date:** 23 November 2026  
**Decision source:** Current-session D4 grilling decisions, Q1–Q2 and subsequent clarification removing Administration

## 1. Context

The architecture previously left module boundaries pending. During the current-session review, the group direction was to approve a practical logical module set, keep authorization cross-cutting and treat the UI as a presentation layer. The Administration feature was subsequently removed.

## 2. Architectural drivers

Maintainability, simple implementation, separation of concerns, clear record ownership, controlled dependencies and consistency with the modular-monolith decision.

## 3. Decision

Approve the following eight logical modules within the modular monolith:

1. Authentication
2. Donor Management
3. Donor Search
4. Location Matching
5. Emergency Requests
6. Request Lifecycle
7. Notifications
8. Chat

Authorization is a cross-cutting concern and is not a separate business module. UI is a presentation layer. There is no Administration module.

Each module owns and manages its own records in the single shared database. Exact table/entity ownership, REST contracts and inter-module interfaces must be documented as supporting design artefacts before implementation; this ADR does not invent those detailed contracts.

## 4. Rationale

This is a small, understandable module set for a student project and avoids unnecessary service decomposition. It reflects the user's explicit decision to remove administrative functionality while retaining reporting through the automated policy defined in the PRD.

## 5. Consequences

### Positive
- Clear, manageable logical responsibilities.
- One application and one shared database.
- Authorization rules remain consistent across modules.
- No administrator dashboard or human-review workflow to implement.

### Trade-offs
- Modules must respect data ownership despite sharing one database.
- Interfaces and entity ownership still need a concrete contract.
- Reporting safeguards require careful specification because no human review is included.

## 6. Related requirements and decisions

PRD Sections 3–8, 16; ADR-01, ADR-03, ADR-04, ADR-05, ADR-09 and ADR-10; ASR-01 through ASR-08 as applicable.
