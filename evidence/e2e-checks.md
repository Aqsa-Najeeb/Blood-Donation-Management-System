# Slice A7 — End-to-End Verification Against Real MySQL (`lifelink_db`)

**Date:** 2026-11-27  
**Environment:** Express app (`backend/app.js`) + Prisma + MySQL 8.4 (`lifelink_db`)  
**Result:** ✅ All 6 end-to-end flows (a–f) passed

---

## Clean Clone Setup Verification (README Steps)

Executed in a fresh `git clone` directory (`%TEMP%\lifelink-clean-check`):
1. `Copy-Item .env.example .env`
2. `npm install` → 206 packages installed
3. `npx prisma db push` → schema synced + Prisma Client generated
4. `npm run db:seed` → 8 seeded users created cleanly (after fixing `prisma/seed.js` cleanup order for C2/C3 tables)
5. `node server.js` → `GET http://localhost:3000/api/health` returned `{"status":"ok","database":"mysql-connected","timestamp":"2026-11-27T14:24:04.463Z"}`

---

## E2E Flow Results (`lifelink_db`)

### a) Registration, Donor Mode, Search, and Contact
- Registered User A (`O+`, Lahore / Model Town) → `201`
- Registered User B (`O+`, Lahore / Gulberg III) → `201`
- User B enabled donor mode (`PUT /api/settings` `{ isDonor: true }`) → `isDonor: true`
- User B set availability (`PATCH /api/donor/availability` `{ available: true }`) → `available: true`
- User A searched (`GET /api/donors?bloodGroup=O%2B&city=Lahore&area=Model%20Town&radius=10`) → `200`, found User B (`id: 50`, `distance: 4`, `freshness: "Fresh"`)
- User A clicked Contact (`POST /api/donors/50/contact`) → `200`, returned `+92 300 2222222`

### b) Emergency Request, Notification, Response, Approval, Contact Reveal, and Fulfilment
- User A created request (`POST /api/requests`, `O+`, `2026-11-27`, 2 units, `URGENT`) → `201`, code `BR-E6F98E`
- User B checked unread notifications (`GET /api/notifications`) → `["REQUEST_MATCH"]`
- User B responded `ACCEPTED` (`PATCH /api/requests/:id/respond`) → `200`, `donorResponse: "ACCEPTED"`
- User A approved User B (`PATCH /api/requests/:id/decide/:respId`) → `200`, `requesterDecision: "APPROVED"`
- User B read request detail (`GET /api/requests/:id`) → `200`, `contactPhone: "+92 300 1111111"` revealed
- User A marked request fulfilled (`POST /api/requests/:id/fulfil`) → `200`, `closureReason: "FULFILLED"`
- User B checked notifications (`GET /api/notifications`) → `["REQUEST_CLOSED", "RESPONSE_DECISION", "REQUEST_MATCH"]`

### c) Pair-Based Chat, Messaging, and Restriction
- User A invited User B (`POST /api/chats/invitations`) → `201`
- User B accepted (`PATCH /api/chats/invitations/:id`, `ACCEPT`) → `200`, `conversation.id: 1`
- User A sent message → `201`; User B replied → `201`
- User B restricted conversation (`PATCH /api/chats/1/restrict`, `apply`) → `200`
- User A attempted to send message while restricted → `409` (blocked)

### d) Reporting Safeguard (3 Reports >24h Account Age)
- 3 distinct accounts older than 24h reported User A (`POST /api/reports`):
  - Report 1 → `201`, `autoRestricted: false`
  - Report 2 → `201`, `autoRestricted: false`
  - Report 3 → `201`, `autoRestricted: true`
- User A attempted to create a `STANDARD` request → `403`: `"A precautionary restriction is active until 2026-12-04T14:25:49.895Z (not a verified finding). You cannot create new emergency requests while it is active."`
- User A searched donors while restricted → `200` (allowed)

### e) Blood-Group Visibility Isolation
- User C (`A+`) attempted `GET /api/requests/:id` for User B's `O+` request → `404`
- User C's `GET /api/requests` list → `cListContainsRequest: false`

### f) Request Expiry Past Required Date
- Request created for `requiredDate: "2026-11-27"`
- Clock advanced past 11:59 PM PKT (`2026-11-27T19:00:00.000Z`, i.e., `2026-11-28 00:00:00 PKT`)
- Reading `GET /api/requests/:id` → `200`, `status: "CLOSED"`, `closureReason: "EXPIRED"`
