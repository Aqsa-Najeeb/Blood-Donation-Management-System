# LIFE LINK — Architecture Significant Requirements (ASRs) and Architectural Drivers

> **Current-session update (23 November 2026):** The decision baseline in Section 12 supersedes conflicting statements in earlier sections. Original ASRs remain relevant unless explicitly amended below.

**Document:** `ASR.md`  
**Project:** LIFE LINK  
**Source PRD:** LIFE LINK PRD v2.2  
**PRD Date:** 9 November 2026  
**Status:** Draft based on the latest supplied PRD  
**Purpose:** Identify the requirements and constraints that significantly influence the architecture and provide a traceable basis for architectural decisions.

> **Scope note:** This document uses PRD v2.2 as its primary source. FR-16 (CNIC-based identity verification) and FR-17 (registration SMS OTP) are proposed additions pending TA/client approval. They are therefore treated as potential future architectural concerns, not confirmed implementation requirements. No architecture style, technology, framework, database, or deployment platform is selected here.

---

## 1. ASR Identification Approach

A requirement is considered architecturally significant when it can materially influence system structure, component responsibilities, interfaces, security boundaries, data handling, external dependencies, or important quality attributes.

Not every functional requirement is an ASR. Ordinary user-facing features are included only when they create significant architectural concerns.

The ASRs below are derived from the functional requirements, business rules, non-functional requirements, constraints, and acceptance criteria in PRD v2.2.

## 2. Identified Architecture Significant Requirements

| ID | Architecture Significant Requirement | Source Requirements | Why It Is Architecturally Significant | Architectural Concern Created |
|---|---|---|---|---|
| ASR-01 | Authentication, authorization and access control | FR-01, FR-02, FR-07, FR-11, FR-12, FR-13, FR-15; BR-07, BR-08, BR-10, BR-20, BR-21; NFR-03 | The system handles personal information and operations that must be restricted according to user identity, ownership, role and participation. | Protected operations need consistent authentication and authorization enforcement, including donor contact disclosure, request cancellation, conversation access and administrator actions. |
| ASR-02 | Donor search performance and filtering | FR-05, FR-06; NFR-01, NFR-04; AC-07 to AC-13 | Donor search combines blood group, city, area, radius, distance ordering and availability freshness while having a 3-second performance target. | Search responsibilities, filtering, approximate distance calculation, result ordering and performance testing must be considered together. |
| ASR-03 | Approximate location privacy and matching | FR-05, FR-09; BR-02, BR-06, BR-09, BR-18; NFR-03 | Location is central to donor discovery and emergency matching, but the system must use manually selected approximate locations rather than GPS or publicly exposed exact residential addresses. | The system needs a consistent approach to representing and comparing approximate locations while protecting location privacy and applying the inclusive radius rule. |
| ASR-04 | Emergency request lifecycle and automatic expiration | FR-08, FR-10, FR-11, FR-12, FR-18; BR-10 to BR-14, BR-23, BR-24 | Request status controls cancellation, donor responses, expiration, notifications and whether conversations remain writable. | A consistent request lifecycle and reliable time-based state transition are needed. All related functionality must enforce the same request status rules. |
| ASR-05 | Emergency notification targeting and cancellation notifications | FR-09, FR-12; BR-05, BR-09, BR-10; AC-18, AC-19, AC-26 | Notifications must be delivered only to donors who satisfy the matching conditions. Cancellation notifications must reach all donors previously notified about that request. | The system needs request-specific notification recipient tracking and a consistent in-app notification process. |
| ASR-06 | Request-specific chat, participant authorization and history preservation | FR-11, FR-12, FR-13; BR-15, BR-16, BR-22, BR-24; NFR-03, NFR-06 | Conversations are associated with a particular requester, notified donor and emergency request. Existing messages must remain readable after cancellation or expiration, but new messages must be blocked. | Conversation identity, participant access, request association, message preservation and read-only enforcement must be consistent. |
| ASR-07 | Reliability and preservation of important records | FR-03, FR-08, FR-10, FR-11, FR-12, FR-13; NFR-06 | Donor profiles, emergency requests, donor responses and chat messages are essential system records. Losing or inconsistently updating them would undermine the platform. | Data handling and persistence responsibilities must protect important records and maintain consistency across related request, response and conversation information. |
| ASR-08 | Maintainability and web compatibility | NFR-05, NFR-07; PRD §§2.1, 2.3 and 9 | The system must remain understandable and manageable for the student development team and work through commonly used web browsers and desktop/mobile screen sizes. | The architecture should have understandable responsibilities and boundaries without unnecessary complexity, while supporting the intended web environment. |

## 3. Detailed Explanation of the ASRs

### ASR-01 — Authentication, Authorization and Access Control

**Meaning:**

The system must identify signed-in users and ensure that they can perform only the operations permitted to them.

Access depends on the user's identity, role, ownership of a resource and relationship with the relevant emergency request or conversation.

**LIFE LINK requirements:**

- Users must register and sign in before accessing protected functionality.
- Donors must manage their own profiles and availability.
- Only the requester who created an Open emergency request may cancel it.
- Donor contact numbers must only be visible to signed-in requesters after selecting Contact.
- Only authorized participants may access relevant emergency request conversations.
- Administrators may review reports and take appropriate administrative actions.
- Administrators must not change a donor's availability on the donor's behalf.

**Architectural concerns:**

- Where authentication responsibilities should be handled.
- How authorization checks should be consistently applied to protected operations.
- How ownership and participant relationships should be verified.
- How administrator permissions should remain separate from donor-owned operations.
- How sensitive donor information should be protected.

**Potential future consideration:**

FR-17 proposes SMS OTP verification during registration only. If approved, it would introduce an external SMS service dependency. It is not a confirmed implementation requirement in PRD v2.2.

### ASR-02 — Donor Search Performance and Filtering

**Meaning:**

The system must perform donor searches using multiple criteria while meeting the specified response-time expectation.

**LIFE LINK requirements:**

- Search by blood group, city, area and selected search radius.
- Available radius options are 5 km, 10 km, 25 km and 50 km.
- Include donors whose approximate distance is less than or equal to the selected radius.
- Exclude donors outside the selected radius.
- Arrange results by ascending approximate distance.
- When distances are equal, show the donor with the most recently updated availability first.
- Show a freshness indicator when availability has not been updated for more than seven days.
- Keep donors marked May be outdated visible in search results.
- Return search results within 3 seconds under normal operating conditions.

**Architectural concerns:**

- Efficient filtering using multiple search criteria.
- Approximate distance calculation.
- Sorting results by distance and availability update time.
- Retrieving availability information for freshness indicators.
- Testing search performance against the stated 3-second target.

### ASR-03 — Approximate Location Privacy and Matching

**Meaning:**

Location-based donor discovery must use approximate city and area information while protecting users' residential privacy.

**LIFE LINK requirements:**

- Users manually select their city and area.
- GPS-based location detection is not required.
- The system uses approximate location information.
- Exact residential addresses must not be publicly displayed.
- Normal donor search uses the selected radius and inclusive distance boundary.
- Emergency matching uses blood group, availability and approximate location.
- The same blood group must be used for matching.
- The platform must not claim to determine medical compatibility.

**Architectural concerns:**

- How approximate location information is represented.
- How distance is calculated consistently.
- How normal search and emergency matching apply the relevant location rules.
- How exact residential addresses are kept out of public search results.
- How matching logic avoids inconsistent results between normal search and emergency requests.

### ASR-04 — Emergency Request Lifecycle and Automatic Expiration

**Meaning:**

An emergency request has a lifecycle that determines whether donors can respond, whether the requester can cancel it and whether related conversations accept new messages.

**LIFE LINK requirements:**

- A successfully submitted emergency request receives Open status.
- Only its requester may cancel it while it is Open.
- Cancellation changes the status to Cancelled.
- The system automatically changes an Open request to Expired at 11:59 PM Pakistan Standard Time (PKT) on its required date.
- The required date is interpreted using PKT (UTC+05:00).
- Donors may submit or change responses only while the request remains Open.
- Previously submitted responses remain visible after cancellation or expiration.
- Existing chat messages remain viewable after cancellation or expiration.
- No new chat messages are allowed after cancellation or expiration.

**Architectural concerns:**

- Defining the request state and permitted transitions.
- Enforcing request status consistently across responses, notifications and chat.
- Handling automatic time-based expiration.
- Interpreting the expiry date using PKT.
- Preserving historical request information after a terminal state.

### ASR-05 — Emergency Notification Targeting and Cancellation Notifications

**Meaning:**

Emergency notifications must be sent only to donors who match the request conditions. Cancellation notifications must reach the donors who were previously notified about the request.

**LIFE LINK requirements:**

A donor receives an emergency notification only when:

- Their blood group matches the requested blood group.
- Their availability is Available.
- Their approximate location falls within the selected radius.

The radius boundary is inclusive.

When a requester cancels a request:

- All donors previously notified about that request receive an in-app cancellation notification.
- Donors can no longer submit or change their responses.

**Architectural concerns:**

- Applying matching conditions consistently.
- Identifying all donors notified about a particular request.
- Associating notification records with their relevant emergency requests.
- Generating cancellation notifications for the correct recipients.
- Keeping emergency notifications separate from other communication channels.

**Scope boundary:**

Emergency request notifications are in-app only. SMS, WhatsApp and email notifications for emergency requests are outside the current implementation scope.

### ASR-06 — Request-Specific Chat, Participant Authorization and History Preservation

**Meaning:**

Each conversation belongs to a particular requester, notified donor and emergency request. Participants must be authorized, and conversation history must remain available after the request is closed.

**LIFE LINK requirements:**

- A requester can initiate a conversation with any donor notified about their emergency request.
- The requester does not need to wait for the donor to accept or decline.
- Each donor has a separate conversation with the requester for that request.
- A donor may communicate while their response is Pending, Accepted or Declined.
- Chat does not automatically change the donor's response status.
- Chat does not imply acceptance or guarantee donation.
- Existing messages remain viewable after cancellation or expiration.
- Existing messages become read-only after cancellation or expiration.
- No new messages are allowed after the request becomes Cancelled or Expired.

**Architectural concerns:**

- Associating conversations with the correct emergency request.
- Enforcing access for the requester and notified donor.
- Keeping separate conversations for different donors.
- Enforcing request-state restrictions on message creation.
- Preserving historical messages while preventing new messages after closure.

### ASR-07 — Reliability and Preservation of Important Records

**Meaning:**

The system should preserve important information during normal operation.

**LIFE LINK requirements:**

NFR-06 requires the system to preserve:

- Donor information.
- Emergency requests.
- Donor responses.
- Chat messages.

The functional requirements also require previously submitted responses and existing messages to remain available after cancellation or expiration.

**Architectural concerns:**

- Identifying responsibilities for important records.
- Maintaining consistency between requests, responses and conversations.
- Preventing request closure from deleting historical responses or messages.
- Ensuring the system can retrieve preserved information when required.

### ASR-08 — Maintainability and Web Compatibility

**Meaning:**

The system should be understandable and manageable for the student development team and accessible through commonly used modern web browsers.

**LIFE LINK requirements:**

- The system is a web-based application.
- It should support commonly used desktop and mobile screen sizes.
- It should work through commonly used modern web browsers.
- Its components should be understandable and manageable.
- The project must be completed within the available academic development period.

**Architectural concerns:**

- Clear separation of responsibilities.
- Understandable component boundaries.
- Avoiding unnecessary architectural complexity.
- Supporting the intended web operating environment.
- Considering browser and screen-size compatibility during testing.

---

## 4. Architectural Drivers

The following drivers should guide the team's later architectural alternatives and decisions.

| Driver ID | Architectural Driver | Related ASRs | Evidence / Reason |
|---|---|---|---|
| AD-01 | Secure identity and permission enforcement | ASR-01, ASR-06 | Protected contact details, donor-owned profiles, requester-only cancellation, participant-only conversations and administrator permissions. |
| AD-02 | Responsive and accurate donor search | ASR-02 | Multiple search filters, distance ordering, availability freshness and the 3-second response-time target. |
| AD-03 | Privacy-preserving location matching | ASR-03 | Manual city/area selection, approximate locations and restrictions on public exact-address disclosure. |
| AD-04 | Consistent emergency request lifecycle | ASR-04, ASR-05, ASR-06 | Open, Cancelled and Expired states affect responses, notifications and chat. |
| AD-05 | Correct notification targeting | ASR-05 | Only matching Available donors receive emergency notifications, and previously notified donors receive cancellation notifications. |
| AD-06 | Preservation of request and communication history | ASR-04, ASR-06, ASR-07 | Responses and messages remain available after cancellation or expiration. |
| AD-07 | Maintainable and compatible web application | ASR-08 | Maintainability, academic development constraints and modern browser/desktop/mobile support. |
| AD-08 | External phone-verification dependency (proposed) | ASR-01 | FR-17 proposes registration-only SMS OTP, subject to TA/client validation. |

---

## 5. Important Architectural Constraints

1. The system is a web-based application.
2. Users manually select city and area rather than relying on GPS-based location detection.
3. Approximate location information is used for donor searching.
4. Exact residential addresses must not be publicly displayed.
5. Search radius options are 5 km, 10 km, 25 km and 50 km.
6. The selected search radius has an inclusive boundary.
7. Unavailable donors may appear in normal search results but must not receive emergency notifications.
8. Emergency notifications are in-app only.
9. SMS, WhatsApp and email emergency notifications are outside the current implementation scope.
10. Emergency requests expire at 11:59 PM PKT on their required date.
11. Previously submitted responses and existing chat messages must remain available after cancellation or expiration.
12. Existing conversations become read-only after cancellation or expiration.
13. The platform must not claim to determine medical compatibility or guarantee a donation.
14. No specific programming language, database, framework, architecture style or deployment platform is mandated by the PRD.
15. The implementation must remain understandable and manageable within the academic development period.

---

## 6. External Systems and Integrations

| External System / Service | Purpose | Status |
|---|---|---|
| SMS provider for registration OTP | Send a verification code during user registration. | Proposed under FR-17; pending TA/client validation. Provider not selected. |
| SMS for emergency notifications | Send emergency request or cancellation alerts. | Outside current implementation scope. |
| WhatsApp | Emergency notifications or chat. | Outside current implementation scope. |
| Email service | Emergency notifications. | Outside current implementation scope. |
| Hospital integration | Connect with hospitals or external medical workflows. | Future scope. |
| Payment or reward service | Support payments or rewards. | Future scope. |

**Important distinction:** Registration-only SMS OTP under FR-17 is separate from emergency request notifications. Approval of OTP would not authorize SMS emergency alerts.

---

## 7. Proposed Requirements Pending TA/Client Approval

The following PRD requirements are not part of the confirmed implementation scope unless approved by the TA/client.

| Requirement | Description | Current Status | Architectural Relevance |
|---|---|---|---|
| FR-16 — CNIC-Based Identity Verification | Potential CNIC-based verification and protection of sensitive identity information. | Proposed; pending TA/client approval. | If approved, it may introduce sensitive identity-data handling, restricted access and an identity-verification process. |
| FR-17 — Phone Number Verification Through SMS OTP | Potential phone verification through an SMS OTP during registration only. | Proposed; pending TA/client validation. | If approved, it introduces an external SMS provider dependency and OTP verification responsibilities. |

These proposed requirements must not be treated as confirmed implementation commitments before approval.

---

## 8. Traceability to the PRD

| PRD Source | Architectural Concern | Related ASR |
|---|---|---|
| FR-01, FR-02, BR-08 | Registration, sign-in and authenticated access | ASR-01 |
| FR-03, FR-04, BR-07 | Donor profile ownership and availability management | ASR-01, ASR-07 |
| FR-05, FR-06, BR-17 to BR-19, NFR-01, NFR-04 | Search filtering, distance ordering, performance and freshness | ASR-02, ASR-03 |
| FR-05, FR-09, BR-02, BR-06, BR-09, BR-18 | Approximate location and consistent matching | ASR-03 |
| FR-08, FR-10, FR-12, FR-18, BR-10 to BR-14, BR-23 | Request states, cancellation and automatic expiration | ASR-04 |
| FR-09, FR-12, BR-05, BR-09 | Notification targeting and cancellation notifications | ASR-05 |
| FR-11, FR-12, FR-13, BR-15, BR-16, BR-22, BR-24 | Conversation authorization, read-only behaviour and history | ASR-06 |
| NFR-06, FR-03, FR-08, FR-10 to FR-13 | Preservation of donor, request, response and chat records | ASR-07 |
| NFR-05, NFR-07, PRD §§2.3 and 9 | Maintainability and web compatibility | ASR-08 |
| FR-16, NFR-03 | Potential CNIC identity-data protection | Proposed; not confirmed |
| FR-17, §2.4 | Potential external SMS OTP integration | Proposed; not confirmed |

---

## 9. Risks, Trade-offs and Scope Boundaries

| Concern | Risk or Trade-off | Architectural Implication |
|---|---|---|
| Authorization | Incorrect permission checks could expose personal information or allow unauthorized actions. | Access control must be considered across all protected operations. |
| Search performance | Multiple filters and distance ordering may affect response time. | Search responsibilities and data access should be evaluated against the 3-second target. |
| Approximate location | Approximate points may not represent a user's exact physical distance. | Results should be understood as approximate; exact-location claims must not be made. |
| Request expiration | Incorrect time-zone interpretation could leave requests Open beyond the intended date. | Expiration must consistently use PKT and the specified boundary. |
| Notification targeting | Incomplete recipient tracking could cause cancellation notifications to miss previously notified donors. | Notification records must be associated with the relevant request and recipients. |
| Chat authorization | Incorrect participant checks could expose private conversations. | Conversation access must be restricted to authorized participants. |
| Historical records | Deleting records when a request closes would violate preservation requirements. | Closure must restrict new activity without removing required history. |
| Proposed OTP | SMS delivery depends on an external provider and may introduce cost or availability concerns. | Do not implement as confirmed scope until TA/client approval and provider decisions. |
| Proposed CNIC verification | Sensitive identity data introduces additional privacy and security responsibilities. | Do not include in the current implementation unless separately approved. |
| Academic constraints | Excessive architectural complexity could make the project difficult to complete and maintain. | Select an architecture appropriate to the team's scope and development period. |

---

## 10. Decisions and Confirmations Required Before Architecture Design

The PRD provides the product requirements and constraints. The following matters still require team discussion or approval before they can be treated as architectural decisions:

1. The overall architectural style is selected as a modular monolith (ADR-01).
2. The eight logical modules are selected in ADR-02; detailed responsibilities and interfaces must be documented.
3. The logical module set is selected; detailed component interfaces and contracts remain to be documented.
4. One shared database and module-level record ownership are selected; exact entity/table ownership mapping remains to be documented.
5. Authentication uses email/password and authorization is cross-cutting, enforced by each protected module.
6. The team must evaluate how request expiration will be handled reliably at the specified PKT boundary.
7. The team must evaluate how notification recipients and cancellation notifications will be managed.
8. FR-16 and FR-17 remain excluded from current implementation scope; no CNIC verification or SMS OTP.
9. No external SMS/email provider is approved or included in the current version.
10. The team must document significant architectural decisions in ADRs, including alternatives, trade-offs, rationale and consequences.

No architecture style, framework, database, programming language, deployment platform or external provider is selected by this ASR document.

---

## 11. Conclusion

The eight identified ASRs represent the most important architectural concerns for LIFE LINK:

1. Authentication, authorization and access control.
2. Donor search performance and filtering.
3. Approximate location privacy and matching.
4. Emergency request lifecycle and automatic expiration.
5. Emergency notification targeting and cancellation notifications.
6. Request-specific chat, participant authorization and history preservation.
7. Reliability and preservation of important records.
8. Maintainability and web compatibility.

These ASRs are based on the latest supplied LIFE LINK PRD v2.2 and provide a traceable foundation for the next Deliverable 3 activities.

The document identifies architectural concerns but does not make major architectural decisions on behalf of the group. Those decisions must be discussed, justified and recorded in the relevant ADRs.

FR-16 and FR-17 remain proposed requirements pending TA/client approval and must not be treated as confirmed implementation scope.


---

## 12. Current-Session Decision Baseline and ASR Amendments

### 12.1 Architecture decisions
- Modular monolith, one shared database, REST API.
- Each module owns its records within the shared database.
- Authorization is cross-cutting; UI is a presentation layer.
- Local demonstration deployment; English only.
- No external SMS/email integration, SMS OTP or CNIC verification in this version.
- No administrator role, dashboard or human report review.

### 12.2 Logical module set
The eight logical modules are Authentication, Donor Management, Donor Search, Location Matching, Emergency Requests, Request Lifecycle, Notifications and Chat. Detailed interfaces and entity ownership mapping remain to be specified.

### 12.3 Updated security/privacy requirements
- Passwords are securely hashed.
- One account may act as donor and requester.
- Users may edit their own profiles and declared blood group.
- Blood group is user-declared/unverified; no medical verification claim.
- Donors control their own availability; new donors default to Unavailable.
- Requester contact details are revealed only after acceptance of the relevant donor response.
- Chat history is visible only to its two participants.
- Reporter identity and automated restriction records are private.
- Exact residential location is not exposed.

### 12.4 Updated reporting safeguard
The selected threshold is three independent reports, with a seven-day precautionary restriction on creating new emergency requests only. Other account functions remain available. No formal appeal mechanism and no human reviewer were selected. The restriction record stores reason, start date and expiry date.

A report count is not proof of misconduct. The system must define independent reporters, duplicate prevention, rate limits and safeguards against coordinated false reports before implementation.

### 12.5 Notification quality requirements
In-app notifications only; no notification-history page. Notify for relevant emergency requests, responses to a user's own emergency requests and request status changes. Do not send chat notifications.

### 12.6 Remaining architecture-driving uncertainties
- Independent-report definition and anti-abuse rules.
- Request status/closure outcome mapping.
- Donor response transitions and multi-acceptance closure.
- Chat conversation grouping.
- Account deletion and retention.
- Transient notification persistence/delivery semantics.
