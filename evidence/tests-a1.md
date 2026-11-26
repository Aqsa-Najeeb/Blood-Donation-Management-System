# Slice A1 — Test Evidence (`evidence/tests-a1.md`)

**Command run:** `npm.cmd run test:all` (`node tests/smoke.js && node --test tests/a1.test.js`) against real MySQL test database (`lifelink_test`).  
**Result:** Smoke checks passed (`28 files, 27 SVG assets, 14 routes, 7 Postman folders`); `36/36` tests passed in `tests/a1.test.js` (`0` failed, `0` skipped).

| Slice/Requirement | Test type | Input/Condition | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|
| A1 / FR-01 Password BVA | Negative / BVA | Password length 7 (`"Abc123x"`) | HTTP 400 with `8-128` error | HTTP 400 | Pass |
| A1 / FR-01 Password BVA | Functional / BVA | Password length 8 (`"Abcde1fg"`) | HTTP 201 + JWT token | HTTP 201 + token | Pass |
| A1 / FR-01 Password BVA | Functional / BVA | Password length 128 (`"A1" + "b"*126`) | HTTP 201 + JWT token | HTTP 201 + token | Pass |
| A1 / FR-01 Password BVA | Negative / BVA | Password length 129 (`"A1" + "b"*127`) | HTTP 400 with `8-128` error | HTTP 400 | Pass |
| A1 / FR-01 Password composition | Negative / EP | Password with no digit (`"OnlyLetters"`) | HTTP 400 requiring letter + number | HTTP 400 | Pass |
| A1 / FR-01 Password composition | Negative / EP | Password with no letter (`"12345678"`) | HTTP 400 requiring letter + number | HTTP 400 | Pass |
| A1 / FR-01 Required fields | Negative | Missing `name` | HTTP 400 | HTTP 400 | Pass |
| A1 / FR-01 Required fields | Negative | Missing `email` | HTTP 400 | HTTP 400 | Pass |
| A1 / FR-01 Required fields | Negative | Missing `password` | HTTP 400 | HTTP 400 | Pass |
| A1 / FR-01 Required fields | Negative | Missing `phone` | HTTP 400 | HTTP 400 | Pass |
| A1 / FR-01 Required fields | Negative | Missing `bloodGroup` | HTTP 400 | HTTP 400 | Pass |
| A1 / FR-01 Required fields | Negative | Missing `city` | HTTP 400 | HTTP 400 | Pass |
| A1 / FR-01 Required fields | Negative | Missing `area` | HTTP 400 | HTTP 400 | Pass |
| A1 / FR-01 Email validation | Negative / EP | Email without `@` (`"notanemail"`) | HTTP 400 | HTTP 400 | Pass |
| A1 / FR-01 Email validation | Negative / EP | Email without domain (`"user@"`) | HTTP 400 | HTTP 400 | Pass |
| A1 / FR-01 Blood group validation | Negative / EP | Invalid blood group (`"Z+"`) | HTTP 400 | HTTP 400 | Pass |
| A1 / FR-01 Phone validation | Negative / EP | Invalid phone (`"123"`) | HTTP 400 | HTTP 400 | Pass |
| A1 / FR-01 Duplicate email | Negative | Registering same email twice | HTTP 409 `"already exists"` | HTTP 409 | Pass |
| A1 / BR-08 Single account model | Functional | Register normally | `isDonor === false` by default | `isDonor === false` | Pass |
| A1 / Cleanup role removal | Negative / Security | Register with `role: "COORDINATOR"` | Ignored, `isDonor === false`, no role returned | HTTP 201, `isDonor === false`, no role | Pass |
| A1 / Cleanup CNIC & hash | Security | Register and inspect returned user | No `passwordHash` or `cnic` exposed | Both absent | Pass |
| A1 / FR-01 Blood groups | Functional / EP | All 8 valid blood groups (`A+`..`O-`) | HTTP 201 for each | HTTP 201 for all 8 | Pass |
| A1 / FR-02 Sign-in | Functional | Valid email + password | HTTP 200 + token + user | HTTP 200 | Pass |
| A1 / FR-02 Sign-in | Negative | Wrong password | HTTP 401 | HTTP 401 | Pass |
| A1 / FR-02 Sign-in | Negative | Non-existent email | HTTP 401 | HTTP 401 | Pass |
| A1 / FR-02 Brute-force lock | Negative / Security | 5 consecutive failed logins, then 6th attempt | HTTP 429 locked message | HTTP 429 locked | Pass |
| A1 / FR-02 Protected route | Negative / Security | `GET /api/auth/me` with no token | HTTP 401 | HTTP 401 | Pass |
| A1 / FR-02 Protected route | Negative / Security | `GET /api/auth/me` with invalid token | HTTP 401 | HTTP 401 | Pass |
| A1 / FR-02 Protected route | Functional | `GET /api/auth/me` with valid token | HTTP 200 + user | HTTP 200 | Pass |
| A1 / Foundation `clock.js` | Unit | `now()` default & `setNow()` override | Returns real time / fixed override | Matched expected | Pass |
| A1 / Foundation `distance.js` | Unit | Haversine distance & `setDistanceOverride()` | Valid km / 0 for same point / override | Matched expected | Pass |
| A1 / Foundation `notifications.js` | Unit | `notify()` stub | Resolves without throwing | Resolved | Pass |
| A1 / Foundation `restrictions.js` | Unit | `isRestricted()` stub | Returns `false` | Returned `false` | Pass |
| A1 / Smoke checks | Structural | `node tests/smoke.js` | All 28 files, 27 SVGs, 14 routes, 7 Postman folders | Passed | Pass |
