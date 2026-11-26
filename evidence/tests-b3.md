# Slice B3 — Test Evidence (`evidence/tests-b3.md`)

**Command run:** `npm.cmd run test:all` (`node tests/smoke.js && node --test --test-concurrency=1 tests/a1.test.js tests/a2.test.js tests/a3.test.js tests/b1.test.js tests/b2.test.js tests/b3.test.js`) against real MySQL test database (`lifelink_test`).  
**Result:** Smoke checks passed (`28 files, 27 SVG assets, 14 routes, 7 Postman folders`); `70/70` tests passed (`36` A1 + `9` A2 + `8` A3 + `7` B1 + `5` B2 + `5` B3, `0` failed, `0` skipped).

| Slice/Requirement | Test type | Input/Condition | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|
| B3 / FR-18, BR-12, BR-23, D2 Expiry BVA | Functional / BVA | `setNow` at `2026-11-27T18:58:59.000Z` (`23:58:59 PKT`) and `2026-11-27T18:59:00.000Z` (`23:59:00 PKT`) | `23:58:59 PKT` stays `OPEN`; `23:59:00 PKT` (`18:59:00 UTC`) becomes `CLOSED` (`EXPIRED`) and notifies owner + donors without contact details | All assertions passed | Pass |
| B3 / D2 Expiry Idempotency | Functional | Run `expireDueRequests(prisma)` twice at `18:59:00 UTC` with 2 notified donors | First run expires 1 request and notifies owner + 2 donors once each; second run expires 0 and sends 0 notifications | `firstCount=1`, `secondCount=0`, 1 notification per recipient | Pass |
| B3 / FR-12, BR-10 Cancel Guards | Security & Negative | Non-owner cancel; owner cancel; cancel twice; cancel after expiry | Non-owner `403`; owner `200` (`CLOSED`/`CANCELLED`) + 1 notification per donor without contact; repeat cancel `409`; cancel after expiry `409` | `403`, `200`, `409`, `409` | Pass |
| B3 / BR-13, BR-24 Post-Cancel State | Functional & Negative | Donor attempts response change after cancel; owner reads `/responses` | Donor response change returns `409`; owner still sees all prior responses | `409` and `200` (2 responses preserved) | Pass |
| B3 / D2 Fulfil | Functional & Security | Non-owner fulfil; owner fulfil; fulfil twice | Non-owner `403`; owner `200` (`CLOSED`/`FULFILLED`) + 1 notification per donor without contact; repeat fulfil `409` | `403`, `200`, `409` | Pass |
| Smoke + A1–B2 regression | Regression | `npm.cmd run test:all` | Smoke + all 65 earlier tests pass | Passed (65/65 + smoke) | Pass |
