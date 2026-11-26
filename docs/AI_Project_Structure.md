# AI-Generated LIFE LINK Project Structure

**Status:** AI proposal refined through human evaluation; not evidence of implemented source code.

## 1. Initial AI proposal summary

The AI proposed feature-oriented source areas for authentication, donor management, donor search, emergency requests, notifications, chat and administration; corresponding test folders; a `shared/` folder; documentation under `docs/`; five suggested ADR filenames; and root README, ignore and contribution-log files.

The five suggested ADR filenames were placeholders and are not the authoritative ADR set.

## 2. Refined project tree

```text
LIFE_LINK_Deliverable_3/
├── PRD.md
├── ASRs.md
├── architecture.md
├── AGENTS.md
├── README.md
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

This is the requested Deliverable 3 documentation/evidence package tree. It is not a proposed application source-code tree.

## 3. Proposed application source-code organization

The earlier AI proposal suggested these logical areas:

```text
src/
├── authentication/
├── donor-management/
├── donor-search/
├── emergency-requests/
├── notifications/
├── chat/
└── administration/

tests/
├── authentication/
├── donor-management/
├── donor-search/
├── emergency-requests/
├── notifications/
├── chat/
├── administration/
└── integration/
```

These names are candidate organizational areas only. **ADR-02 (final module boundaries) and ADR-09 (chat boundary) are pending**, so this proposal must not be represented as an approved final module decomposition. The architecture's approved responsibilities and interfaces take precedence.

## 4. Human evaluation findings

- Retain the seven useful responsibility areas as candidate logical areas.
- Retain the feature-oriented test organization as a proposal.
- Move project-wide agent instructions and primary reference documents to the project root.
- Do not use the AI's five suggested ADR filenames as approved decision records.
- Do not retain a generic `shared/` source folder without a defined, approved responsibility.
- Preserve the group's existing official contribution log rather than creating a duplicate.
- Do not introduce technologies, frameworks, database products, external providers or deployment decisions that have not been approved.

## 5. Architecture alignment constraints

- ADR-01 approves Modular Monolithic Architecture.
- ADR-03 approves defined module interfaces and appropriate direct/asynchronous communication.
- ADR-04 approves shared database storage with logical module ownership.
- ADR-05 approves shared authorization rules with module-level enforcement.
- ADR-06 approves separate donor-search and location-matching responsibilities with defined interfaces.
- ADR-07 approves a dedicated emergency-request lifecycle responsibility.
- ADR-08 approves centralized notification management.
- ADR-02, ADR-09 and ADR-10 remain pending.

The proposed application source tree must be revisited when those pending decisions are resolved.


---

## Current-session follow-up note (23 November 2026)

This original Deliverable 3 evaluation record is preserved as supplied. The current-session decisions are recorded separately in `SESSION_DECISIONS.md` and the updated PRD/architecture/ADRs. Do not interpret this note as evidence that additional AI outputs were generated, reviewed or accepted. Any new evaluation/refinement must be recorded with its actual prompt/output and human decision.