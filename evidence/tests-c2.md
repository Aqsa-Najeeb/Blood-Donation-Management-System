# Slice C2 — Chat: Test Evidence

**Date:** 2026-11-27  
**Commit (pre):** `2b74df2` — C1 notifications  
**Runner:** `npm run test:all` (Node --test, concurrency=1)  
**Result:** ✅ 84 / 84 pass, 0 fail

---

## C2 Test Results

```
▶ Slice C2 — Invitation guards
  ✔ self-invite is rejected with 400 (373.0523ms)
  ✔ invite to deactivated user is rejected with 400 (379.2819ms)
  ✔ second pending invite in the same direction is rejected with 409 (581.0993ms)
  ✔ second pending invite in the reverse direction is also rejected with 409 (570.375ms)
  ✔ BVA reject wait: 23h59m blocked (409), 24h00m allowed (201) (606.8198ms)
✔ Slice C2 — Invitation guards (2548.8049ms)
▶ Slice C2 — Non-participant access
  ✔ non-participant GET history returns 403 (793.4487ms)
  ✔ non-participant POST message returns 403 (733.1594ms)
✔ Slice C2 — Non-participant access (1526.9968ms)
▶ Slice C2 — Message BVA
  ✔ BVA message length: 0 → 400; 1 → 201; 1000 → 201; 1001 → 400; whitespace-only → 400 (515.9879ms)
✔ Slice C2 — Message BVA (516.2489ms)
▶ Slice C2 — Restriction rules
  ✔ restricted pair: messages blocked (409), new invites blocked (409), history readable by both (528.1477ms)
  ✔ non-restrictor (A) cannot remove B's restriction (403); B (restrictor) can remove it (496.1581ms)
  ✔ after restriction removed, messaging stays blocked (requiresReinvite); new invite + accept unblocks it (540.1738ms)
✔ Slice C2 — Restriction rules (1564.7962ms)
```

---

## Prior Slices — All Still Green

- Smoke checks: 28 files, 27 SVG assets, 14 routes, 7 Postman folders ✔
- A1: 36 tests ✔
- A2: 9 tests ✔
- A3: 8 tests ✔ (NFR-01 500 donors = 10.27 ms)
- B1: 7 tests ✔
- B2: 5 tests ✔
- B3: 5 tests ✔
- C1: 3 tests ✔

---

## Full Run Summary

```
ℹ tests 84
ℹ suites 30
ℹ pass 84
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 26626.8521
```
