# AGENTS.md — LIFE LINK

> **Current-session update (23 November 2026):** Apply Section 11 below where it supersedes earlier role, reporting, module, chat, notification or integration instructions.

## 1. Project overview
LIFE LINK is a web-based donor-search and direct-contact platform. It helps requesters find potential blood donors using blood group and manually selected approximate location. It supports donor profiles and availability, normal search, emergency requests, in-app notifications, donor responses, request-specific chat, reporting and administrative review.

## 2. Purpose and scope
The product connects requesters with potential donors. It is not a blood bank, medical service, or guarantee that a donor will respond, be medically eligible, or complete a donation.

Confirmed capabilities are defined by `PRD.md` (validated PRD v2.2). Treat the PRD as the source of product behaviour. Do not expand scope based on assumptions.

## 3. User roles
- Requester: searches for donors, contacts donors, submits emergency requests and communicates with notified donors.
- Donor: manages a donor profile and availability, receives matching emergency notifications, responds to requests and communicates with requesters.
- One account acts as both requester and donor.
- There is no Administrator role, admin dashboard, or human review workflow. Community safeguards operate via automated, precautionary thresholds (see Section 11 and PRD/ADR baselines).

## 4. Approved architecture
Read `architecture.md` and the ADRs before proposing or changing structure. The approved decisions recorded there are:
- ADR-01: Modular Monolithic Architecture.
- ADR-03: communication through defined module interfaces; direct calls within a module and asynchronous communication only where beneficial.
- ADR-04: shared database with individual logical-module ownership of records.
- ADR-05: shared authorization rules, with each protected module enforcing permissions for its own operations.
- ADR-06: separate donor-search and location-matching responsibilities with defined interfaces.
- ADR-07: dedicated emergency-request lifecycle responsibility.
- ADR-08: centralized notification management.

The following remain pending and must not be treated as approved:
- ADR-02: final module boundaries, responsibilities, interfaces and record-to-module ownership mapping.
- ADR-09: detailed chat/conversation-history boundary and interface contract.
- ADR-10: external systems and integrations.

The architecture document may describe logical responsibilities while these decisions remain pending. Do not convert those descriptions into final module-boundary decisions.

## 5. Functional and business rules
Use `PRD.md` for the complete requirements. Pay particular attention to:
- donor search by blood group and manually selected city/area and radius;
- approximate location only; do not introduce GPS collection or expose exact residential addresses;
- consistent distance and inclusive-radius matching for normal search and emergency matching;
- availability and freshness indicators;
- emergency request status and lifecycle rules;
- only matching available donors within the selected radius are targeted for emergency notifications;
- cancellation notifications must reach previously notified donors;
- preserve existing donor responses and conversation history after cancellation or expiration;
- conversations become read-only after a request is cancelled or expired;
- authorization must be checked for protected actions and conversation access;
- administrator review must not permit administrators to change donor availability on a donor's behalf.

Do not reinterpret or weaken PRD acceptance criteria.

## 6. OTP and CNIC — pending scope
PRD v2.2 describes FR-16 (CNIC verification) and FR-17 (registration SMS OTP) as proposed additions pending TA/client approval. They are not confirmed implementation scope.

In particular:
- Do not implement or plan registration SMS OTP as an approved feature.
- Do not add an SMS provider, API, credentials, notification service or integration for OTP.
- Do not confuse registration OTP with emergency in-app notifications.
- Do not implement CNIC verification unless the PRD is formally updated following TA/client approval.
- If approval is later obtained, update the PRD and relevant architecture/ADR documents first.

## 7. Project organization and coding guidance
- Preserve the approved logical architecture and clear responsibility ownership.
- Keep code within the responsibility/module boundary approved by the group.
- Communicate across module boundaries only through documented interfaces.
- Do not access another module's internal implementation or owned records directly where this violates its ownership boundary.
- Keep shared authorization policy consistent; each protected module enforces the rules for its operations.
- Do not create a generic `shared/` area without an explicitly approved responsibility and ownership rule.
- Keep tests aligned with the responsibilities and integration behaviours they verify.
- Use clear, consistent names. Do not introduce conventions that conflict with the group's approved repository structure.

## 8. Technology and implementation constraints
The application technology stack is formally selected and approved in ADR-11:
- Express (Node.js REST API)
- Prisma ORM with MySQL database
- React frontend via UMD scripts with in-browser Babel compilation (`@babel/standalone`) and Tailwind CSS
- Modular monolithic architecture per ADR-01

Do not add external systems or integrations unless ADR-10 is updated and the group approves the relevant change.

Do not create microservices or independently deployed services; ADR-01 approves a modular monolith.

## 9. Human approval required
Do not change or assume any of the following without group approval:
- architecture style or approved ADR decisions;
- module boundaries and ownership mapping (ADR-02 is pending);
- chat component boundary and interface contract (ADR-09 is pending);
- external providers, services or integrations (ADR-10 is pending);
- technology stack, database product, hosting or deployment choices;
- pending PRD features, including FR-16 and FR-17;
- business rules, access-control rules, data handling or acceptance criteria.

When requirements conflict or information is missing, stop and report the conflict. Cite the relevant document and section, explain the impact, and ask for human direction. Do not resolve architectural ambiguity by guessing.

## 10. Source-of-truth order
1. `PRD.md` governs confirmed product requirements and business behaviour.
2. Accepted ADRs govern approved architectural decisions.
3. `architecture.md` describes the architecture and must remain consistent with accepted ADRs; explicitly pending items remain pending.
4. `ASRs.md` identifies architectural drivers and quality concerns; it does not independently approve an architecture decision.
5. This file provides working instructions and must not override the above documents.


## 11. Current-Session Instructions (23 November 2026)

### 11.1 Updated roles and modules
- There is no Administrator role, dashboard or human report-review workflow.
- One account may act as both donor and requester.
- The logical modules are Authentication, Donor Management, Donor Search, Location Matching, Emergency Requests, Request Lifecycle, Notifications and Chat.
- Authorization is cross-cutting; UI is the presentation layer.
- Use a modular monolith, one shared database and REST API. Each module owns its records.

### 11.2 Authentication and profile
- Email/password only; securely hash passwords.
- Do not implement SMS OTP or CNIC verification in this version.
- Users can edit their profiles and declared blood group.
- Treat blood group as user-declared/unverified.
- New donors default to Unavailable; donors manually control availability.

### 11.3 Emergency requests
- Maximum three active requests per user.
- Multiple donors may respond; requesters may accept multiple donor responses.
- Reveal requester contact details to a donor only after the requester accepts that donor's response.
- Only registered users with a matching declared blood group may view a request; the request owner retains access.
- Approximate location only.
- The selected status set is Open/Closed. The closure outcome mapping (fulfilled/cancelled/expired) needs a documented design decision.
- Enforce the reporting safeguard restriction only against creation of new emergency requests; do not disable unrelated account functions.

### 11.4 Chat
- Chat is general platform functionality, not solely request-specific.
- Text only; no image/document/voice attachments.
- Only registered users can exchange invitations.
- One pending invitation per user pair; invitations do not expire automatically.
- Recipient actions: Accept, Reject, Restrict. After rejection, sender waits 24 hours before another invitation.
- Restrict contact blocks messages/invitations between the pair but does not suspend either account. Existing history remains visible to both; the recipient who applied the restriction can remove it.
- Only participants can view history; individual messages cannot be deleted.
- Do not send chat notifications.
- Do not decide conversation grouping by assumption; one-per-pair versus per-request remains open.

### 11.5 Notifications
- In-app only; no history page.
- Notify only for relevant emergency requests, responses to the user's own requests and request status changes.
- No chat notifications.

### 11.6 Reporting safeguard
- Categories: false donor information, harassment, inappropriate content and suspicious activity.
- Three independent reports is the selected threshold for a seven-day precautionary restriction on creating new emergency requests only.
- Keep reporter identity private. Store reason, start date and expiry date in a private restriction record.
- No administrator review and no formal appeal mechanism.
- A report count is not proof of misconduct. Do not describe the restriction as a verified finding.
- Independent reporter definition, duplicate prevention and anti-coordination safeguards are unresolved; report this gap rather than guessing.

### 11.7 External integrations
Do not add SMS/email providers, SMS OTP or CNIC verification. Notifications are in-app only. Local deployment is the demonstration target.

### 11.8 Stop-and-report unresolved issues
Do not silently decide request closure outcomes, donor response transitions, chat conversation grouping, account-deletion retention or report anti-abuse rules. Record the issue and request human approval before implementation.
