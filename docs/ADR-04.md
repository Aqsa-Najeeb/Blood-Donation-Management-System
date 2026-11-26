# ADR-04 — Data Ownership and Storage

**Status:** Accepted  
**Project:** LIFE LINK  
**Decision date:** Not recorded in the supplied architecture source  
**Source:** `architecture.md`, section 14, and the corresponding architectural discussion where available

## 1. Context

The system has related records across profiles, requests, responses, notifications, reports and conversations. The group approved shared database storage while retaining logical ownership.

## 2. Architectural drivers

Data consistency, record preservation, maintainability, clear ownership, controlled access and avoiding unnecessary storage complexity.

## 3. Options considered

The architecture records the chosen approach but does not preserve a complete list of alternatives actually discussed. Do not invent a group comparison.

## 4. Decision

Use one shared database. Each logical module manages only the records assigned to its ownership boundary. The exact mapping remains subject to ADR-02.

## 5. Rationale

Shared database with individual module ownership of records

## 6. Consequences

### Positive
Facilitates coordinated data use and avoids separate database infrastructure per module.

### Negative / trade-offs
Requires strict ownership and access rules; shared storage must not become unrestricted access.

## 7. Related requirements and decisions

ASR-01, ASR-04, ASR-05, ASR-06, ASR-07; PRD FR-03 to FR-15 and related business rules, subject to final ownership mapping.

**Related ADRs:** See `architecture.md`, sections 4, 7, 13 and 14. ADR-02, ADR-09 and ADR-10 remain pending and must not be represented as accepted.


## Current-session clarification (23 November 2026)

The shared database decision remains accepted. The eight logical modules are Authentication, Donor Management, Donor Search, Location Matching, Emergency Requests, Request Lifecycle, Notifications and Chat. Administration is removed. Each module manages its own records; exact entity/table ownership must be documented before implementation. Reporting/restriction records are private and must not expose reporter identity.