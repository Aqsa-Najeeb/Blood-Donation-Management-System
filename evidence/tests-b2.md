# Slice B2 — Test Evidence (`evidence/tests-b2.md`)

**Command run:** `npm.cmd run test:all` (`node tests/smoke.js && node --test --test-concurrency=1 tests/a1.test.js tests/a2.test.js tests/a3.test.js tests/b1.test.js tests/b2.test.js`) against real MySQL test database (`lifelink_test`).  
**Result:** Smoke checks passed (`28 files, 27 SVG assets, 14 routes, 7 Postman folders`); `65/65` tests passed (`36` A1 + `9` A2 + `8` A3 + `7` B1 + `5` B2, `0` failed, `0` skipped).

| Slice/Requirement | Test type | Input/Condition | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|
| B2 / FR-10, BR-13 Non-notified & closed guards | Security & Negative | Unnotified donor calls `PATCH /api/requests/:id/respond`; notified donor responds after request `CLOSED` | Unnotified `403`; closed request `409` | `403` and `409` | Pass |
| B2 / FR-10, BR-13 Response changes & notify | Functional | Donor toggles `ACCEPTED` -> `DECLINED` -> `ACCEPTED` while `OPEN` | Latest `donorResponse` persisted and returned; `notify()` called for requester | All transitions succeeded; `DONOR_RESPONDED` fired | Pass |
| B2 / D3 Decision guards | Negative & Security | Owner tries to `APPROVED` a `PENDING` or `DECLINED` response; non-owner tries to `APPROVED` an `ACCEPTED` response | `400` for `PENDING`/`DECLINED`; `403` for non-owner | `400` and `403` | Pass |
| B2 / D3 Contact visibility & reset | Security & Functional | `contactPhone` checked before approval, after `APPROVED` (for donor1 and donor2), and after donor1 switches to `DECLINED` | Absent before approval; visible to donor1 after approval; absent for donor2; `requesterDecision` resets to `NONE` and `contactPhone` absent again after `DECLINED`; `notify()` called for donor | All assertions passed | Pass |
| B2 / BR-14, BR-24 Multiple approvals & closed readability | Functional & Privacy | Two donors `ACCEPTED` and both `APPROVED`; request closed in DB; owner reads `GET /api/requests/:id/responses` | Request stays `OPEN` with 2 `APPROVED` donors; no donor `phone` field exposed; responses remain readable after `CLOSED` | All assertions passed | Pass |
| Smoke + A1 + A2 + A3 + B1 regression | Regression | `npm.cmd run test:all` | Smoke + all 60 earlier tests pass | Passed (60/60 + smoke) | Pass |
