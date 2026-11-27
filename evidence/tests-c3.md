# Slice C3 — Reporting Safeguard: Test Evidence

**Date:** 2026-11-27  
**Commit (pre):** `8c2179b` — C2 chat  
**Runner:** `npm run test:all` (Node --test, concurrency=1)  
**Result:** ✅ 90 / 90 pass, 0 fail

---

## C3 Test Results

```
▶ Slice C3 — Independent reporter rules & BVA threshold (FR-14, FR-15, D7)
  ✔ BVA reports: 2 gives no restriction; 3 creates RestrictionRecord (+7d); 4th leaves expiresAt unchanged (1211.0771ms)
  ✔ rejects duplicate report (409), reporter younger than 24h (403), and self-report (400) (671.7664ms)
  ✔ rejects client-supplied reporterId, count, or expiresAt with 403 and never returns reporterId (462.7798ms)
✔ Slice C3 — Independent reporter rules & BVA threshold (FR-14, FR-15, D7) (2393.095ms)
▶ Slice C3 — Restriction enforcement, BVA expiry & allowed actions
  ✔ blocks restricted user from creating STANDARD, URGENT, and EMERGENCY requests with expiry and precautionary wording (915.2742ms)
  ✔ BVA expiry: still restricted at 6d 23h59m, allowed at 7d 00h00m (949.8415ms)
  ✔ restricted user can still search donors, respond to requests, chat, and edit profile (1269.2878ms)
✔ Slice C3 — Restriction enforcement, BVA expiry & allowed actions (3135.0105ms)
```

---

## Prior Slices — All Still Green

- Smoke checks: 28 files, 27 SVG assets, 14 routes, 7 Postman folders ✔
- A1: 36 tests ✔
- A2: 9 tests ✔
- A3: 8 tests ✔ (NFR-01 500 donors = 12.52 ms)
- B1: 7 tests ✔
- B2: 5 tests ✔
- B3: 5 tests ✔
- C1: 3 tests ✔
- C2: 11 tests ✔

---

## Full Run Summary

```
ℹ tests 90
ℹ suites 32
ℹ pass 90
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 32710.4853
```
