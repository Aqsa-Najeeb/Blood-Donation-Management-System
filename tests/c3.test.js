"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { getTestPrisma, resetTestDb, createTestUser, loginTestUser } = require("./helpers");
const createApp = require("../backend/app");
const { setNow } = require("../backend/utils/clock");
const { isRestricted, setRestrictionOverride } = require("../backend/modules/restrictions");

const prisma = getTestPrisma();
const app = createApp(prisma, { skipRateLimiters: true });

const BASE_NOW = new Date("2026-11-27T12:00:00Z");
const OLD_ACCOUNT_AT = new Date(BASE_NOW.getTime() - 48 * 60 * 60 * 1000); // 48h old

async function createAgedUserAndLogin(overrides = {}) {
  const u = await createTestUser(prisma, { createdAt: OLD_ACCOUNT_AT, ...overrides });
  const loginRes = await loginTestUser(app, u.email, "Test1234");
  return { user: u, token: loginRes.body.token };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

before(async () => {
  setRestrictionOverride(null);
  await resetTestDb(prisma);
});

after(async () => {
  setNow(null);
  setRestrictionOverride(null);
  await prisma.$disconnect();
});

beforeEach(async () => {
  setNow(BASE_NOW);
  setRestrictionOverride(null);
  await resetTestDb(prisma);
});

describe("Slice C3 — Independent reporter rules & BVA threshold (FR-14, FR-15, D7)", () => {
  it("BVA reports: 2 gives no restriction; 3 creates RestrictionRecord (+7d); 4th leaves expiresAt unchanged", async () => {
    const { user: target } = await createAgedUserAndLogin();
    const r1 = await createAgedUserAndLogin();
    const r2 = await createAgedUserAndLogin();
    const r3 = await createAgedUserAndLogin();
    const r4 = await createAgedUserAndLogin();

    const payload = (targetUserId) => ({
      targetUserId,
      category: "HARASSMENT",
      reason: "Sending abusive messages in chat repeatedly.",
    });

    // 1st report
    const res1 = await request(app).post("/api/reports").set(auth(r1.token)).send(payload(target.id));
    assert.equal(res1.status, 201);
    assert.equal(res1.body.autoRestricted, false);
    assert.equal(await isRestricted(target.id), false);

    // 2nd report — still not restricted
    const res2 = await request(app).post("/api/reports").set(auth(r2.token)).send(payload(target.id));
    assert.equal(res2.status, 201);
    assert.equal(res2.body.autoRestricted, false);
    assert.equal(await isRestricted(target.id), false);

    // 3rd report — triggers RestrictionRecord (7 days)
    const res3 = await request(app).post("/api/reports").set(auth(r3.token)).send(payload(target.id));
    assert.equal(res3.status, 201);
    assert.equal(res3.body.autoRestricted, true);
    assert.equal(await isRestricted(target.id), true);

    const recordsAfter3 = await prisma.restrictionRecord.findMany({ where: { userId: target.id } });
    assert.equal(recordsAfter3.length, 1);
    const expectedExpiry = new Date(BASE_NOW.getTime() + 7 * 24 * 60 * 60 * 1000);
    assert.equal(recordsAfter3[0].expiresAt.getTime(), expectedExpiry.getTime());

    // Advance clock 1 hour, 4th report arrives — must NOT extend expiry
    setNow(new Date(BASE_NOW.getTime() + 60 * 60 * 1000));
    const res4 = await request(app).post("/api/reports").set(auth(r4.token)).send(payload(target.id));
    assert.equal(res4.status, 201);

    const recordsAfter4 = await prisma.restrictionRecord.findMany({ where: { userId: target.id } });
    assert.equal(recordsAfter4.length, 1, "4th report must not create a second restriction");
    assert.equal(recordsAfter4[0].expiresAt.getTime(), expectedExpiry.getTime(), "4th report must not extend expiry");
  });

  it("rejects duplicate report (409), reporter younger than 24h (403), and self-report (400)", async () => {
    const { user: target, token: targetToken } = await createAgedUserAndLogin();
    const { token: oldToken } = await createAgedUserAndLogin();

    // Young account (23h59m old)
    const youngCreatedAt = new Date(BASE_NOW.getTime() - (23 * 60 * 60 * 1000 + 59 * 60 * 1000));
    const { token: youngToken } = await createAgedUserAndLogin({ createdAt: youngCreatedAt });

    // Self-report -> 400
    const selfRes = await request(app).post("/api/reports").set(auth(targetToken)).send({
      targetUserId: target.id,
      category: "HARASSMENT",
      reason: "Testing self report rejection.",
    });
    assert.equal(selfRes.status, 400);

    // Young reporter (<24h) -> 403
    const youngRes = await request(app).post("/api/reports").set(auth(youngToken)).send({
      targetUserId: target.id,
      category: "HARASSMENT",
      reason: "Reporter account is younger than 24 hours.",
    });
    assert.equal(youngRes.status, 403);

    // Valid report -> 201
    const okRes = await request(app).post("/api/reports").set(auth(oldToken)).send({
      targetUserId: target.id,
      category: "FALSE_DONOR_INFO",
      reason: "Profile blood group does not match reality.",
    });
    assert.equal(okRes.status, 201);

    // Duplicate report -> 409
    const dupRes = await request(app).post("/api/reports").set(auth(oldToken)).send({
      targetUserId: target.id,
      category: "HARASSMENT",
      reason: "Trying to report the same user a second time.",
    });
    assert.equal(dupRes.status, 409);
  });

  it("rejects client-supplied reporterId, count, or expiresAt with 403 and never returns reporterId", async () => {
    const { user: target } = await createAgedUserAndLogin();
    const { user: reporter, token: repToken } = await createAgedUserAndLogin();

    for (const badField of ["reporterId", "count", "expiresAt", "restrictedUntil"]) {
      const badRes = await request(app).post("/api/reports").set(auth(repToken)).send({
        targetUserId: target.id,
        category: "SUSPICIOUS_ACTIVITY",
        reason: "Attempting to tamper with report fields.",
        [badField]: 999,
      });
      assert.equal(badRes.status, 403, `Should reject ${badField}`);
    }

    const okRes = await request(app).post("/api/reports").set(auth(repToken)).send({
      targetUserId: target.id,
      category: "SUSPICIOUS_ACTIVITY",
      reason: "Valid report to verify no reporterId in response.",
    });
    assert.equal(okRes.status, 201);
    const bodyStr = JSON.stringify(okRes.body);
    assert.ok(!bodyStr.includes("reporterId"), "Response must never contain reporterId");
    assert.ok(!bodyStr.includes(String(reporter.id)), "Response must never leak reporter user id");
  });
});

describe("Slice C3 — Restriction enforcement, BVA expiry & allowed actions", () => {
  async function triggerRestriction(targetId) {
    for (let i = 0; i < 3; i++) {
      const { token } = await createAgedUserAndLogin();
      await request(app).post("/api/reports").set(auth(token)).send({
        targetUserId: targetId,
        category: "INAPPROPRIATE_CONTENT",
        reason: `Independent report number ${i + 1} with sufficient detail.`,
      });
    }
  }

  it("blocks restricted user from creating STANDARD, URGENT, and EMERGENCY requests with expiry and precautionary wording", async () => {
    const { user: target, token: targetToken } = await createAgedUserAndLogin();
    await triggerRestriction(target.id);

    for (const urgency of ["STANDARD", "URGENT", "EMERGENCY"]) {
      const res = await request(app).post("/api/requests").set(auth(targetToken)).send({
        bloodGroup: "O+",
        hospital: "Mayo Hospital",
        city: "Lahore",
        area: "Model Town",
        radius: 10,
        requiredDate: "2026-11-28",
        units: 1,
        urgency,
        contactPhone: "+92 300 1234567",
      });
      assert.equal(res.status, 403, `Urgency ${urgency} must be blocked`);
      assert.ok(res.body.restrictedUntil, "Should include restrictedUntil expiry date");
      assert.match(res.body.error, /precautionary/i);
      assert.match(res.body.error, /not a verified finding/i);
    }
  });

  it("BVA expiry: still restricted at 6d 23h59m, allowed at 7d 00h00m", async () => {
    const { user: target, token: targetToken } = await createAgedUserAndLogin();
    await triggerRestriction(target.id);

    // 6 days 23 hours 59 minutes after BASE_NOW -> still restricted
    setNow(new Date(BASE_NOW.getTime() + (6 * 24 * 60 + 23 * 60 + 59) * 60 * 1000));
    assert.equal(await isRestricted(target.id), true);
    const blockedRes = await request(app).post("/api/requests").set(auth(targetToken)).send({
      bloodGroup: "O+",
      hospital: "Mayo Hospital",
      city: "Lahore",
      area: "Model Town",
      radius: 10,
      requiredDate: "2026-12-10",
      units: 1,
      urgency: "STANDARD",
      contactPhone: "+92 300 1234567",
    });
    assert.equal(blockedRes.status, 403);

    // Exactly 7 days 00 hours 00 minutes -> restriction expired, allowed!
    setNow(new Date(BASE_NOW.getTime() + 7 * 24 * 60 * 60 * 1000));
    assert.equal(await isRestricted(target.id), false);
    const allowedRes = await request(app).post("/api/requests").set(auth(targetToken)).send({
      bloodGroup: "O+",
      hospital: "Mayo Hospital",
      city: "Lahore",
      area: "Model Town",
      radius: 10,
      requiredDate: "2026-12-10",
      units: 1,
      urgency: "STANDARD",
      contactPhone: "+92 300 1234567",
    });
    assert.equal(allowedRes.status, 201);
  });

  it("restricted user can still search donors, respond to requests, chat, and edit profile", async () => {
    const { user: target, token: targetToken } = await createAgedUserAndLogin({
      isDonor: true,
      available: true,
      bloodGroup: "O+",
      city: "Lahore",
      area: "Model Town",
    });
    const { user: other, token: otherToken } = await createAgedUserAndLogin({
      bloodGroup: "O+",
      city: "Lahore",
      area: "Model Town",
    });

    // Create a request by other user so target gets a RequestResponse row
    const reqRes = await request(app).post("/api/requests").set(auth(otherToken)).send({
      bloodGroup: "O+",
      hospital: "Jinnah Hospital",
      city: "Lahore",
      area: "Model Town",
      radius: 10,
      requiredDate: "2026-11-28",
      units: 1,
      urgency: "URGENT",
      contactPhone: "+92 300 7654321",
    });
    assert.equal(reqRes.status, 201);
    const reqId = reqRes.body.request.id;

    // Now restrict target
    await triggerRestriction(target.id);
    assert.equal(await isRestricted(target.id), true);

    // 1. Search donors works
    const searchRes = await request(app)
      .get("/api/donors?bloodGroup=O%2B&city=Lahore&area=Model%20Town&radius=10")
      .set(auth(targetToken));
    assert.equal(searchRes.status, 200);

    // 2. Respond to request works
    const respondRes = await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set(auth(targetToken))
      .send({ donorResponse: "ACCEPTED" });
    assert.equal(respondRes.status, 200);

    // 3. Chat invitation works
    const chatRes = await request(app)
      .post("/api/chats/invitations")
      .set(auth(targetToken))
      .send({ recipientId: other.id });
    assert.equal(chatRes.status, 201);

    // 4. Edit profile works
    const profRes = await request(app)
      .put("/api/profile")
      .set(auth(targetToken))
      .send({
        name: "Updated Restricted Name",
        bloodGroup: "O+",
        city: "Lahore",
        area: "Model Town",
        phone: "+92 300 1234567",
      });
    assert.equal(profRes.status, 200);
    assert.ok(!JSON.stringify(profRes.body).includes("reporterId"));
  });
});
