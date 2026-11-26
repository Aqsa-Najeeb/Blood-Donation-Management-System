# Slice A2 — Test Evidence (`evidence/tests-a2.md`)

**Command run:** `npm.cmd run test:all` (`node tests/smoke.js && node --test tests/a1.test.js tests/a2.test.js`) against real MySQL test database (`lifelink_test`).  
**Result:** Smoke checks passed (`28 files, 27 SVG assets, 14 routes, 7 Postman folders`); `45/45` tests passed (`36` A1 + `9` A2, `0` failed, `0` skipped).

| Slice/Requirement | Test type | Input/Condition | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|
| A2 / FR-03 Enable donor mode | Functional | `PUT /api/settings` with `{ isDonor: true, available: true }` on non-donor | `isDonor: true`, `available: false` (new donors start Unavailable) | `isDonor: true`, `available: false` | Pass |
| A2 / FR-03 Required profile fields | Negative | `PUT /api/profile` with blank `name`, `bloodGroup`, `city`, `area`, or `phone` | HTTP 400 for each blank field | HTTP 400 for all 5 | Pass |
| A2 / FR-03 Phone validation | Negative | `PUT /api/profile` with `phone: "123"` | HTTP 400 | HTTP 400 | Pass |
| A2 / FR-03 Blood group validation | Negative | `PUT /api/profile` with `bloodGroup: "X+"` | HTTP 400 | HTTP 400 | Pass |
| A2 / FR-03 Own profile edit | Functional | `PUT /api/profile/:id` by owner updating `name`, `bloodGroup`, `area`, `phone` | HTTP 200 with updated fields | HTTP 200, fields updated | Pass |
| A2 / BR-07 Ownership check | Security / Negative | User A calls `PUT /api/profile/:id` for User B's `id` | HTTP 403 Forbidden | HTTP 403 | Pass |
| A2 / FR-03 System-managed timestamp | Security / Negative | Client sends `lastAvailabilityUpdate` to `PUT /api/profile` or `PATCH /api/donor/availability` | HTTP 403 Forbidden | HTTP 403 on both | Pass |
| A2 / FR-04 Availability toggle & same-status no-op | Functional / Clock | Toggle `false -> true` (`t1`), `true -> true` (`t2`), `true -> false` (`t3`) | `t1` recorded; `t2` no-op (`t1` kept); `t3` recorded | Matched expected timestamps | Pass |
| A2 / D8 Account deletion | Functional / Security | `DELETE /api/settings/account`, then login, search `GET /api/donors`, detail `GET /api/donors/:id`, check `SafetyReport` | `deactivatedAt` set, anonymised name `"Deleted user"`, login `401`, excluded from search, report preserved | All assertions passed | Pass |
| A1 + Smoke regression | Regression | `node tests/smoke.js && node --test tests/a1.test.js` | Smoke + all 36 A1 tests pass | Passed (36/36 + smoke) | Pass |
