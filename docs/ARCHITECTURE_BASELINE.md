# LIFE LINK — Architecture Baseline

- Architecture: modular monolith.
- Database: one shared database.
- Ownership: each module manages its own records.
- API: REST.
- Authorization: cross-cutting.
- UI: presentation layer.
- Deployment target: local demo.
- Language: English.
- External integrations: none for SMS/email; no OTP/CNIC verification.
- No Administration module.

## Eight logical modules
1. Authentication
2. Donor Management
3. Donor Search
4. Location Matching
5. Emergency Requests
6. Request Lifecycle
7. Notifications
8. Chat

Exact table/entity ownership and REST interface contracts must be documented before implementation; they are not invented here.

## Access boundaries
- Users manage their own profiles and requests.
- Donors manage their own availability.
- Contact details are disclosed only after requester accepts the relevant donor response.
- Request visibility is limited to registered users with matching declared blood group; owner retains access.
- Chat history is visible only to the two participants.
- Reporter identity and restriction records are private.
- A reporting restriction blocks only new emergency-request creation for seven days.

## Open architecture details
- Report independence/deduplication and abuse safeguards.
- Request status and closure outcome mapping.
- Donor response transitions.
- Chat grouping.
- Account deletion/retention.
- Notification persistence/delivery semantics.
