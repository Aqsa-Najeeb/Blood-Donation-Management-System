"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { getTestPrisma, resetTestDb, createTestUser, loginTestUser } = require("./helpers");
const createApp = require("../backend/app");
const { setNow } = require("../backend/utils/clock");

const prisma = getTestPrisma();
const app = createApp(prisma, { skipRateLimiters: true });
const rateLimitedApp = createApp(prisma, { skipRateLimiters: false });

const BASE_NOW = new Date("2026-11-27T12:00:00Z");
const OLD_ACCOUNT_AT = new Date(BASE_NOW.getTime() - 48 * 60 * 60 * 1000);

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

before(async () => {
  await resetTestDb(prisma);
});

after(async () => {
  setNow(null);
  await prisma.$disconnect();
});

beforeEach(async () => {
  setNow(BASE_NOW);
  await resetTestDb(prisma);
});

describe("Security Verification & Vulnerability Fixes", () => {
  it("revokes JWT on POST /api/auth/logout and blocks token reuse", async () => {
    const user = await createTestUser(prisma);
    const loginRes = await loginTestUser(app, user.email, "Test1234");
    const token = loginRes.body.token;

    const beforeLogout = await request(app).get("/api/auth/me").set(auth(token));
    assert.equal(beforeLogout.status, 200);

    const logoutRes = await request(app).post("/api/auth/logout").set(auth(token));
    assert.equal(logoutRes.status, 200);

    const afterLogout = await request(app).get("/api/auth/me").set(auth(token));
    assert.equal(afterLogout.status, 401);
  });

  it("blocks deactivated user tokens across donors, chats, alerts, notifications, and password endpoints", async () => {
    const user = await createTestUser(prisma);
    const other = await createTestUser(prisma, { isDonor: true, available: true });
    const loginRes = await loginTestUser(app, user.email, "Test1234");
    const token = loginRes.body.token;

    const delRes = await request(app).delete("/api/settings/account").set(auth(token));
    assert.equal(delRes.status, 200);

    const checks = await Promise.all([
      request(app).get("/api/donors").set(auth(token)),
      request(app).post(`/api/donors/${other.id}/contact`).set(auth(token)),
      request(app).get("/api/chats").set(auth(token)),
      request(app).get("/api/donor/alerts").set(auth(token)),
      request(app).get("/api/notifications").set(auth(token)),
      request(app)
        .put("/api/settings/password")
        .set(auth(token))
        .send({ currentPassword: "Test1234", newPassword: "NewPassword1" }),
    ]);

    for (const res of checks) {
      assert.equal(res.status, 401);
    }
  });

  it("protects unavailable donor phone numbers on POST /api/donors/:id/contact", async () => {
    const caller = await createTestUser(prisma);
    const unavailableDonor = await createTestUser(prisma, {
      isDonor: true,
      available: false,
      phone: "+92 300 5551234",
    });
    const loginRes = await loginTestUser(app, caller.email, "Test1234");

    const res = await request(app)
      .post(`/api/donors/${unavailableDonor.id}/contact`)
      .set(auth(loginRes.body.token));
    assert.equal(res.status, 404);
    assert.equal(res.body.phone, undefined);
  });

  it("rejects requester decisions on CLOSED blood requests", async () => {
    const requester = await createTestUser(prisma, { bloodGroup: "O+" });
    const donor = await createTestUser(prisma, {
      isDonor: true,
      available: true,
      bloodGroup: "O+",
      city: "Lahore",
      area: "Model Town",
    });

    const reqToken = (await loginTestUser(app, requester.email, "Test1234")).body.token;
    const donorToken = (await loginTestUser(app, donor.email, "Test1234")).body.token;

    const createRes = await request(app).post("/api/requests").set(auth(reqToken)).send({
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
    assert.equal(createRes.status, 201);
    const reqId = createRes.body.request.id;

    const respondRes = await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set(auth(donorToken))
      .send({ donorResponse: "ACCEPTED" });
    assert.equal(respondRes.status, 200);
    const respId = respondRes.body.request.responses[0].id;

    const cancelRes = await request(app)
      .post(`/api/requests/${reqId}/cancel`)
      .set(auth(reqToken));
    assert.equal(cancelRes.status, 200);

    const decideRes = await request(app)
      .patch(`/api/requests/${reqId}/decide/${respId}`)
      .set(auth(reqToken))
      .send({ requesterDecision: "APPROVED" });
    assert.equal(decideRes.status, 409);
  });

  it("prevents concurrent POST /api/requests from exceeding max 3 OPEN requests", async () => {
    const requester = await createTestUser(prisma, { bloodGroup: "A+" });
    const token = (await loginTestUser(app, requester.email, "Test1234")).body.token;

    const payload = {
      bloodGroup: "A+",
      hospital: "Services Hospital",
      city: "Lahore",
      area: "Model Town",
      radius: 10,
      requiredDate: "2026-11-28",
      units: 1,
      urgency: "STANDARD",
      contactPhone: "+92 300 1112233",
    };

    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        request(app).post("/api/requests").set(auth(token)).send(payload)
      )
    );

    const createdCount = results.filter((r) => r.status === 201).length;
    assert.ok(createdCount <= 3, `Expected at most 3 created, got ${createdCount}`);
    const dbCount = await prisma.bloodRequest.count({
      where: { requesterId: requester.id, status: "OPEN" },
    });
    assert.ok(dbCount <= 3, `Expected at most 3 OPEN requests in DB, got ${dbCount}`);
  });

  it("prevents concurrent reports from creating duplicate RestrictionRecords", async () => {
    const target = await createTestUser(prisma, { createdAt: OLD_ACCOUNT_AT });
    const reporters = await Promise.all(
      Array.from({ length: 4 }, () => createTestUser(prisma, { createdAt: OLD_ACCOUNT_AT }))
    );
    const tokens = await Promise.all(
      reporters.map(async (u) => (await loginTestUser(app, u.email, "Test1234")).body.token)
    );

    const results = await Promise.all(
      tokens.map((tok) =>
        request(app).post("/api/reports").set(auth(tok)).send({
          targetUserId: target.id,
          category: "HARASSMENT",
          reason: "Repeated unsolicited messages and harassment.",
        })
      )
    );

    for (const r of results) {
      assert.equal(r.status, 201);
    }

    const restrictionCount = await prisma.restrictionRecord.count({
      where: { userId: target.id },
    });
    assert.equal(restrictionCount, 1);
  });

  it("strips HTML/XSS payloads, rejects oversized JSON (>32kb), and enforces contact rate limit", async () => {
    const user = await createTestUser(prisma);
    const donor = await createTestUser(prisma, { isDonor: true, available: true });
    const token = (await loginTestUser(rateLimitedApp, user.email, "Test1234")).body.token;

    // XSS stripping on profile update
    const xssRes = await request(rateLimitedApp)
      .put("/api/settings")
      .set(auth(token))
      .send({ name: '<script>alert("xss")</script>Ali Khan' });
    assert.equal(xssRes.status, 200);
    assert.equal(xssRes.body.user.name.includes("<script>"), false);

    // Oversized payload > 32kb
    const hugeRes = await request(rateLimitedApp)
      .put("/api/settings")
      .set(auth(token))
      .send({ name: "A".repeat(40000) });
    assert.equal(hugeRes.status, 413);

    // Contact endpoint rate limiting (max 15 per 15m)
    let hit429 = false;
    for (let i = 0; i < 17; i++) {
      const r = await request(rateLimitedApp)
        .post(`/api/donors/${donor.id}/contact`)
        .set(auth(token));
      if (r.status === 429) {
        hit429 = true;
        break;
      }
    }
    assert.equal(hit429, true);
  });
});
