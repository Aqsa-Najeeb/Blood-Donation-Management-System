# Human Evaluation of the AI-Generated LIFE LINK Project Structure

## 1. Purpose and evaluation basis

This document records the human evaluation of the AI-generated project-structure proposal. It distinguishes the AI's suggestions from evaluation findings and approved architectural decisions.

The evaluation basis is:
- validated `PRD.md` (v2.2);
- `ASRs.md`;
- `architecture.md`;
- the ADR status table in `architecture.md`;
- the AI-generated structure proposal; and
- Deliverable 3 instructions.

The evaluation does not claim that application code or the proposed source directories have been implemented.

## 2. Summary of the AI proposal

The AI proposed feature-oriented areas for authentication, donor management, donor search, emergency requests, notifications, chat and administration. It also suggested a `shared/` directory, corresponding test folders, integration tests, documentation under `docs/`, five suggested ADR filenames, a README, `.gitignore` and a contribution-log file.

The five AI-suggested ADR filenames were not accepted as authoritative. The architecture identifies ten ADR records, of which ADR-01 and ADR-03 through ADR-08 are Accepted, while ADR-02, ADR-09 and ADR-10 are Pending.

## 3. What the evaluation accepted

The evaluation accepted the following as useful proposals, not as proof of final module approval:
- feature-oriented responsibility areas corresponding to major LIFE LINK capabilities;
- a test organization grouped around those responsibilities;
- an integration-testing area as a sensible proposed test category;
- a technology-neutral structure that does not select an unapproved language, framework, database product or deployment platform;
- a single application organization consistent with the accepted modular-monolith decision.

The seven candidate responsibility areas are authentication, donor management, donor search, emergency requests, notifications, chat and administration. Their final boundaries remain subject to ADR-02 and ADR-09.

## 4. What was not accepted unchanged

### 4.1 Documentation placement
The initial AI proposal placed `AGENTS.md`, `PRD.md` and `architecture.md` under `docs/`. The evaluation recommended placing these project-wide reference documents at the root for direct access.

### 4.2 Placeholder ADR filenames
The initial proposal supplied five ADR filenames. These were not verified group-approved titles and must not replace the actual ADR set. The architecture lists ADR-01 through ADR-10 with explicit statuses.

### 4.3 Undefined `shared/` directory
The initial proposal included `src/shared/` without a clearly established responsibility or ownership rule. The evaluation recommended omitting it unless the group explicitly defines and approves its purpose.

### 4.4 Contribution log
The proposed `Group-Contribution-Log.md` must not create a duplicate record. The group's existing official contribution log should be retained in the location required by the course/group.

## 5. Required clarifications

The evaluation identified the following matters that a folder tree cannot resolve:
- final module boundaries and record ownership (ADR-02 pending);
- detailed chat component boundary and interface (ADR-09 pending);
- external services/providers (ADR-10 pending);
- interface contracts and permitted dependencies;
- consistent lifecycle interaction between emergency requests, notifications and chat;
- ownership and access to notification-recipient information;
- the implementation mechanism for automatic expiration.

The evaluation did not select technologies or invent implementation mechanisms for these matters.

## 6. Validation against project references

### 6.1 PRD
The proposed responsibility areas broadly cover registration/sign-in, donor profiles and availability, donor search, emergency requests, notifications, donor responses, chat, reporting and administration. The evaluation noted that detailed behaviours—such as cancellation notifications, preserved responses, read-only conversations after closure, location privacy and inclusive radius matching—must be reflected in component interfaces and tests.

FR-16 (CNIC verification) and FR-17 (registration SMS OTP) are proposed additions pending TA/client approval in PRD v2.2. They are not confirmed implementation scope. In particular, OTP must remain pending until the PRD and TA/client approval are aligned. No OTP provider or integration is approved.

### 6.2 ASRs
The candidate areas cover the broad responsibilities described by ASR-01 through ASR-08. However, directory names alone do not demonstrate authentication/authorization enforcement, search performance, approximate-location privacy, lifecycle consistency, notification targeting, conversation isolation, record preservation or maintainability. Those concerns require architecture and test evidence.

### 6.3 Architecture and ADRs
The architecture records these accepted decisions:
- ADR-01: Modular Monolithic Architecture;
- ADR-03: defined module interfaces and appropriate direct/asynchronous communication;
- ADR-04: shared database with individual module ownership;
- ADR-05: shared authorization rules with module-level enforcement;
- ADR-06: separate donor-search and location-matching responsibilities with defined interfaces;
- ADR-07: dedicated emergency-request lifecycle responsibility;
- ADR-08: centralized notification management.

The following remain pending:
- ADR-02: final module boundaries, responsibilities, interfaces and record ownership mapping;
- ADR-09: chat/conversation-history boundary and interface contract;
- ADR-10: external systems and integrations.

The evaluation therefore does not claim that the candidate source folders are all approved independent modules.

### 6.4 AGENTS.md
The AI instructions should identify the PRD as the source of confirmed product behaviour, follow accepted ADRs, preserve pending ADR status, avoid unapproved technologies and ask for human direction when information is missing. The supplied `AGENTS.md` reflects these constraints.

## 7. Refined proposal

The refined Deliverable 3 package structure is:

```text
LIFE_LINK_Deliverable_3/
├── PRD.md
├── ASRs.md
├── architecture.md
├── AGENTS.md
├── ADR/
│   ├── ADR-01.md
│   ├── ADR-02.md
│   ├── ADR-03.md
│   ├── ADR-04.md
│   ├── ADR-05.md
│   ├── ADR-06.md
│   ├── ADR-07.md
│   ├── ADR-08.md
│   ├── ADR-09.md
│   └── ADR-10.md
├── AI_Evaluation/
│   ├── AI_Project_Structure.md
│   ├── Human_Evaluation.md
│   └── Refinement_Record.md
└── Evidence/
    ├── Architecture_Discussion/
    └── AI_Interaction/
```

The package tree is a documentation/submission organization, not an approved application module tree. The candidate application source areas are separately recorded in `AI_Project_Structure.md`.

## 8. Lessons learned

1. AI output is a proposal and requires human review.
2. Feature folder names do not establish approved architectural boundaries.
3. Clear PRD, ASR, architecture and ADR context improves the usefulness of AI-generated structures.
4. Suggested ADR titles or implementation details must not be mistaken for group decisions.
5. Cross-component behaviours need explicit interfaces and ownership rules.
6. Pending requirements and pending architectural decisions must remain visibly pending.
7. The group retains responsibility for approval and architectural accountability.

## 9. Evaluation conclusion

The AI proposal is a useful starting point and was refined through the documented evaluation recommendations. It is not evidence that the source structure has been implemented or that all candidate folders are approved modules.

The refined proposal is suitable for group review, subject to resolution of ADR-02, ADR-09 and ADR-10 and any resulting updates to the architecture and project structure.


---

## Current-session follow-up note (23 November 2026)

This original Deliverable 3 evaluation record is preserved as supplied. The current-session decisions are recorded separately in `SESSION_DECISIONS.md` and the updated PRD/architecture/ADRs. Do not interpret this note as evidence that additional AI outputs were generated, reviewed or accepted. Any new evaluation/refinement must be recorded with its actual prompt/output and human decision.