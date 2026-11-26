# LIFE LINK — D4 Implementation Plan

**Plan version:** v02  
**Date:** 26 November 2026  
**Status:** Planned (Align and Complete Prototype)  
**Baseline Stack:** Node.js Express REST API, Prisma ORM, MySQL, React (UMD + in-browser Babel), Tailwind CSS (ADR-11)

---

## 1. Objective and Prototype Reality

An Express + Prisma + MySQL + React prototype currently exists in the repository (`backend/`, `prisma/`, `src/`). However, as established in `evidence/gap-analysis.md`, the prototype contradicts the PRD and session decisions across several key dimensions:
- user roles and admin coordinator access,
- CNIC storage and false "verified donor" claims,
- donor availability defaulting to true instead of false,
- clinical simulation fields and rigid 3-donor sequential queues on emergency requests,
- divergent request status and lifecycle models without 11:59 PM PKT expiry checks,
- request-coupled chat instead of general user-pair invitation chat,
- missing anti-abuse safeguards for reporting,
- fabricated platform availability metrics, and
- static user distance columns instead of dynamic coordinate-based Haversine matching.

Therefore, the vertical slices in this plan do not represent greenfield construction from scratch. Rather, each slice represents **aligning and completing** the existing prototype codebase against the PRD, ADRs, and the confirmed/proposed session decisions of 26 Nov 2026.

---

## 2. Assumptions and Constraints
- **Architecture:** Modular monolith (`ADR-01`), shared relational database with logical module boundaries (`ADR-04`), REST communication (`ADR-03`).
- **Stack:** Approved per `ADR-11` (Express, Prisma, MySQL, React via UMD + in-browser Babel).
- **Scope & Privacy:** In-app only; no external SMS/email services; no SMS OTP; no CNIC verification (`ADR-10`). No administrative dashboard or human review.
- **Data Integrity:** Real data only. Eliminate synthetic statistics, fake response rates, and simulated hospital milestones.

---

## 3. Work Slices (Align and Complete)

All slices are currently set to **Planned**.

### Slice A1: Foundation, cleanup, sign-in (FR-01, FR-02)
- **Owner:** Member 1
- **Scope:** 
  - Align database schema (`prisma/schema.prisma`) and auth routes (`backend/routes/auth.js`) to remove the `COORDINATOR` role and separate `DONOR`/`RECIPIENT` division.
  - Implement single unified user account model capable of acting as both donor and requester.
  - Remove `cnic` and `verified` fields from database schema and registration payload.
  - Remove all UI labels implying verification ("Verified Donor", "Direct Verified Blood Exchange").
  - Secure bcrypt password hashing and JWT issuance; enforce rate limiting on auth endpoints.
- **Dependencies:** ADR-11 stack approval.
- **PRD References:** FR-01 (User Registration), FR-02 (User Login & Authentication), BR-01, BR-02, BR-03.
- **Acceptance Criteria:**
  - A user can register with email, password, name, phone, blood group, city, and area without CNIC.
  - Single account can immediately both search for donors and create requests without switching accounts or roles.
  - No coordinator role or admin bypass exists in auth tokens or database models.
  - UI displays no unverified medical verification badges.
- **Status:** Planned

---

### Slice A2: Profile and availability (FR-03, FR-04)
- **Owner:** Member 2
- **Scope:**
  - Update user schema and profile management (`backend/routes/settings.js`, `src/js/pages-account.js`).
  - Default new donor availability to `false` (`Unavailable`).
  - Allow users to update their profile information and editable blood group (clearly flagged as self-declared/unverified in UI).
  - Provide manual toggle for donor availability without automatic reset.
  - Implement account deletion request (D8): deactivation and anonymization of name, email, and phone, leaving historical messages/reports as "Deleted user".
- **Dependencies:** Slice A1.
- **PRD References:** FR-03 (Donor Profile Management), FR-04 (Donor Availability Management), BR-04, BR-05, BR-06.
- **Acceptance Criteria:**
  - Newly registered donors have `available = false`.
  - User can toggle availability between Available and Unavailable manually.
  - User can edit declared blood group and location.
  - Deleting account anonymizes personal fields and flags status as deactivated while preserving referential integrity.
- **Status:** Planned

---

### Slice A3: Search, ordering, freshness, contact (FR-05, FR-06, FR-07)
- **Owner:** Member 3
- **Scope:**
  - Implement static table of city and area coordinates and Haversine distance calculation formula (`D6`).
  - Remove static `distanceKm` column from `User` table.
  - Implement donor search filtering strictly by blood group, location (city/area), and radius (5, 10, 25, 50 km).
  - Display both Available and Unavailable donors with explicit availability and freshness labels.
  - Clean up synthetic stats (`BASE_AVAILABILITY` hardcoded thousands, fake `honorScore`, bogus `responseRate`).
  - Approximate location only (city/area); shield exact contact phone based on user settings and requester authorization.
- **Dependencies:** Slice A1, Slice A2.
- **PRD References:** FR-05 (Donor Search & Filtering), FR-06 (Search Results Ordering & Freshness), FR-07 (Donor Contact Initiation & Privacy Shielding), BR-07.
- **Acceptance Criteria:**
  - Search returns donors within selected radius calculated dynamically via Haversine.
  - Both available and unavailable donors are listed with clear status indicators.
  - No fake baseline statistics appear in search or availability dashboards.
  - Exact residential addresses are never collected or shown.
- **Status:** Planned

---

### Slice B1: Create request and visibility (FR-08)
- **Owner:** Member 1
- **Scope:**
  - Align `BloodRequest` model and creation route (`backend/routes/requests.js`, `src/js/pages-matching.js`).
  - Include approved fields (`D1`): `bloodGroup`, `hospital`, `city`, `area`, `radius` (5/10/25/50 km), `requiredDate`, `units` (1–6), `urgency`, `contactPhone`, optional `message`.
  - Strip unapproved clinical simulation fields (`stage 1-5`, `labId`, `slipNumber`, `crossMatchStatus`, `attendantName`, `doctorName`, `rating`).
  - Enforce maximum 3 active requests per user.
  - Implement visibility rule (`D4`): request visible only to creator and registered users with matching declared blood group.
  - Calculate notified donors: matching blood group, Available, within radius (inclusive).
- **Dependencies:** Slice A1, Slice A2, Slice A3.
- **PRD References:** FR-08 (Emergency Request Submission), BR-08, BR-09.
- **Acceptance Criteria:**
  - User can create request with all D1 fields; units validated 1–6.
  - Users with non-matching blood groups cannot view or discover the request.
  - Request creator cannot exceed 3 active requests.
  - Matching donors within radius are correctly targeted for notification alerts.
- **Status:** Planned

---

### Slice B2: Donor responses and requester decisions (FR-10, FR-11)
- **Owner:** Member 2
- **Scope:**
  - Refactor `request_invitations` to model Donor Response and Requester Decision (`D3`).
  - Donor response states: `Pending | Accepted | Declined` (editable by donor while request is Open).
  - Requester decision states: `None | Approved | Rejected` (applicable only to Accepted responses).
  - Support multiple Accepted donors and multiple Approved decisions; no automatic request closure on acceptance.
  - Requester contact phone revealed to a donor only if that donor is Approved by the requester.
- **Dependencies:** Slice B1.
- **PRD References:** FR-10 (Donor Response to Emergency Request), FR-11 (Requester Contact Access for Responding Donors), BR-11, BR-12.
- **Acceptance Criteria:**
  - Notified donor can accept or decline an open request, and change response while request remains Open.
  - Requester can approve or reject accepted donor responses.
  - Requester phone number is hidden until the requester explicitly approves the donor.
  - Multiple donors can be approved without triggering auto-closure.
- **Status:** Planned

---

### Slice B3: Cancel, fulfil, expire (FR-12, FR-18)
- **Owner:** Member 3
- **Scope:**
  - Align request lifecycle to `status = Open | Closed` with `closureReason = FULFILLED | CANCELLED | EXPIRED` (`D2`).
  - Requester can manually close request as FULFILLED or CANCELLED.
  - Implement automatic expiry at 11:59 PM PKT (UTC+5) on the `requiredDate`.
  - Expiry evaluation implemented on every read and via a 60-second background sweep.
  - Closed requests prevent further donor responses or requester decisions; preserve existing response history.
- **Dependencies:** Slice B1, Slice B2.
- **PRD References:** FR-12 (Emergency Request Cancellation), FR-18 (Emergency Request Auto-Expiration), BR-13, BR-18.
- **Acceptance Criteria:**
  - Requester can cancel own request (status becomes Closed, closureReason CANCELLED).
  - Requester can fulfill own request (status becomes Closed, closureReason FULFILLED).
  - Requests past 11:59 PM PKT on requiredDate automatically resolve to Closed / EXPIRED upon read or via 60s sweep.
  - Closed requests lock response state changes.
- **Status:** Planned

---

### Slice C1: Notifications (FR-09)
- **Owner:** Member 1
- **Scope:**
  - In-app notification creation and delivery (`backend/routes/settings.js`, frontend polling).
  - Notify matching available donors within radius upon request creation.
  - Notify requester when a donor responds (Accept / Decline).
  - Notify responding donors when request status changes (Cancelled, Fulfilled, Expired) or when requester makes a decision (Approved / Rejected).
  - Polling interval set to 15 seconds (`D9`); transient display without persistent notification history page.
  - No notifications for chat activities.
- **Dependencies:** Slice B1, Slice B2, Slice B3.
- **PRD References:** FR-09 (Emergency In-App Notification Delivery), BR-10.
- **Acceptance Criteria:**
  - Matching donors receive in-app alert within 15 seconds of request creation.
  - Requesters receive notification when donors accept/decline.
  - Donors receive status updates if request is cancelled or closed.
  - No notifications generated for chat messages or invitations.
- **Status:** Planned

---

### Slice C2: Chat (FR-13)
- **Owner:** Member 2
- **Scope:**
  - Decouple chat from emergency requests (`backend/routes/chats.js`, `src/js/pages-dashboards.js`).
  - Implement general user-pair platform chat (`D5`): one conversation thread per user pair.
  - Mutual invitation model: registered user sends invitation; recipient can `Accept`, `Reject`, or `Restrict`.
  - One pending invitation per user pair; no auto-expiry; 24-hour cooldown after rejection before new invite.
  - Contact restriction blocks messages/invites between pair without suspending accounts; history remains visible; recipient can unrestrict.
  - Text-only messages with maximum 1000 characters (`D9`); individual messages cannot be deleted.
- **Dependencies:** Slice A1, Slice A2.
- **PRD References:** FR-13 (Direct Requester-Donor In-App Chat), BR-14.
- **Acceptance Criteria:**
  - Chat can be initiated between any two registered users via invitation.
  - Messaging is enabled only after recipient accepts invitation.
  - Restricting contact prevents new messages while preserving history.
  - Messages limited to 1000 characters plain text.
- **Status:** Planned

---

### Slice C3: Reporting safeguard (FR-14, FR-15)
- **Owner:** Member 3
- **Scope:**
  - Implement community safety reporting (`backend/routes/settings.js`) with categories: False Donor Information, Harassment, Inappropriate Content, Suspicious Activity.
  - Enforce independent reporter rules (`D7`): distinct account, one report per reporter per target, reporter account older than 24 hours, no self-reporting.
  - Precautionary threshold: 3 independent reports within active window trigger automated 7-day restriction.
  - Restriction blocks creation of all new emergency requests (regardless of urgency) while keeping other features active.
  - Reports submitted prior to the start of the last restriction period do not count again.
  - Private reporter identity; no public badges, no admin dashboard, no human review.
- **Dependencies:** Slice A1, Slice B1, Slice C2.
- **PRD References:** FR-14 (User Reporting), FR-15 (Account Deactivation & Safety Restriction), BR-15, BR-16.
- **Acceptance Criteria:**
  - User can submit report with category and 10+ char reason.
  - Reports from accounts < 24 hours old or duplicate reports from same user do not count toward threshold.
  - 3 independent reports automatically place user on 7-day emergency request creation restriction.
  - Restricted user cannot submit any emergency requests during the 7-day window.
- **Status:** Planned

---

### Slice A7: Integration and final validation
- **Owner:** Member 1, Member 2, Member 3
- **Scope:**
  - End-to-end integration of all aligned modules into the single Express + React platform.
  - Execute automated test suite (`tests/smoke.js`, `tests/api.test.js`) and comprehensive manual verification flows.
  - Verify zero console errors, zero Babel transpilation failures, and clean responsive layout.
  - Validate all non-functional requirements (security headers, CORS, rate limiting, payload limits).
- **Dependencies:** Slices A1 through C3.
- **PRD References:** Comprehensive PRD Acceptance Criteria & Baseline ASRs.
- **Acceptance Criteria:**
  - Complete end-to-end user journeys pass (Registration -> Search -> Request -> Match -> Response -> Decision -> Chat -> Report -> Closure).
  - All test scripts pass with 0 failures.
  - Application runs seamlessly via `node server.js` on local demo environment.
- **Status:** Planned
