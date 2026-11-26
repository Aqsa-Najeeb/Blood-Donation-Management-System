# LIFE LINK — D4 Implementation Plan (Version History Copy)

**Plan version:** v01 — initial baseline snapshot  
**Date:** 23 November 2026  
**Status:** Proposed plan; all slices are Planned.

## Objective
Implement and validate the LIFE LINK requirements in manageable vertical slices, using the current PRD and approved architecture baseline. Preserve evidence of AI-assisted work and human decisions.

## Assumptions and constraints
- Modular monolith, shared database, REST API.
- Eight logical modules; authorization cross-cutting; UI presentation layer.
- Local demonstration deployment; English only.
- No SMS/email providers, OTP, CNIC verification or admin dashboard.
- The current archive contains documentation/evidence images but no application source code.
- Technology stack is not selected in the supplied project documents; group approval is required before selection.

## Open issues blocking affected slices
See `OPEN_ISSUES_AND_CONSISTENCY.md`. In particular, settle report independence/anti-abuse, request status mapping, donor response transitions, chat grouping and account deletion retention before implementing those behaviours.

## Proposed vertical slices

| Order | Slice | Scope | Dependencies | Acceptance reference | Status |
|---:|---|---|---|---|---|
| 1 | S1 — Project foundation | Approve stack, create modular-monolith skeleton, local run instructions | Group stack approval | ADR-01/02/03; README | Planned |
| 2 | S2 — Authentication and profile | Email/password, secure password hashing, one account for donor/requester, editable profile and declared blood group | S1 | PRD FR-01–03; session decisions | Planned |
| 3 | S3 — Donor availability and search | Manual availability, default Unavailable, blood-group/location search, show both availability states | S2 | PRD FR-04–07; amended search rules | Planned |
| 4 | S4 — Emergency request creation and visibility | Request form, max three active requests, matching blood-group visibility, approximate location | S2, S3 | PRD FR-08; session amendments | Planned |
| 5 | S5 — Donor responses and request lifecycle | Multiple responses/acceptances, requester-only cancellation, status/expiry mapping | S4; closure and response states must be approved | PRD FR-10–12, FR-18 | Planned |
| 6 | S6 — Notifications | In-app alerts for relevant requests, own-request responses and status changes; no chat alerts/history page | S4, S5 | PRD FR-09; session amendments | Planned |
| 7 | S7 — Chat | Invitations, accept/reject/restrict, participant-only text history, chat reporting | S2; conversation grouping decision | PRD FR-13; ADR-09 | Planned |
| 8 | S8 — Reporting safeguard | Reports from profile/chat, private reporter identity, three-report threshold and seven-day request-creation restriction | S2, S4, S7; anti-abuse rules must be approved | PRD Section 16; ADR-05 | Planned |
| 9 | S9 — Integration and end-to-end validation | Integrate slices, test core flows/edge cases/NFRs, fix defects | S1–S8 | PRD acceptance criteria; D4 checklist | Planned |
| 10 | S10 — Local demo and submission | Local deployment, execution instructions, final report, contribution log, evidence package | S9 | D4 checklist | Planned |

## Definition of done for each slice
- Requirements and acceptance criteria linked.
- Tests/checks run and results recorded.
- Human reviewer records Accept/Revise/Reject.
- Plan status updated with evidence.
- Module integration status documented.
- No unsupported claims of completion.

## Required evidence log fields
Slice ID; requirements; responsible member; acceptance criteria; HITL/AFK mode; AI chat/task reference; iterations; test results; human decision; major issues/changes; plan version; integration status.

## Status summary
No slice is marked implemented, tested, integrated, deployed or accepted in this plan because the supplied archive contains no source code or execution evidence.
