# Slice A3 — Test Evidence (`evidence/tests-a3.md`)

**Command run:** `npm.cmd run test:all` (`node tests/smoke.js && node --test --test-concurrency=1 tests/a1.test.js tests/a2.test.js tests/a3.test.js`) against real MySQL test database (`lifelink_test`).  
**Result:** Smoke checks passed (`28 files, 27 SVG assets, 14 routes, 7 Postman folders`); `53/53` tests passed (`36` A1 + `9` A2 + `8` A3, `0` failed, `0` skipped).

| Slice/Requirement | Test type | Input/Condition | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|
| A3 / FR-05 Auth required | Security / Negative | `GET /api/donors` without token | HTTP 401 | HTTP 401 | Pass |
| A3 / FR-05 Radius validation | Negative / BVA | `GET /api/donors?city=Lahore&area=Model%20Town&radius=7` | HTTP 400 (only 5/10/25/50 allowed) | HTTP 400 | Pass |
| A3 / BR-18 Radius inclusive BVA | Functional / BVA | `setDistanceOverride(10)` then `setDistanceOverride(10.1)` with `radius=10` | Included at `10`, excluded at `10.1` | Included at `10`, excluded at `10.1` | Pass |
| A3 / FR-06, BR-17 Freshness BVA | Functional / BVA | `lastAvailabilityUpdate` at `6d 23h`, `7d 0h`, `7d 1m` before `now()` | `6d 23h` & `7d 0h` Fresh; `7d 1m` `"May be outdated"`, visible, status unchanged | Matched expected | Pass |
| A3 / FR-05 Blood group EP | Functional & Negative / EP | All 8 valid groups, none selected, invalid `"Z+"` | HTTP 200 for valid/none; HTTP 400 for `"Z+"` | HTTP 200 / HTTP 400 | Pass |
| A3 / BR-19 Ordering | Functional | Two donors at same distance, different `lastAvailabilityUpdate` | More recent `lastAvailabilityUpdate` first | Newer first | Pass |
| A3 / FR-07, BR-21 Privacy & Contact | Security & Functional | Search payload check; guest `POST /api/donors/:id/contact`; signed-in contact; deactivated donor contact | No `phone`/`email`/`passwordHash` in search; guest `401`; signed-in `200` with `phone`; deactivated `404` | All assertions passed | Pass |
| A3 / NFR-01 Performance | Performance | Seed 500 donors, `GET /api/donors?...&radius=25` | Response time `< 3000 ms` | `6.22 ms` (`62` donors returned) | Pass |
| A1 + A2 + Smoke regression | Regression | `node tests/smoke.js && node --test tests/a1.test.js tests/a2.test.js` | Smoke + all 45 earlier tests pass | Passed (45/45 + smoke) | Pass |
