# LIFE LINK — Workflow Evidence Log

| Slice | Requirements | Lead member | Acceptance criteria | Mode HITL/AFK | AI chat reference | Iterations | Test result | Human decision | Major issue | Plan version | Integration status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 Foundation, cleanup, sign-in | FR-01, FR-02 | Member 1 | Single account model, no CNIC/verification, bcrypt hashing, rate limiting | HITL | Current session | 2 | `npm.cmd run test:all`: smoke.js passed; 36/36 in tests/a1.test.js passed (`lifelink_test`) | | Legacy `tests/api.test.js` still targets old prototype schema (`role`/`newsletter`) | v02 | Implemented (pending human review) |
| A2 Profile and availability | FR-03, FR-04 | Member 2 | Unavailable default, manual toggle, unverified blood group, account deactivation/anonymization | HITL | Current session | 1 | `npm.cmd run test:all`: smoke.js passed; 45/45 passed (36 A1 + 9 A2 on `lifelink_test`) | | None | v02 | Implemented (pending human review) |
| A3 Search, ordering, freshness, contact | FR-05, FR-06, FR-07 | Member 3 | Haversine distance, no stored distanceKm, show both availability states, privacy shielding | HITL | Current session | 1 | `npm.cmd run test:all`: smoke.js passed; 53/53 passed (36 A1 + 9 A2 + 8 A3; NFR-01 500 donors = 6.22 ms) | | None | v02 | Implemented (pending human review) |
| B1 Create request and visibility | FR-08 | Member 1 | D1 fields, units 1–6, max 3 active requests, blood-group matching visibility | | | | | | | v02 | Planned |
| B2 Donor responses and requester decisions | FR-10, FR-11 | Member 2 | Pending/Accepted/Declined responses, None/Approved/Rejected decisions, phone revealed only upon approval | | | | | | | v02 | Planned |
| B3 Cancel, fulfil, expire | FR-12, FR-18 | Member 3 | Open/Closed status, closureReason FULFILLED/CANCELLED/EXPIRED, 11:59 PM PKT expiry (sweep + read check) | | | | | | | v02 | Planned |
| C1 Notifications | FR-09 | Member 1 | In-app alerts for relevant requests and status updates, 15s polling, no chat alerts | | | | | | | v02 | Planned |
| C2 Chat | FR-13 | Member 2 | General platform chat per pair, invitation flow (Accept/Reject/Restrict), max 1000 chars | | | | | | | v02 | Planned |
| C3 Reporting safeguard | FR-14, FR-15 | Member 3 | 3 independent reports, 24h reporter age, 7-day restriction on creating emergency requests, no admin UI | | | | | | | v02 | Planned |
| A7 Integration and final validation | All PRD & ASRs | Member 1, 2, 3 | End-to-end user journeys pass, zero console/runtime errors, all tests pass | | | | | | | v02 | Planned |
