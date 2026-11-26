# Slice B1 — Test Evidence (`evidence/tests-b1.md`)

**Command run:** `npm.cmd run test:all` (`node tests/smoke.js && node --test --test-concurrency=1 tests/a1.test.js tests/a2.test.js tests/a3.test.js tests/b1.test.js`) against real MySQL test database (`lifelink_test`).  
**Result:** Smoke checks passed (`28 files, 27 SVG assets, 14 routes, 7 Postman folders`); `60/60` tests passed (`36` A1 + `9` A2 + `8` A3 + `7` B1, `0` failed, `0` skipped).

| Slice/Requirement | Test type | Input/Condition | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|
| B1 / FR-08 `requiredDate` BVA | Negative & Functional / BVA | PKT `2026-11-26` (yesterday), `2026-11-27` (today), `2026-11-28` (tomorrow) | Yesterday `400`; today & tomorrow `201` with `status: OPEN`, `closureReason: null` | Yesterday `400`; today/tomorrow `201` | Pass |
| B1 / D1, D9 `units` BVA | Negative & Functional / BVA | `units = 0, 1, 6, 7` | `0` & `7` return `400`; `1` & `6` return `201` | `400` / `201` as expected | Pass |
| B1 / D1 Radius & required fields | Negative | `radius = 7`; each of 9 required fields omitted | HTTP `400` for `radius=7` and every missing field | HTTP `400` for all | Pass |
| B1 / Active requests BVA | Functional & Negative / BVA | Create 3rd `OPEN`, 4th `OPEN`, close 1st in DB (`CLOSED`), create 5th | 3rd `201`, 4th `400`, 5th `201` | `201`, `400`, `201` | Pass |
| B1 / Restriction safeguard | Security / Negative | `setRestrictionOverride(true)` across `STANDARD`, `URGENT`, `EMERGENCY` | HTTP `403` for all 3 urgencies | HTTP `403` for all 3 | Pass |
| B1 / D4 Visibility | Security & Functional | Owner, same blood group, different blood group, guest on `GET /api/requests` and `/:id` | Guest `401`, different BG `404`, owner & same BG `200` (`contactPhone` hidden from non-owner) | All assertions passed | Pass |
| B1 / FR-09, BR-09, BR-18 Matching | Functional / BVA | Exact radius (`5` km), outside (`5.1` km), `Unavailable`, owner, different blood group | `PENDING` `RequestResponse` for exact match only; others excluded | All assertions passed | Pass |
| Smoke + A1 + A2 + A3 regression | Regression | `npm.cmd run test:all` | Smoke + all 53 earlier tests pass | Passed (53/53 + smoke) | Pass |
