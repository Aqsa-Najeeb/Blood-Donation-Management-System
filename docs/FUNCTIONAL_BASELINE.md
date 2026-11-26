# LIFE LINK — Functional Baseline from Current Session

## Scope
A registered account may act as donor and requester. The application is an English-language modular monolith for local demonstration.

## Accounts
- Email/password login; securely hashed passwords.
- No OTP or CNIC verification.
- One account supports donor and requester activity.
- Users edit their own profiles and declared blood group.
- Blood group is user-declared and unverified.
- Account deletion can be requested; retention rules remain open.

## Donor availability/search
- Manual availability control; new donors start Unavailable.
- Show Available and Unavailable donors with clear status.
- Filters: blood group and location.
- Availability does not change automatically after responding.

## Emergency requests
- Fields: blood group, hospital/location, required units, contact details, urgency.
- Maximum three active requests per user.
- Multiple donors can respond; requester can accept multiple.
- Requester contact details disclosed only after acceptance of that donor's response.
- Users can cancel own requests; requester manually closes own requests.
- Status set selected in session: Open/Closed.
- Matching declared blood-group users can view requests; owner retains access.
- Approximate location only.
- Existing PRD expiry at 11:59 PM PKT remains unless formally changed; reconcile it with Open/Closed and closure outcomes before implementation.

## Chat
- General chat for registered users; both donor/requester can initiate.
- One pending invitation per pair; no automatic invitation expiry.
- Accept/Reject/Restrict actions.
- 24-hour retry after rejection.
- Restrict contact blocks messages/invitations between pair, not the accounts.
- Recipient can remove restriction; old messages remain.
- Profile remains visible; messages cannot be deleted; history participant-only.
- Text only; no media/voice; report from chat; no chat notifications.
- Conversation grouping remains open.

## Notifications
In-app only, no history page. Notify for relevant emergency requests, responses to own requests and request status changes. No chat event notifications.

## Reporting
Three independent reports trigger a selected seven-day precautionary restriction on creating new emergency requests only. Other account functions remain available. Restriction record stores reason/start/expiry privately; reporter identity remains private. No admin review and no formal appeal. A report count is not proof. Define independence, deduplication and anti-abuse safeguards before implementation.
