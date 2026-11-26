# LIFE LINK — Current-Session Decision Register

**Session date:** 23 November 2026  
**Coverage:** Answers and clarifications from Q1–Q55.

Status meanings: **Confirmed** = directly selected/clarified; **Interpretation** = consolidation needed to express the answer; **Open** = not conclusively decided.

## 1. Architecture and scope
- Modular monolith, not microservices. (Confirmed)
- One shared database; each module owns/manages its records. (Confirmed)
- REST API. (Confirmed)
- Authorization is cross-cutting; UI is presentation layer. (Confirmed)
- Remove Administration feature, admin dashboard and human review. (Confirmed)
- Eight logical modules: Authentication, Donor Management, Donor Search, Location Matching, Emergency Requests, Request Lifecycle, Notifications and Chat. (Confirmed direction; detailed contracts remain open)
- Local deployment for demo; English only. (Confirmed)
- No SMS/email external services, no SMS OTP, no CNIC verification. (Confirmed)

## 2. Accounts and donor profiles
- Email/password registration and login. (Confirmed)
- Securely hash passwords; never store plaintext. (Confirmed)
- One account can act as donor and requester. (Confirmed)
- Users can edit their own profiles and registered blood group. (Confirmed)
- Users can request account deletion. (Confirmed)
- Blood group is user-declared/unverified because CNIC/medical verification is not included. (Required interpretation)
- New donor defaults to Unavailable; donors manually control availability. (Confirmed)
- Availability does not change automatically after donor response. (Confirmed)

## 3. Donor search and emergency visibility
- Search filters: blood group and location only. (Confirmed)
- Show both Available and Unavailable donors; clearly label availability. (Confirmed)
- Emergency request visibility is limited to registered users with a matching declared blood group; request owner should retain access. (Confirmed direction plus necessary access interpretation)
- Approximate location only; no exact residential address exposure. (Confirmed)

## 4. Emergency requests
- Request fields: blood group, hospital/location, required units, contact details and urgency. (Confirmed)
- Maximum three active requests per user. (Confirmed)
- Multiple donors may respond to one request. (Confirmed)
- Requester may accept multiple donors. (Confirmed)
- Requester contact details shown only after requester accepts the donor's response. (Confirmed)
- Users may cancel their own requests. (Confirmed)
- Requester manually closes own requests. (Confirmed)
- Selected status set: Open and Closed. (Confirmed)
- The old PRD's automatic expiry at 11:59 PM PKT was not explicitly revoked in this session; retain it pending reconciliation with Open/Closed. (Inherited existing requirement)
- Donor response transitions and closure outcome mapping remain open.

## 5. Chat
- General platform chat, not limited to emergency requests. (Confirmed)
- Only registered users can send/receive invitations. (Confirmed)
- Both donors and requesters can initiate. (Confirmed)
- No fixed invitation limit. (Confirmed)
- One pending invitation per user pair. (Confirmed)
- Invitations do not expire automatically. (Confirmed)
- Recipient can Accept, Reject or Restrict. (Confirmed)
- Accept opens chat. (Confirmed)
- After Reject, sender waits 24 hours before another invitation. (Confirmed)
- Restrict contact blocks new messages/invitations between the pair, but does not suspend accounts. (Confirmed)
- The recipient who applied the restriction can remove it. (Confirmed)
- Existing messages remain visible to both participants after restriction. (Confirmed)
- After restriction removal, a new invitation must be accepted before messaging resumes. (Confirmed)
- Contact restriction does not hide profile. (Confirmed)
- Individual messages cannot be deleted. (Confirmed)
- Only two participants can view chat history. (Confirmed)
- Text only; no image/document/voice. (Confirmed)
- Users can report from chat. (Confirmed)
- No chat notifications. (Confirmed)
- One conversation per pair versus per emergency request remains open.

## 6. Notifications
- In-app only. (Confirmed)
- Notify for relevant emergency requests, responses to own emergency requests and request status changes. (Confirmed)
- No notification-history page. (Confirmed)
- No notifications for chat invitation, accept/reject or messages. (Confirmed)
- Transient alert presentation is an interpretation, not a confirmed UI detail.

## 7. Reporting safeguard
- Keep user reporting, remove human admin review. (Confirmed)
- Categories: false donor information, harassment, inappropriate content, suspicious activity. (Confirmed)
- Three independent reports is the selected threshold. (Confirmed)
- Seven-day temporary restriction. (Confirmed)
- Restrict only creation of new emergency requests; other functions remain available. (Confirmed clarification)
- Private restriction record stores reason, start date and expiry date. (Confirmed)
- Reporter identity remains private. (Confirmed)
- No formal appeal mechanism. (Confirmed)
- A report count is not proof of misconduct. The trigger must be described as precautionary, not as a verified finding. (Necessary qualification)
- Definition of independent reports, deduplication, rate limits and coordinated false-report safeguards remain open.
- An earlier discussion considered recording reports without automatic restriction; the later accepted seven-day restriction direction supersedes that alternative, but the policy conflict is explicitly retained for review.

## 8. Decisions still needing approval
1. Define independent reporters and duplicate-report safeguards.
2. Define notice shown to a user during a temporary restriction.
3. Reconcile Open/Closed status with Fulfilled/Cancelled/Expired outcomes.
4. Define donor response states and transitions.
5. Define closure when multiple donors have been accepted.
6. Choose chat grouping model (per pair or per request).
7. Define account deletion and data retention.
8. Specify transient notification delivery/persistence.


## 9. Decisions of 26 Nov 2026

- **D1 Request fields:** `bloodGroup`, `hospital`, `city`, `area`, `radius` (5/10/25/50), `requiredDate`, `units`, `urgency`, `contactPhone`, optional `message`. [Session fields plus the PRD FR-08 fields needed for expiry and matching. PROPOSED (needs group confirmation)]
- **D2 Request status and expiry:** `status = Open | Closed`, plus `closureReason = FULFILLED | CANCELLED | EXPIRED`. Expiry at 11:59 PM PKT (UTC+5) on the required date, checked on every read plus a 60-second sweep. [PROPOSED (needs group confirmation)]
- **D3 Donor response and requester decision:** Donor response (FR-10) = `Pending | Accepted | Declined`, changeable while the request is Open. Requester decision (session) = `None | Approved | Rejected`, allowed only on Accepted responses; many Approved allowed; no auto-close. The requester's contact is visible to a donor only when that donor is Approved. [FROM-PRD plus SESSION. Two fields, no Withdrawn state. CONFIRMED-BY-SESSION / FROM-PRD]
- **D4 Visibility:** Owner plus registered users with the same declared blood group (view only). Notified donors (same blood group + Available + within radius, inclusive) can respond. [CONFIRMED-BY-SESSION plus PRD BR-09]
- **D5 Chat:** General platform chat, one conversation per user pair, invitation based (`Accept`, `Reject`, `Restrict`). The request-linked read-only rules of FR-13 no longer apply. [CONFIRMED-BY-SESSION; per-pair is PROPOSED (needs group confirmation)]
- **D6 Distance:** Static table of city/area coordinates plus the Haversine formula. No stored distance on users. [PROPOSED (needs group confirmation)]
- **D7 Independent reporter:** Distinct account, one report per reporter per target, reporter account older than 24 hours, no self-report. Reports made before the last restriction start do not count again. [PROPOSED (needs group confirmation)]
- **D8 Account deletion:** Deactivate and anonymise name, email, phone. Messages and reports remain, shown as 'Deleted user'. [PROPOSED (needs group confirmation)]
- **D9 Assumptions not in the PRD:** Units 1–6, chat message max 1000 characters, notification polling every 15 seconds. [PROPOSED (needs group confirmation)]
