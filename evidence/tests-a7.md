# Slice A7 — Full Test Suite Output (Gate 5)

**Date:** 2026-11-27  
**Runner:** `npm run test:all`  
**Result:** 90 / 90 pass, 0 fail

```text
Command exited with code 0.

Command output:

> blood-donation-management-system@1.0.0 test:all
> node tests/smoke.js && node --test --test-concurrency=1 tests/a1.test.js tests/a2.test.js tests/a3.test.js tests/b1.test.js tests/b2.test.js tests/b3.test.js tests/c1.test.js tests/c2.test.js tests/c3.test.js

All checks passed: 28 files, 27 SVG assets, 14 routes, 7 Postman folders.
â–¶ POST /api/auth/register â€” password BVA
  âœ” rejects password of length 7 (too short) (39.7846ms)
  âœ” accepts password of exactly 8 characters (minimum valid) (91.4137ms)
  âœ” accepts password of exactly 128 characters (maximum valid) (79.1533ms)
  âœ” rejects password of length 129 (too long) (3.5817ms)
  âœ” rejects password with no digit (4.3494ms)
  âœ” rejects password with no letter (3.994ms)
âœ” POST /api/auth/register â€” password BVA (272.0303ms)
â–¶ POST /api/auth/register â€” required fields
  âœ” rejects when name is missing (4.1638ms)
  âœ” rejects when email is missing (3.5814ms)
  âœ” rejects when password is missing (4.7202ms)
  âœ” rejects when phone is missing (3.8294ms)
  âœ” rejects when bloodGroup is missing (2.956ms)
  âœ” rejects when city is missing (2.636ms)
  âœ” rejects when area is missing (2.6267ms)
  âœ” rejects invalid email format (no @) (3.9145ms)
  âœ” rejects invalid email format (no domain) (3.0313ms)
  âœ” rejects invalid blood group (2.8522ms)
  âœ” rejects invalid phone format (too short) (2.5791ms)
  âœ” rejects duplicate email (79.2367ms)
âœ” POST /api/auth/register â€” required fields (116.9178ms)
â–¶ POST /api/auth/register â€” schema & role rules
  âœ” new user has isDonor=false by default (80.9621ms)
  âœ” submitting role=COORDINATOR has no effect (78.6398ms)
  âœ” user response does not expose passwordHash or cnic (79.3198ms)
  âœ” all 8 blood groups accepted (617.7969ms)
âœ” POST /api/auth/register â€” schema & role rules (857.0003ms)
â–¶ POST /api/auth/login
  âœ” logs in successfully with correct credentials (77.9076ms)
  âœ” rejects wrong password (72.1428ms)
  âœ” rejects non-existent email (4.1433ms)
  âœ” locks account after 5 consecutive failed login attempts (433.3004ms)
âœ” POST /api/auth/login (664.2588ms)
â–¶ GET /api/auth/me â€” auth required
  âœ” returns 401 when no token is provided (4.8725ms)
  âœ” returns 401 with an invalid / tampered token (4.8177ms)
  âœ” returns user data with a valid token (84.3692ms)
âœ” GET /api/auth/me â€” auth required (94.3673ms)
â–¶ backend/utils/clock.js
  âœ” now() returns a Date close to real time by default (0.2134ms)
  âœ” setNow() overrides now() for testing (0.1262ms)
âœ” backend/utils/clock.js (0.4329ms)
â–¶ backend/utils/distance.js
  âœ” haversineDistance returns a number for two coordinates (0.5355ms)
  âœ” haversineDistance is ~0 for the same point (0.1032ms)
  âœ” setDistanceOverride allows injecting a fixed distance (0.1067ms)
âœ” backend/utils/distance.js (0.8316ms)
â–¶ backend/modules/notifications.js
  âœ” notify() persists allowed notification types without throwing (79.9193ms)
âœ” backend/modules/notifications.js (80.0493ms)
â–¶ backend/modules/restrictions.js stub
  âœ” isRestricted() always returns false (2.334ms)
âœ” backend/modules/restrictions.js stub (2.505ms)
â–¶ Slice A2 â€” Donor mode & profile editing (FR-03, BR-07)
  âœ” enabling donor mode sets isDonor=true and starts Unavailable (available=false) (137.1586ms)
  âœ” rejects blank required profile fields on PUT /api/profile (103.7445ms)
  âœ” rejects invalid phone on profile update (117.5519ms)
  âœ” rejects invalid blood group on profile update (86.6136ms)
  âœ” allows user to edit own profile including declared blood group (88.6622ms)
  âœ” returns 403 when User A tries to edit User B profile by id (159.7885ms)
  âœ” rejects client-supplied lastAvailabilityUpdate with 403 (91.0707ms)
âœ” Slice A2 â€” Donor mode & profile editing (FR-03, BR-07) (808.4357ms)
â–¶ Slice A2 â€” Availability toggle & lastAvailabilityUpdate (FR-04)
  âœ” toggling availability updates lastAvailabilityUpdate using clock.now(), and same-status is a no-op (108.794ms)
âœ” Slice A2 â€” Availability toggle & lastAvailabilityUpdate (FR-04) (109.0055ms)
â–¶ Slice A2 â€” Account deletion & anonymisation (D8)
  âœ” deactivates and anonymises user, blocks login (401), removes from search, and preserves reports as 'Deleted user' (225.9929ms)
âœ” Slice A2 â€” Account deletion & anonymisation (D8) (226.1529ms)
â–¶ Slice A3 â€” Auth & Radius BVA (FR-05, BR-18)
  âœ” requires sign-in for GET /api/donors (401 for guests) (6.2156ms)
  âœ” rejects invalid radius (e.g. 7 km) with 400 (6.7887ms)
  âœ” BVA radius: includes donor at exact radius (10 km) and excludes donor just outside (10.1 km) (84.1719ms)
âœ” Slice A3 â€” Auth & Radius BVA (FR-05, BR-18) (245.347ms)
â–¶ Slice A3 â€” Freshness BVA & Availability visibility (FR-06, BR-17, NFR-04)
  âœ” BVA freshness: 6d 23h is Fresh, 7d 0h is Fresh, 7d 1m is 'May be outdated' without hiding or changing status (223.568ms)
âœ” Slice A3 â€” Freshness BVA & Availability visibility (FR-06, BR-17, NFR-04) (223.7562ms)
â–¶ Slice A3 â€” Blood group EP & Ordering (FR-05, FR-06, BR-19)
  âœ” EP blood group: accepts all 8 valid groups, none selected, and rejects invalid group (43.2651ms)
  âœ” orders donors at the same distance by most recent lastAvailabilityUpdate first (150.3981ms)
âœ” Slice A3 â€” Blood group EP & Ordering (FR-05, FR-06, BR-19) (193.9076ms)
â–¶ Slice A3 â€” Privacy & Contact (FR-07, BR-21)
  âœ” never exposes phone, email, or passwordHash in search results; guest contact returns 401; signed-in contact returns phone; deactivated returns 404 (156.3991ms)
âœ” Slice A3 â€” Privacy & Contact (FR-07, BR-21) (156.5698ms)
NFR-01 500-donor search response time: 6.62 ms (returned 62 donors)
â–¶ Slice A3 â€” Performance NFR-01 (500 donors < 3s)
  âœ” returns search results for 500 seeded donors well under 3000ms (87.4594ms)
âœ” Slice A3 â€” Performance NFR-01 (500 donors < 3s) (87.5987ms)
â–¶ Slice B1 â€” Validation BVA (requiredDate, units, radius, required fields)
  âœ” BVA requiredDate in PKT: yesterday rejected (400), today and tomorrow accepted (201) (165.4121ms)
  âœ” BVA units: 0 and 7 rejected (400), 1 and 6 accepted (201) (120.4198ms)
  âœ” rejects radius 7 (400) and rejects each missing required field (400) (129.2708ms)
âœ” Slice B1 â€” Validation BVA (requiredDate, units, radius, required fields) (440.9696ms)
â–¶ Slice B1 â€” Active request limit BVA & Restrictions
  âœ” BVA active requests: 3rd allowed, 4th rejected, closing one in DB frees a slot (140.6666ms)
  âœ” blocks restricted user (isRestricted = true) with 403 for all 3 urgencies (88.4408ms)
âœ” Slice B1 â€” Active request limit BVA & Restrictions (229.4186ms)
â–¶ Slice B1 â€” Visibility (D4)
  âœ” owner and same blood group can view; different blood group gets 404; guest gets 401 (288.7368ms)
âœ” Slice B1 â€” Visibility (D4) (288.9232ms)
â–¶ Slice B1 â€” Matching (FR-09, BR-09, BR-18)
  âœ” creates PENDING RequestResponse for exact-radius match; excludes outside, Unavailable, owner, and different blood group (441.8218ms)
âœ” Slice B1 â€” Matching (FR-09, BR-09, BR-18) (441.9972ms)
â–¶ Slice B2 â€” Donor responses & guards
  âœ” non-notified donor gets 403; responding to closed request gets 409 (359.3375ms)
  âœ” allows changing response ACCEPTED -> DECLINED -> ACCEPTED while OPEN and notifies requester (258.0949ms)
âœ” Slice B2 â€” Donor responses & guards (641.153ms)
â–¶ Slice B2 â€” Requester decisions, contact visibility & closed readability
  âœ” rejects approving PENDING or DECLINED (400) and rejects non-owner approving (403) (335.9669ms)
  âœ” hides contact before approval, shows after approval, hides from other donors, and hides again if donor switches to DECLINED (454.7093ms)
  âœ” allows two approved donors at once while request stays OPEN, and responses remain readable by owner after close without donor phones (491.5913ms)
âœ” Slice B2 â€” Requester decisions, contact visibility & closed readability (1282.6685ms)
â–¶ Slice B3 â€” Expiry BVA & Idempotency (FR-18, BR-11, BR-12, BR-23, D2)
  âœ” BVA expiry: 23:58:59 PKT is OPEN; 23:59:00 PKT (18:59:00 UTC) is EXPIRED (277.287ms)
  âœ” running expireDueRequests twice sends notifications only once (305.1443ms)
âœ” Slice B3 â€” Expiry BVA & Idempotency (FR-18, BR-11, BR-12, BR-23, D2) (606.5095ms)
â–¶ Slice B3 â€” Cancel, Fulfil & Post-Closure Guards (FR-12, BR-10, D2)
  âœ” non-owner cancel gets 403; cancel twice gets 409; cancel after expiry gets 409 (276.0361ms)
  âœ” after cancel, donor response change gets 409 and old responses remain readable by owner (340.5385ms)
  âœ” owner can mark OPEN request as FULFILLED and notifies each previously notified donor once (318.3736ms)
âœ” Slice B3 â€” Cancel, Fulfil & Post-Closure Guards (FR-12, BR-10, D2) (935.3538ms)
â–¶ Slice C1 â€” Notification allow-list, deduplication & unread-only scoping (FR-09, ADR-08, ADR-10)
  âœ” rejects disallowed notification types (e.g. chat types) and stores duplicates only once (136.7388ms)
  âœ” user sees only own unread notifications; marking read clears them and does not affect others (198.6251ms)
  âœ” B1â€“B3 end-to-end: create, respond, approve, and cancel create expected notifications for the right users only without contact details (341.4004ms)
âœ” Slice C1 â€” Notification allow-list, deduplication & unread-only scoping (FR-09, ADR-08, ADR-10) (702.1613ms)
â–¶ Slice C2 â€” Invitation guards
  âœ” self-invite is rejected with 400 (209.1008ms)
  âœ” invite to deactivated user is rejected with 400 (237.7577ms)
  âœ” second pending invite in the same direction is rejected with 409 (330.9428ms)
  âœ” second pending invite in the reverse direction is also rejected with 409 (332.2421ms)
  âœ” BVA reject wait: 23h59m blocked (409), 24h00m allowed (201) (351.4141ms)
âœ” Slice C2 â€” Invitation guards (1487.768ms)
â–¶ Slice C2 â€” Non-participant access
  âœ” non-participant GET history returns 403 (500.0518ms)
  âœ” non-participant POST message returns 403 (515.1741ms)
âœ” Slice C2 â€” Non-participant access (1015.4904ms)
â–¶ Slice C2 â€” Message BVA
  âœ” BVA message length: 0 â†’ 400; 1 â†’ 201; 1000 â†’ 201; 1001 â†’ 400; whitespace-only â†’ 400 (359.6351ms)
âœ” Slice C2 â€” Message BVA (359.8072ms)
â–¶ Slice C2 â€” Restriction rules
  âœ” restricted pair: messages blocked (409), new invites blocked (409), history readable by both (373.171ms)
  âœ” non-restrictor (A) cannot remove B's restriction (403); B (restrictor) can remove it (347.7765ms)
  âœ” after restriction removed, messaging stays blocked (requiresReinvite); new invite + accept unblocks it (403.6529ms)
âœ” Slice C2 â€” Restriction rules (1124.8345ms)
â–¶ Slice C3 â€” Independent reporter rules & BVA threshold (FR-14, FR-15, D7)
  âœ” BVA reports: 2 gives no restriction; 3 creates RestrictionRecord (+7d); 4th leaves expiresAt unchanged (996.1929ms)
  âœ” rejects duplicate report (409), reporter younger than 24h (403), and self-report (400) (513.0016ms)
  âœ” rejects client-supplied reporterId, count, or expiresAt with 403 and never returns reporterId (351.4898ms)
âœ” Slice C3 â€” Independent reporter rules & BVA threshold (FR-14, FR-15, D7) (1901.2814ms)
â–¶ Slice C3 â€” Restriction enforcement, BVA expiry & allowed actions
  âœ” blocks restricted user from creating STANDARD, URGENT, and EMERGENCY requests with expiry and precautionary wording (716.8153ms)
  âœ” BVA expiry: still restricted at 6d 23h59m, allowed at 7d 00h00m (771.3106ms)
  âœ” restricted user can still search donors, respond to requests, chat, and edit profile (959.5929ms)
âœ” Slice C3 â€” Restriction enforcement, BVA expiry & allowed actions (2448.0923ms)
â„¹ tests 90
â„¹ suites 32
â„¹ pass 90
â„¹ fail 0
â„¹ cancelled 0
â„¹ skipped 0
â„¹ todo 0
â„¹ duration_ms 22311.3668

```
