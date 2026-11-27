# Slice C1 — Notifications: Test Evidence

**Date:** 2026-11-27  
**Commit (pre):** `012a6d7` — B3 lifecycle  
**Runner:** `npm run test:all` (Node --test, concurrency=1)  
**Result:** ✅ 73 / 73 pass, 0 fail

---

## C1 Test Results

```
▶ Slice C1 — Notification allow-list, deduplication & unread-only scoping (FR-09, ADR-08, ADR-10)
  ✔ rejects disallowed notification types (e.g. chat types) and stores duplicates only once (191.5258ms)
  ✔ user sees only own unread notifications; marking read clears them and does not affect others (265.0901ms)
  ✔ B1–B3 end-to-end: create, respond, approve, and cancel create expected notifications for the right users only without contact details (509.7846ms)
✔ Slice C1 — Notification allow-list, deduplication & unread-only scoping (FR-09, ADR-08, ADR-10) (1000.8505ms)
```

---

## Prior Slices — All Still Green

```
▶ POST /api/auth/register — password BVA                       ✔ 6 tests
▶ POST /api/auth/register — required fields                    ✔ 11 tests
▶ POST /api/auth/register — schema & role rules                ✔ 4 tests
▶ POST /api/auth/login                                         ✔ 4 tests
▶ GET /api/auth/me — auth required                             ✔ 3 tests
▶ backend/utils/clock.js                                       ✔ 2 tests
▶ backend/utils/distance.js                                    ✔ 3 tests
▶ backend/modules/notifications.js                             ✔ 1 test
▶ backend/modules/restrictions.js stub                         ✔ 1 test
▶ Slice A2 — Donor mode & profile editing                      ✔ 7 tests
▶ Slice A2 — Availability toggle & lastAvailabilityUpdate      ✔ 1 test
▶ Slice A2 — Account deletion & anonymisation                  ✔ 1 test
▶ Slice A3 — Auth & Radius BVA                                 ✔ 3 tests
▶ Slice A3 — Freshness BVA & Availability visibility           ✔ 1 test
▶ Slice A3 — Blood group EP & Ordering                         ✔ 2 tests
▶ Slice A3 — Privacy & Contact                                 ✔ 1 test
▶ Slice A3 — Performance NFR-01 (500 donors < 3s)              ✔ 1 test
▶ Slice B1 — Validation BVA                                    ✔ 3 tests
▶ Slice B1 — Active request limit BVA & Restrictions           ✔ 2 tests
▶ Slice B1 — Visibility (D4)                                   ✔ 1 test
▶ Slice B1 — Matching                                          ✔ 1 test
▶ Slice B2 — Donor responses & guards                          ✔ 2 tests
▶ Slice B2 — Requester decisions, contact visibility           ✔ 3 tests
▶ Slice B3 — Expiry BVA & Idempotency                          ✔ 2 tests
▶ Slice B3 — Cancel, Fulfil & Post-Closure Guards              ✔ 3 tests
```

---

## Acceptance Criteria Coverage

| Criterion | Test |
|---|---|
| `notify()` rejects disallowed type (e.g. `CHAT_MESSAGE`) | test 1 |
| Duplicate `(userId, type, reference)` stored once | test 1 |
| `GET /api/notifications` returns only caller's UNREAD items | test 2 |
| `POST /api/notifications/read` marks only caller's as read | test 2 |
| Marking read does not affect another user's notifications | test 2 |
| Read item does not reappear in unread list | test 2 |
| Creating a request triggers `REQUEST_MATCH` for matched donors | test 3 |
| Donor response triggers `RESPONSE_RECEIVED` for requester | test 3 |
| Approval triggers `RESPONSE_DECISION` for donor | test 3 |
| Cancel triggers `REQUEST_CLOSED` for each notified donor | test 3 |
| Notification text contains no contact details (phone absent) | test 3 |
| Notifications scoped to right users only | test 3 |
| Notification type allow-list: `REQUEST_MATCH`, `RESPONSE_RECEIVED`, `RESPONSE_DECISION`, `REQUEST_CLOSED` | test 1, 3 |

---

## Full Run Summary

```
ℹ tests 73
ℹ suites 26
ℹ pass 73
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 23965.2747
```
