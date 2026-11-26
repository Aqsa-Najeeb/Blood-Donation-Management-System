# LIFE LINK — Evidence: Gap Analysis Between Prototype Code and Project Documents

**Date:** 26 November 2026  
**Status:** Complete Analysis  
**Scope:** Express + Prisma + MySQL prototype code (`backend/`, `prisma/`, `src/`) vs. Project Baseline Documents (`docs/PRD.md`, `docs/architecture.md`, `docs/AGENTS.md`, `docs/SESSION_DECISIONS.md`, `docs/OPEN_ISSUES_AND_CONSISTENCY.md`).

---

## 1. Executive Summary

An audit was conducted comparing the existing application prototype codebase against the specification documents and recorded session decisions. The prototype implements a functional Express + Prisma + MySQL + React (in-browser Babel + UMD) platform, but diverges from the architectural and PRD decisions in several core areas.

This gap analysis catalogues every contradiction across the eight specific areas required for alignment.

---

## 2. Contradiction Analysis

### 2.1 User Roles
- **Document Baseline:**
  - `SESSION_DECISIONS.md` (Sections 1 & 2) and `AGENTS.md` (Section 11.1) state: Remove Administration feature, admin dashboard, and human review entirely. One account acts as both requester and donor. No separate fixed roles exist for users.
  - `PRD.md` previously listed Requester, Donor, and Administrator, but session decisions of 23 Nov explicitly removed the Administrator role and consolidated to a single user account capable of acting as both donor and requester.
- **Prototype Code:**
  - `prisma/schema.prisma` lines 10–14 defines an enum: `UserRole { DONOR, RECIPIENT, COORDINATOR }`.
  - In `backend/routes/auth.js` lines 66–73, registration forces selection of either `DONOR` or `RECIPIENT` (defaulting to `DONOR`).
  - In `backend/routes/requests.js` lines 35, 42, 53, and `backend/routes/chats.js` line 53, a privileged role `COORDINATOR` is granted administrative override access to view and manipulate requests and chats.
- **Contradiction:**
  - The codebase hardcodes three separate roles (`DONOR`, `RECIPIENT`, `COORDINATOR`), introducing an administrative coordinator role explicitly barred by session decisions, and prevents a single user account from seamlessly acting as both requester and donor.

---

### 2.2 CNIC and Verification Status
- **Document Baseline:**
  - `SESSION_DECISIONS.md` Section 1: "No SMS/email external services, no SMS OTP, no CNIC verification. (Confirmed)".
  - `SESSION_DECISIONS.md` Section 2: "Blood group is user-declared/unverified because CNIC/medical verification is not included. (Required interpretation)".
  - `OPEN_ISSUES_AND_CONSISTENCY.md` Item 9: "Blood group: User-editable and unverified; UI must not imply medical verification."
- **Prototype Code:**
  - `prisma/schema.prisma` lines 55 & 66: `User` model contains `cnic String? @db.VarChar(30)` and `verified Boolean @default(true)`.
  - `prisma/schema.prisma` line 108: `DonationMilestone` includes `verified Boolean @default(true)`.
  - `backend/routes/auth.js` line 45 accepts `cnic` during registration.
  - `src/index.html` title reads: `"Life Link | Direct Verified Blood Exchange"`.
  - Frontend components (`src/js/components.js`, `src/js/pages-public.js`) display "Verified Donor" badges, green verified checkmarks, and "Direct Verified Blood Exchange" slogans throughout the UI.
- **Contradiction:**
  - The database stores CNIC and sets `verified = true` by default. The UI explicitly markets and labels donors as "Verified", directly violating the rule that blood group and donors are unverified and must never imply medical or government verification.

---

### 2.3 Donor Availability Default
- **Document Baseline:**
  - `SESSION_DECISIONS.md` Section 2: "New donor defaults to Unavailable; donors manually control availability. (Confirmed)".
  - `AGENTS.md` Section 11.2: "New donors default to Unavailable; donors manually control availability."
- **Prototype Code:**
  - `prisma/schema.prisma` line 64: `available Boolean @default(true)`.
  - `prisma/schema.prisma` line 65: `online Boolean @default(true)`.
  - `backend/routes/auth.js` line 109: `available: userRole === "DONOR"`, defaulting new donor accounts to `available: true`.
- **Contradiction:**
  - The schema and registration route default new donors to `available: true` (and `online: true`), contradicting the explicit decision that new donors must default to `Unavailable`.

---

### 2.4 Emergency Request Fields and Request Flow
- **Document Baseline (Decision D1):**
  - Standard request fields: `bloodGroup`, `hospital`, `city`, `area`, `radius` (5/10/25/50 km), `requiredDate`, `units`, `urgency`, `contactPhone`, and optional `message`.
  - PRD FR-08 / BR-08 specifies required date for expiry calculations and matching radius for geo-targeting.
- **Prototype Code:**
  - `prisma/schema.prisma` lines 117–149 (`BloodRequest`): contains complex clinical and stage-tracking fields: `caseCategory`, `ward`, `requiredBy` (string varchar(80) e.g. "Within 12 hours"), `patientName`, `attendantName`, `doctorName`, `labId`, `crossMatchStatus`, `slipNumber`, `stage` (int 1–5), `rating`, `notes`.
  - Missing fields in `BloodRequest`: `area`, `radius` (km), `requiredDate` (proper date/timestamp), and `contactPhone`.
  - `backend/routes/requests.js` lines 95–96 expects `caseCategory`, `ward`, `requiredBy`, `notes`. In lines 276–315, it implements a 5-stage workflow (`stage 1` through `5`, `Lab Cross-Match In Progress`, `Transfusion Fulfilled`) and ratings (lines 388–418).
  - Controlled 3-donor auto-selection: lines 150–160 automatically query up to 3 donors and push invitations (`PENDING` for donor 1, `ON_HOLD` for donors 2 and 3), rather than notifying all matching available donors within the radius.
- **Contradiction:**
  - The request model is loaded with unapproved hospital simulation fields (`labId`, `slipNumber`, `crossMatchStatus`, `stage 1-5`, `attendantName`, `doctorName`) while lacking the approved spatial matching and lifecycle fields (`area`, `radius`, `requiredDate`, `contactPhone`).
  - The creation flow imposes an artificial sequential "3-donor standby cap" with stage progression instead of standard open broadcast to matching donors within the selected radius.

---

### 2.5 Request and Invitation Status Lifecycle
- **Document Baseline (Decisions D2 & D3):**
  - Request status must be: `status = Open | Closed` with `closureReason = FULFILLED | CANCELLED | EXPIRED`.
  - Automatic expiry occurs at 11:59 PM PKT (UTC+5) on the required date.
  - Donor response (FR-10): `Pending | Accepted | Declined`, editable while request is Open.
  - Requester decision: `None | Approved | Rejected` on Accepted responses. Contact is revealed only when Approved. No auto-close upon acceptance.
- **Prototype Code:**
  - `prisma/schema.prisma` lines 22–26: `RequestStatus { ACTIVE, FULFILLED, CANCELLED }` (Missing `EXPIRED`; uses `ACTIVE` instead of `Open/Closed`).
  - `prisma/schema.prisma` lines 28–34: `InvitationStatus { PENDING, ACCEPTED, ON_HOLD, DECLINED, DONATED }`.
  - `prisma/schema.prisma` does not have `closureReason`, nor does it have requester decision fields (`None | Approved | Rejected`).
  - `backend/routes/requests.js`: Request status transitions directly to `FULFILLED` via stage update (line 300) or `CANCELLED` via cancel route (line 377). Expiry is never evaluated (no sweep, no read check).
  - `backend/routes/donorActions.js` lines 48–50: Once an invitation status is not `PENDING`, it cannot be changed (cannot switch Accepted <-> Declined).
- **Contradiction:**
  - Status models diverge completely (`ACTIVE/FULFILLED/CANCELLED` vs `Open/Closed` + `closureReason`).
  - Donor responses lack requester approval status (`None/Approved/Rejected`) and use unapproved states (`ON_HOLD`, `DONATED`).
  - No background sweep or query-time check exists for 11:59 PM PKT expiry.

---

### 2.6 Chat Model and Architecture
- **Document Baseline (Decision D5):**
  - General platform chat: one conversation per user pair, based on mutual user invitations (Accept, Reject, Restrict).
  - Request-linked read-only rules of old FR-13 no longer apply; chat is decoupled from emergency requests.
- **Prototype Code:**
  - `prisma/schema.prisma` lines 177–197 (`ChatThread`): `ChatThread` is tied directly to a `requestId` and `donorId` (`@@unique([requestId, donorId])`), with fields `requestId`, `hospital`, `statusTag`.
  - `backend/routes/chats.js` line 44–56 requires `requestId` and `donorId` to open a thread. If an unrelated request ID is supplied, chat is forbidden.
  - `backend/routes/donorActions.js` lines 64–85 automatically creates a `ChatThread` upon donor accepting a request invitation.
- **Contradiction:**
  - The chat implementation is strictly request-scoped and coupled to individual emergency requests, directly contradicting the confirmed decision for general user-pair invitation chat.

---

### 2.7 Reporting Safeguards and Rules
- **Document Baseline (Decisions D7 & SESSION_DECISIONS Section 7):**
  - Precautionary threshold: 3 independent reports trigger a 7-day restriction on creating new emergency requests only.
  - Independent reporter definition (Decision D7): distinct account, one report per reporter per target, reporter account older than 24 hours, no self-report. Reports made before the last restriction start do not count again.
  - No human review / administrator dashboard.
- **Prototype Code:**
  - `backend/routes/settings.js` lines 231–239 deduplicates by `targetUserId` and `reporterId` via `prisma.safetyReport.findFirst`.
  - However, line 251 counts ALL historical reports ever received by the target user: `prisma.safetyReport.count({ where: { targetUserId: targetId } })`.
  - It does NOT check whether the reporter account is older than 24 hours.
  - It does NOT reset or exclude reports submitted prior to an earlier restriction start date.
  - In `backend/routes/requests.js` lines 124–129, the restriction check is only triggered if `urgRaw === "EMERGENCY"`, allowing restricted users to bypass the restriction by submitting requests labeled `URGENT` or `STANDARD`.
- **Contradiction:**
  - Historical reports accumulate indefinitely across restriction cycles.
  - 24-hour account maturity is unenforced.
  - Restrictions are selectively bypassed by changing urgency level to non-EMERGENCY.

---

### 2.8 Fake Statistics and Seed Data
- **Document Baseline:**
  - `OPEN_ISSUES_AND_CONSISTENCY.md` Item 11 & 12: Implementation status and metrics must not fabricate claims. Statistics must reflect reality or unmanipulated system metrics.
  - Realism: No fake reputation scores, false response rates, or simulated donation counts.
- **Prototype Code:**
  - `prisma/schema.prisma` lines 76–81: `User` model contains fabricated metrics:
    - `responseRate Int @default(98)`
    - `reliabilityScore Int @default(100)`
    - `honorScore Float @default(99.0)`
    - `completedDonations Int @default(0)`
    - `livesImpacted Int @default(0)`
    - `recoveryDaysDone Int @default(56)`
  - `backend/routes/donors.js` lines 5–14 & 28–34: hardcodes `BASE_AVAILABILITY` adding thousands of fake baseline donors:
    - `A+: 2410`, `B+: 3120`, `AB+: 890`, `O+: 5240`, `O-: 612`, etc., and adds the real count to these fake numbers.
  - `prisma/seed.js` seeds fake milestones, badges ("Golden Drop 2024", "Transfusion Champion"), and fabricated honor scores.
- **Contradiction:**
  - The prototype generates fabricated blood supply quantities, bogus donor response rates, fake honor scores, and synthetic hospital milestones, misleading users and directly violating the anti-fabrication mandate.

---

### 2.9 Stored Distance vs. Coordinate Matching
- **Document Baseline (Decision D6):**
  - Distance calculation: static table of city/area coordinates plus the Haversine formula computed dynamically on request/search.
  - No stored distance on users.
- **Prototype Code:**
  - `prisma/schema.prisma` line 62: `User` model contains `distanceKm Float @default(3.5)`.
  - `backend/routes/donors.js` line 63: filters `where.distanceKm = { lte: maxKm }` directly against the database column.
  - `backend/routes/requests.js` line 159: orders matching donors with `orderBy: { distanceKm: "asc" }`.
- **Contradiction:**
  - Distance is stored as a static column on the user profile (`User.distanceKm`), which is physically meaningless (relative to what center point?), instead of calculating distance dynamically between the requester's target location and the donor's area via Haversine.

---

## 3. Summary of Code Alignment Requirements

| Area | Current Prototype Implementation | Required Document Baseline |
|---|---|---|
| **Roles** | `DONOR`, `RECIPIENT`, `COORDINATOR` | Single user account (donor + requester), no `COORDINATOR` or admin |
| **Verification / CNIC** | Stores CNIC; `verified = true` default; UI displays "Verified Donor" | No CNIC; no verification; declared blood group explicitly unverified |
| **Availability Default** | `available: true`, `online: true` default | New donors default to `available: false` (Unavailable) |
| **Request Fields** | Clinical simulation (`labId`, `slipNumber`, `crossMatchStatus`, `stage 1-5`) | `bloodGroup`, `hospital`, `city`, `area`, `radius`, `requiredDate`, `units`, `urgency`, `contactPhone`, `message` |
| **Request Lifecycle** | `ACTIVE`, `FULFILLED`, `CANCELLED` | `Open`, `Closed` with `closureReason: FULFILLED \| CANCELLED \| EXPIRED` (11:59 PM PKT) |
| **Donor Response** | `PENDING`, `ACCEPTED`, `ON_HOLD`, `DECLINED`, `DONATED` | Donor response (`Pending/Accepted/Declined`) + Requester decision (`None/Approved/Rejected`) |
| **Chat** | Coupled to `requestId` and `donorId` in `chat_threads` | General platform chat per user pair via invitations (`Accept/Reject/Restrict`) |
| **Reporting** | Lifetime count, no 24h reporter age check, urgency bypass | 3 independent reports within active window, 24h reporter age, blocks all emergency requests |
| **Fake Stats** | Hardcoded thousands in `BASE_AVAILABILITY`, fake `honorScore` | Real database counts only; remove fake scores and synthetic availability |
| **Distance** | Stored `distanceKm` column in `users` table | Dynamic Haversine calculation between area coordinates; remove `User.distanceKm` |
