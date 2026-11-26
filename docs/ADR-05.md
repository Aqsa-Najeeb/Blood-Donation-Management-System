# ADR-05 — Authentication and Authorization

**Status:** Accepted  
**Project:** LIFE LINK  
**Decision date:** Not recorded in the supplied architecture source  
**Source:** `architecture.md`, section 14, and the corresponding architectural discussion where available

## 1. Context

Personal information and protected actions require consistent access checks. The architecture clarifies that shared rules are policy, not a separately deployed authorization service.

## 2. Architectural drivers

Security, privacy, least privilege, consistent enforcement and maintainability.

## 3. Options considered

The architecture records the selected approach but does not preserve a complete list of alternatives actually discussed. Do not claim unrecorded alternatives.

## 4. Decision

Use shared authorization rules. Each protected module enforces permissions for its own operations based on identity, role, ownership and participation as relevant.

## 5. Rationale

Shared authorization rules with module-level enforcement

## 6. Consequences

### Positive
Promotes consistent policy while keeping enforcement close to the operation and its data.

### Negative / trade-offs
Requires each protected module to apply the rules correctly and consistently.

## 7. Related requirements and decisions

ASR-01, ASR-06; PRD FR-01, FR-02, FR-07, FR-11, FR-12, FR-13, FR-15; BR-07, BR-08, BR-10, BR-20, BR-21.

**Related ADRs:** See `architecture.md`, sections 4, 7, 13 and 14. ADR-02, ADR-09 and ADR-10 remain pending and must not be represented as accepted.


## Current-session clarification (23 November 2026)

Authorization remains cross-cutting and is enforced by each module. There is no administrator role. Enforce ownership/participation rules for profiles, emergency requests, requester contact disclosure, chat history and private reporting/restriction records. The temporary reporting safeguard blocks only creation of new emergency requests for seven days when the selected threshold is reached; other account functions remain available.